import logging
from typing import AsyncGenerator
import g4f

logger = logging.getLogger(__name__)

class ChatGptWebClientError(Exception):
    pass

class ChatGptWebSessionExpiredError(ChatGptWebClientError):
    pass

class ChatGptWebClient:
    def __init__(self) -> None:
        pass

    async def send_message(
        self,
        *,
        session_token: str,
        system_prompt: str,
        user_prompt: str,
        user_agent: str | None = None,
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_prompt})
        
        try:
            client = g4f.client.AsyncClient()
            response = await client.chat.completions.create(
                model=g4f.models.default,
                messages=messages,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error("g4f error: %s", e)
            raise ChatGptWebClientError(f"Error de G4F: {str(e)}")

    async def stream_message(
        self,
        *,
        session_token: str,
        system_prompt: str,
        user_prompt: str,
        user_agent: str | None = None,
    ) -> AsyncGenerator[str, None]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_prompt})
        
        try:
            client = g4f.client.AsyncClient()
            response = client.chat.completions.create(
                model=g4f.models.default,
                messages=messages,
                stream=True
            )
            async for chunk in response:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        yield delta
        except Exception as exc:
            logger.error("g4f stream error: %s", exc)
            yield f"\n[Error G4F: {exc}]\n"

    async def close(self) -> None:
        pass
