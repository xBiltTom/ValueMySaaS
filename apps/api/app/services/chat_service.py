import json
from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import ChatRole, ConversationStatus
from app.repositories.chat_message_repository import ChatMessageRepository
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.schemas.chat_message import ChatMessageListResponse, SendChatMessageRequest, SendChatMessageResponse
from app.services.ai_context_service import AiContextService
from app.services.ai_key_service import AiProviderKeyService
from app.services.llm_client_service import LlmClientService

CHAT_PROMPT_VERSION = "v1"

CHAT_SYSTEM_PROMPT = """Eres el analizador conversacional de ValueMySaaS.
Tu funcion es ayudar al usuario a entender y mejorar su SaaS o idea de SaaS usando exclusivamente el contexto proporcionado.
Actuas como si el usuario estuviera hablando con su propio SaaS desde la perspectiva de gestion de servicios TI.
Debes explicar metricas, riesgos, valor del servicio, continuidad, desempeno, retencion, crecimiento y mejora continua.
No inventes metricas ni datos.
Si faltan datos, dilo explicitamente.
No prometas exito ni des asesoria financiera garantizada.
Responde en espanol, de forma clara, accionable y priorizada."""


class ChatService:
    def __init__(
        self,
        saas_project_repository: SaasProjectRepository,
        conversation_repository: ConversationRepository,
        chat_message_repository: ChatMessageRepository,
        ai_key_service: AiProviderKeyService,
        ai_context_service: AiContextService,
        llm_client_service: LlmClientService,
    ) -> None:
        self.saas_project_repository = saas_project_repository
        self.conversation_repository = conversation_repository
        self.chat_message_repository = chat_message_repository
        self.ai_key_service = ai_key_service
        self.ai_context_service = ai_context_service
        self.llm_client_service = llm_client_service

    async def list_messages(
        self,
        *,
        project_id: UUID,
        conversation_id: UUID,
        owner_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> ChatMessageListResponse:
        conversation = await self._get_owned_conversation(
            project_id=project_id,
            conversation_id=conversation_id,
            owner_id=owner_id,
        )
        items = await self.chat_message_repository.list_by_conversation(
            conversation_id=conversation.id,
            limit=limit,
            offset=offset,
        )
        total = await self.chat_message_repository.count_by_conversation(conversation_id=conversation.id)
        return ChatMessageListResponse(items=items, total=total, limit=limit, offset=offset)

    async def send_message(
        self,
        *,
        project_id: UUID,
        conversation_id: UUID,
        owner_id: UUID,
        payload: SendChatMessageRequest,
    ) -> SendChatMessageResponse:
        conversation = await self._get_owned_conversation(
            project_id=project_id,
            conversation_id=conversation_id,
            owner_id=owner_id,
        )
        if conversation.status != ConversationStatus.ACTIVE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Conversation is not active")

        key, api_key = await self.ai_key_service.get_decrypted_key_for_user(
            key_id=payload.ai_key_id,
            user_id=owner_id,
        )
        user_message = await self.chat_message_repository.create(
            data={
                "conversation_id": conversation.id,
                "role": ChatRole.USER,
                "content": payload.message,
                "message_metadata": {
                    "model_name_requested": payload.model_name,
                    "ai_key_id": str(payload.ai_key_id),
                },
            }
        )
        context = await self.ai_context_service.build_context(project_id=project_id, owner_id=owner_id)
        recent_messages = await self.chat_message_repository.list_recent_by_conversation(
            conversation_id=conversation.id,
            limit=10,
        )
        user_prompt = self._build_user_prompt(
            context=context,
            recent_messages=recent_messages,
            current_message=payload.message,
        )
        llm_response = await self.llm_client_service.generate_analysis(
            provider=key.provider,
            api_key=api_key,
            model_name=payload.model_name,
            system_prompt=CHAT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )
        assistant_message = await self.chat_message_repository.create(
            data={
                "conversation_id": conversation.id,
                "role": ChatRole.ASSISTANT,
                "content": llm_response.output_text,
                "message_metadata": {
                    "provider": key.provider.value,
                    "model_name": llm_response.model_name,
                    "prompt_version": CHAT_PROMPT_VERSION,
                    "tokens_input": llm_response.tokens_input,
                    "tokens_output": llm_response.tokens_output,
                },
                "token_count": llm_response.tokens_output,
            }
        )
        await self.conversation_repository.update(
            conversation=conversation,
            data={
                "provider": key.provider,
                "model_name": llm_response.model_name,
                "system_prompt_version": CHAT_PROMPT_VERSION,
            },
        )
        return SendChatMessageResponse(
            conversation_id=conversation.id,
            user_message=user_message,
            assistant_message=assistant_message,
            model_name=llm_response.model_name or payload.model_name or "",
            provider=key.provider,
        )

    async def _get_owned_conversation(self, *, project_id: UUID, conversation_id: UUID, owner_id: UUID):
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        conversation = await self.conversation_repository.get_by_id_for_project_user(
            conversation_id=conversation_id,
            saas_project_id=project_id,
            user_id=owner_id,
        )
        if conversation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        return conversation

    async def _ensure_project_owned(self, *, project_id: UUID, owner_id: UUID) -> None:
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")

    def _build_user_prompt(self, *, context: dict, recent_messages: list, current_message: str) -> str:
        history_lines = []
        for message in recent_messages:
            if message.role == ChatRole.SYSTEM:
                continue
            role = "Usuario" if message.role == ChatRole.USER else "Asistente"
            history_lines.append(f"{role}: {message.content}")
        history = "\n".join(history_lines[-10:])
        return (
            "Contexto estructurado del SaaS:\n"
            f"{json.dumps(context, ensure_ascii=False, indent=2)}\n\n"
            "Historial reciente:\n"
            f"{history or 'Sin historial previo.'}\n\n"
            "Pregunta actual:\n"
            f"{current_message}"
        )
