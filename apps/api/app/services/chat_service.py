"""Chat service con memoria conversacional usando ventana deslizante.

Estrategia de memoria (sin RAG):
1. Si total_messages <= context_window_size: enviar todo el historial.
2. Si total_messages > context_window_size:
   - Si hay summary: enviar resumen + últimos N mensajes.
   - Si no hay summary: generar uno con el LLM y guardarlo.
3. Cada turno incrementa total_messages en el modelo.

El sistema de créditos se aplica igual que en el análisis de IA.
"""
import json
import logging
from uuid import UUID

from fastapi import HTTPException, status

from app.db.session import AsyncSessionLocal
from app.models.enums import ChatRole, ConversationStatus, CreditReason
from app.repositories.ai_key_repository import AiProviderKeyRepository
from app.repositories.chat_message_repository import ChatMessageRepository
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.credit_transaction_repository import CreditTransactionRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.system_ai_key_repository import SystemAiKeyRepository
from app.repositories.system_config_repository import SystemConfigRepository
from app.repositories.user_repository import UserRepository
from app.schemas.chat_message import ChatMessageListResponse, SendChatMessageRequest, SendChatMessageResponse
from app.services.ai_context_service import AiContextService
from app.services.credit_service import CreditService
from app.services.llm_client_service import LlmClientService

logger = logging.getLogger(__name__)

CHAT_PROMPT_VERSION = "v2"

# Número mínimo de mensajes recientes a incluir siempre
RECENT_MESSAGES_WINDOW = 10

CHAT_SYSTEM_PROMPT = """Eres el mentor principal y asistente conversacional experto de ValueMySaaS.
Tu objetivo es ayudar al usuario (el emprendedor/estudiante de Ingeniería de Sistemas) a entender, iterar y escalar su proyecto SaaS de forma exitosa.

PERFIL Y TONO:
- Eres amable, empático y hablas fluido, como si fueras un colega o mentor experimentado tomando un café con el emprendedor. NO suenes como un robot o un libro de texto.
- Evita las listas enumeradas estilo "manual de instrucciones" a menos que sea estrictamente necesario. Prefiere párrafos conversacionales.
- Conoces el nombre del usuario (lo encontrarás en el contexto), pero ÚSALO CON MODERACIÓN (no lo repitas en cada mensaje para no sonar artificial).
- Usa el "Contexto del proyecto SaaS" (métricas, veredictos previos, alertas) para dar respuestas ultra-personalizadas. Demuestra que conoces su proyecto a fondo.

REGLAS CRÍTICAS DE COMPORTAMIENTO:
1. Responde de manera natural. Si el usuario te saluda, salúdalo por su nombre y pregúntale cómo va el proyecto.
2. Mantente SIEMPRE en el dominio de SaaS (Software as a Service), startups, tecnología, negocios, modelos de suscripción o el proyecto específico del usuario.
3. Si el usuario te pregunta cosas fuera de contexto (ej. recetas de cocina), declina educadamente enfocando la charla en su producto.
4. Explica conceptos clave (MRR, Churn, CAC, LTV) de forma sencilla si ves que el proyecto flaquea en ellos.
5. Usa el historial (snapshot_history y score_history) para detectar tendencias. Si notas que el MRR sube o el churn baja, felicítalo o dale un consejo basado en esa evolución temporal.
6. No inventes métricas. Si no hay datos, pídeselos o sugiérele registrarlos en la plataforma.
7. Responde siempre en español. No repitas respuestas previas; mantén la charla fresca y continua."""

SUMMARY_SYSTEM_PROMPT = """Resume el siguiente historial de conversación en máximo 150 palabras.
Conserva los puntos clave: decisiones tomadas, problemas identificados y recomendaciones dadas.
El resumen se usará como contexto para continuar la conversación.
Responde solo con el resumen, sin introducción."""


