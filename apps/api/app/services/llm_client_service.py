from dataclasses import dataclass
from decimal import Decimal

from fastapi import HTTPException, status

from app.models.enums import AiProvider


@dataclass
class LlmResponse:
    output_text: str
    output_json: dict | None = None
    tokens_input: int | None = None
    tokens_output: int | None = None
    estimated_cost: Decimal | None = None
    model_name: str | None = None


class LlmClientService:
    async def generate_analysis(
        self,
        *,
        provider: AiProvider,
        api_key: str,
        model_name: str | None,
        system_prompt: str,
        user_prompt: str,
    ) -> LlmResponse:
        if provider != AiProvider.OPENAI:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail=f"AI provider {provider.value} is not implemented yet",
            )
        return await self._generate_openai(
            api_key=api_key,
            model_name=model_name or "gpt-4o-mini",
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

    async def _generate_openai(
        self,
        *,
        api_key: str,
        model_name: str,
        system_prompt: str,
        user_prompt: str,
    ) -> LlmResponse:
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=api_key)
            response = await client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI provider request failed",
            ) from exc

        output_text = response.choices[0].message.content or ""
        usage = getattr(response, "usage", None)
        return LlmResponse(
            output_text=output_text,
            output_json=None,
            tokens_input=getattr(usage, "prompt_tokens", None) if usage else None,
            tokens_output=getattr(usage, "completion_tokens", None) if usage else None,
            estimated_cost=None,
            model_name=model_name,
        )
