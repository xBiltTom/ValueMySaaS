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
    """LiteLLM-backed BYOK client.

    OPENAI, GEMINI, ANTHROPIC and OPENROUTER resolve model names from the enum.
    OTHER is intentionally kept for additional LiteLLM providers such as Groq,
    NVIDIA NIM, Together or DeepInfra by requiring an explicit model prefix.
    This keeps the database enum stable while enabling multi-provider tests.
    """

    async def generate_analysis(
        self,
        *,
        provider: AiProvider,
        api_key: str,
        model_name: str | None,
        system_prompt: str,
        user_prompt: str,
    ) -> LlmResponse:
        resolved_model = self._resolve_litellm_model(provider=provider, model_name=model_name)
        response = await self._call_litellm(
            api_key=api_key,
            model_name=resolved_model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
        output_text = self._extract_output_text(response)
        usage = self._extract_usage(response)
        return LlmResponse(
            output_text=output_text,
            output_json=None,
            tokens_input=self._usage_value(usage, "prompt_tokens"),
            tokens_output=self._usage_value(usage, "completion_tokens"),
            estimated_cost=None,
            model_name=resolved_model,
        )

    def _resolve_litellm_model(self, *, provider: AiProvider, model_name: str | None) -> str:
        if provider == AiProvider.OPENAI:
            return model_name or "gpt-4o-mini"

        if provider == AiProvider.GEMINI:
            if not model_name:
                return "gemini/gemini-1.5-flash"
            return model_name if model_name.startswith("gemini/") else f"gemini/{model_name}"

        if provider == AiProvider.ANTHROPIC:
            if not model_name:
                return "anthropic/claude-3-5-haiku-20241022"
            return model_name if model_name.startswith("anthropic/") else f"anthropic/{model_name}"

        if provider == AiProvider.OPENROUTER:
            if not model_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="model_name is required for OPENROUTER, for example openrouter/meta-llama/llama-3.1-8b-instruct",
                )
            return model_name if model_name.startswith("openrouter/") else f"openrouter/{model_name}"

        if provider == AiProvider.OTHER:
            if not model_name or "/" not in model_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "model_name with an explicit LiteLLM provider prefix is required for OTHER. "
                        "Examples: groq/llama-3.1-8b-instant, "
                        "nvidia_nim/meta/llama-3.1-70b-instruct, together_ai/..., deepinfra/..."
                    ),
                )
            return model_name

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported AI provider")

    async def _call_litellm(
        self,
        *,
        api_key: str,
        model_name: str,
        system_prompt: str,
        user_prompt: str,
    ):
        try:
            from litellm import acompletion

            return await acompletion(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                api_key=api_key,
                temperature=0.2,
                drop_params=True,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI provider request failed",
            ) from exc

    def _extract_output_text(self, response) -> str:
        try:
            return response.choices[0].message.content or ""
        except AttributeError:
            choices = response.get("choices", [])
            if not choices:
                return ""
            message = choices[0].get("message", {})
            return message.get("content") or ""

    def _extract_usage(self, response):
        if hasattr(response, "usage"):
            return response.usage
        if isinstance(response, dict):
            return response.get("usage")
        return None

    def _usage_value(self, usage, key: str) -> int | None:
        if usage is None:
            return None
        if hasattr(usage, key):
            return getattr(usage, key)
        if isinstance(usage, dict):
            return usage.get(key)
        return None