class ChatService:
    def __init__(
        self,
        saas_project_repository: SaasProjectRepository,
        conversation_repository: ConversationRepository,
        chat_message_repository: ChatMessageRepository,
        credit_service: CreditService,
        ai_context_service: AiContextService,
        llm_client_service: LlmClientService,
        user_repository: UserRepository,
    ) -> None:
        self.saas_project_repository = saas_project_repository
        self.conversation_repository = conversation_repository
        self.chat_message_repository = chat_message_repository
        self.credit_service = credit_service
        self.ai_context_service = ai_context_service
        self.llm_client_service = llm_client_service
        self.user_repository = user_repository

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
        total = await self.chat_message_repository.count_by_conversation(
            conversation_id=conversation.id
        )
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La conversación no está activa.",
            )

        # Resolver credenciales LLM (BYOK o créditos del sistema)
        user = await self.user_repository.get_by_id(owner_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

        credentials = await self.credit_service.resolve_llm_credentials(
            user=user,
            ai_key_id=payload.ai_key_id,
            use_system_credits=payload.use_system_credits,
        )

        # Guardar el mensaje del usuario
        actual_message = payload.message or (payload.messages[-1].get("content", "") if payload.messages else "")
        user_message = await self.chat_message_repository.create(
            data={
                "conversation_id": conversation.id,
                "role": ChatRole.USER,
                "content": actual_message,
                "message_metadata": {
                    "model_name_requested": payload.model_name,
                    "used_byok": not credentials.credit_used,
                },
            }
        )

        # Construir contexto del proyecto
        try:
            context = await self.ai_context_service.build_context(
                project_id=project_id, owner_id=owner_id
            )
        except HTTPException:
            context = {}

        # Obtener historial y construir los mensajes para el LLM
        recent_messages = await self.chat_message_repository.list_recent_by_conversation(
            conversation_id=conversation.id,
            limit=RECENT_MESSAGES_WINDOW + 1,  # +1 para excluir el recién guardado
        )
        # El mensaje recién guardado ya está incluido, excluirlo del historial
        history_messages = [m for m in recent_messages if m.id != user_message.id]

        user_prompt = await self._build_user_prompt(
            conversation=conversation,
            context=context,
            history_messages=history_messages,
            current_message=actual_message,
            credentials=credentials,
            owner_id=owner_id,
        )

        # Llamar al LLM
        llm_response = await self.llm_client_service.generate_analysis(
            provider=credentials.provider,
            api_key=credentials.api_key,
            model_name=payload.model_name or credentials.model_name,
            system_prompt=CHAT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            fallback_keys=credentials.fallback_system_keys,
            user_agent=credentials.user_agent,
        )

        # Guardar la respuesta del asistente
        assistant_message = await self.chat_message_repository.create(
            data={
                "conversation_id": conversation.id,
                "role": ChatRole.ASSISTANT,
                "content": llm_response.output_text,
                "message_metadata": {
                    "provider": credentials.provider.value,
                    "model_name": llm_response.model_name,
                    "prompt_version": CHAT_PROMPT_VERSION,
                    "tokens_input": llm_response.tokens_input,
                    "tokens_output": llm_response.tokens_output,
                    "used_credits": credentials.credit_used,
                },
                "token_count": llm_response.tokens_output,
            }
        )

        # Incrementar contador de mensajes (1 usuario + 1 asistente = 2)
        new_total = conversation.total_messages + 2
        await self.conversation_repository.update(
            conversation=conversation,
            data={
                "provider": credentials.provider,
                "model_name": llm_response.model_name,
                "system_prompt_version": CHAT_PROMPT_VERSION,
                "total_messages": new_total,
            },
        )

        # Consumir crédito DESPUÉS de guardar (si se usó el sistema)
        if credentials.credit_used:
            await self.credit_service.consume_credit(
                user_id=owner_id,
                reason=CreditReason.CHAT_MESSAGE,
                description=f"Mensaje de chat — conversación {conversation.id}",
            )

        return SendChatMessageResponse(
            conversation_id=conversation.id,
            user_message=user_message,
            assistant_message=assistant_message,
            model_name=llm_response.model_name or payload.model_name or "",
            provider=credentials.provider,
        )

    async def stream_message(
        self,
        *,
        project_id: UUID,
        conversation_id: UUID,
        owner_id: UUID,
        payload: SendChatMessageRequest,
    ):
        conversation = await self._get_owned_conversation(
            project_id=project_id,
            conversation_id=conversation_id,
            owner_id=owner_id,
        )
        if conversation.status != ConversationStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La conversación no está activa.",
            )

        user = await self.user_repository.get_by_id(owner_id)
        credentials = await self.credit_service.resolve_llm_credentials(
            user=user,
            ai_key_id=payload.ai_key_id,
            use_system_credits=payload.use_system_credits,
        )

        actual_message = payload.message or (payload.messages[-1].get("content", "") if payload.messages else "")
        user_message = await self.chat_message_repository.create(
            data={
                "conversation_id": conversation.id,
                "role": ChatRole.USER,
                "content": actual_message,
                "message_metadata": {
                    "model_name_requested": payload.model_name,
                    "used_byok": not credentials.credit_used,
                },
            }
        )

        try:
            context = await self.ai_context_service.build_context(
                project_id=project_id, owner_id=owner_id
            )
        except HTTPException:
            context = {}

        recent_messages = await self.chat_message_repository.list_recent_by_conversation(
            conversation_id=conversation.id,
            limit=RECENT_MESSAGES_WINDOW + 1,
        )
        history_messages = [m for m in recent_messages if m.id != user_message.id]

        user_prompt = await self._build_user_prompt(
            conversation=conversation,
            context=context,
            history_messages=history_messages,
            current_message=actual_message,
            credentials=credentials,
            owner_id=owner_id,
        )

        resolved_model, chunk_generator = await self.llm_client_service.stream_analysis(
            provider=credentials.provider,
            api_key=credentials.api_key,
            model_name=payload.model_name or credentials.model_name,
            system_prompt=CHAT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            fallback_keys=credentials.fallback_system_keys,
            user_agent=credentials.user_agent,
        )

        async def event_generator():
            full_text = ""
            try:
                async for chunk in chunk_generator:
                    full_text += chunk
                    yield chunk
            except Exception as e:
                logger.error(f"Error in chat stream: {e}")
                yield f"\n[Error de generación: {str(e)}]\n"
                return

            # New session required: FastAPI closes the request session before the generator finishes.
            try:
                import logging
                logging.getLogger(__name__).info(f"DB COMMIT START: credit_used={credentials.credit_used}, provider={credentials.provider}, ai_key_id={payload.ai_key_id}")
                async with AsyncSessionLocal() as session:
                    chat_repo = ChatMessageRepository(session)
                    conv_repo = ConversationRepository(session)

                    await chat_repo.create(
                        data={
                            "conversation_id": conversation.id,
                            "role": ChatRole.ASSISTANT,
                            "content": full_text,
                            "message_metadata": {
                                "provider": credentials.provider.value,
                                "model_name": resolved_model,
                                "prompt_version": CHAT_PROMPT_VERSION,
                                "used_credits": credentials.credit_used,
                            },
                            "token_count": 0,
                        }
                    )
                    
                    conv = await conv_repo.get_by_id_for_project_user(
                        conversation_id=conversation_id, saas_project_id=project_id, user_id=owner_id
                    )
                    if conv:
                        new_total = conv.total_messages + 2
                        await conv_repo.update(
                            conversation=conv,
                            data={
                                "provider": credentials.provider,
                                "model_name": resolved_model,
                                "system_prompt_version": CHAT_PROMPT_VERSION,
                                "total_messages": new_total,
                            },
                        )
                    await session.commit()

                    if credentials.credit_used:
                        credit_svc = CreditService(
                            user_repository=UserRepository(session),
                            ai_key_repository=AiProviderKeyRepository(session),
                            system_ai_key_repository=SystemAiKeyRepository(session),
                            credit_transaction_repository=CreditTransactionRepository(session),
                            system_config_repository=SystemConfigRepository(session),
                        )
                        await credit_svc.consume_credit(
                            user_id=owner_id,
                            reason=CreditReason.CHAT_MESSAGE,
                            description=f"Mensaje de chat stream — conversación {conversation.id}",
                        )
                        await session.commit()
            except Exception as db_e:
                import traceback
                with open("/tmp/debug.log", "a") as f:
                    f.write(f"DB Error: {str(db_e)}\n{traceback.format_exc()}\n")
                logger.error(f"Error guardando historial del chat en DB: {db_e}")
                yield f"\n[Error interno guardando historial: {str(db_e)}]\n"

        return event_generator()

    async def _build_user_prompt(
        self,
        *,
        conversation,
        context: dict,
        history_messages: list,
        current_message: str,
        credentials,
        owner_id: UUID,
    ) -> str:
        """Construye el prompt con la estrategia de ventana deslizante.

        Si el historial supera el context_window_size, usa el resumen almacenado
        o genera uno nuevo con el LLM.
        """
        window_size = conversation.context_window_size or 20

        # Historial reciente (últimos RECENT_MESSAGES_WINDOW mensajes)
        recent = history_messages[-RECENT_MESSAGES_WINDOW:]
        history_lines = []
        for msg in recent:
            if msg.role == ChatRole.SYSTEM:
                continue
            role_label = "Estudiante" if msg.role == ChatRole.USER else "Asistente"
            history_lines.append(f"{role_label}: {msg.content}")
        history_text = "\n".join(history_lines) or "Sin historial previo."

        # Si hay demasiados mensajes, usar/generar resumen
        summary_text = ""
        if conversation.total_messages > window_size:
            if conversation.summary:
                summary_text = f"\n\n[Resumen de conversación anterior]:\n{conversation.summary}"
            else:
                # Generar resumen automáticamente (sin consumir créditos extra)
                summary = await self._generate_summary(
                    all_messages=history_messages,
                    credentials=credentials,
                )
                if summary:
                    await self.conversation_repository.update(
                        conversation=conversation,
                        data={"summary": summary},
                    )
                    summary_text = f"\n\n[Resumen de conversación anterior]:\n{summary}"

        context_text = json.dumps(context, ensure_ascii=False, indent=2) if context else "Sin datos disponibles."

        return (
            f"Contexto del proyecto SaaS:\n{context_text}"
            f"{summary_text}\n\n"
            f"Historial reciente:\n{history_text}\n\n"
            f"Pregunta del estudiante:\n{current_message}"
        )

    async def _generate_summary(
        self,
        *,
        all_messages: list,
        credentials,
    ) -> str | None:
        """Genera un resumen de conversación usando el LLM. Solo para compresión de contexto."""
        if not all_messages:
            return None
        lines = []
        for msg in all_messages:
            if msg.role == ChatRole.SYSTEM:
                continue
            role = "Usuario" if msg.role == ChatRole.USER else "Asistente"
            lines.append(f"{role}: {msg.content}")
        conversation_text = "\n".join(lines)
        try:
            response = await self.llm_client_service.generate_analysis(
                provider=credentials.provider,
                api_key=credentials.api_key,
                model_name=credentials.model_name,
                system_prompt=SUMMARY_SYSTEM_PROMPT,
                user_prompt=conversation_text,
                fallback_keys=credentials.fallback_system_keys,
                user_agent=credentials.user_agent,
            )
            return response.output_text.strip() or None
        except Exception as exc:
            logger.warning("No se pudo generar resumen de conversación: %s", exc)
            return None

    async def _get_owned_conversation(
        self, *, project_id: UUID, conversation_id: UUID, owner_id: UUID
    ):
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        conversation = await self.conversation_repository.get_by_id_for_project_user(
            conversation_id=conversation_id,
            saas_project_id=project_id,
            user_id=owner_id,
        )
        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversación no encontrada.",
            )
        return conversation

    async def _ensure_project_owned(self, *, project_id: UUID, owner_id: UUID) -> None:
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto SaaS no encontrado.",
            )
