import logging
from dataclasses import dataclass
from decimal import Decimal

from fastapi import HTTPException, status

from app.models.enums import AiProvider

logger = logging.getLogger(__name__)


class ProviderKeyError(Exception):
    """El proveedor rechazó esta key (rate limit o autenticación). Intentar con la siguiente."""
    pass


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
        fallback_keys: list[tuple[AiProvider, str, str | None]] | None = None,
    ) -> LlmResponse:
        candidates: list[tuple[AiProvider, str, str | None]] = [(provider, api_key, model_name)]
        if fallback_keys:
            candidates.extend(fallback_keys)

        for try_provider, try_api_key, try_model in candidates:
            resolved = self._resolve_litellm_model(provider=try_provider, model_name=try_model)
            try:
                response = await self._call_litellm(
                    api_key=try_api_key,
                    model_name=resolved,
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
                    model_name=resolved,
                )
            except ProviderKeyError:
                logger.warning("Provider %s rechazó la key, intentando siguiente fallback...", try_provider)
                continue

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Todos los proveedores de IA están no disponibles. Intenta de nuevo en unos minutos.",
        )

    async def stream_analysis(
        self,
        *,
        provider: AiProvider,
        api_key: str,
        model_name: str | None,
        system_prompt: str,
        user_prompt: str,
        fallback_keys: list[tuple[AiProvider, str, str | None]] | None = None,
    ):
        from litellm import acompletion
        from litellm.exceptions import RateLimitError, AuthenticationError

        candidates: list[tuple[AiProvider, str, str | None]] = [(provider, api_key, model_name)]
        if fallback_keys:
            candidates.extend(fallback_keys)

        for try_provider, try_api_key, try_model in candidates:
            resolved = self._resolve_litellm_model(provider=try_provider, model_name=try_model)
            try:
                kwargs = {
                    "model": resolved,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "api_key": try_api_key,
                    "temperature": 0.2,
                    "drop_params": True,
                    "stream": True,
                }
                response = await acompletion(**kwargs)

                async def event_generator(_resp=response):
                    try:
                        async for chunk in _resp:
                            delta = chunk.choices[0].delta.content or ""
                            if delta:
                                yield delta
                    except Exception as e:
                        yield f"\n[Error de generación: {str(e)}]"

                return resolved, event_generator()
            except (RateLimitError, AuthenticationError) as exc:
                logger.warning("Provider %s rechazó la key para stream, intentando siguiente...", try_provider)
                continue
            except Exception as exc:
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI provider request failed") from exc

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Todos los proveedores de IA están no disponibles. Intenta de nuevo en unos minutos.",
        )

    async def verify_connection(
        self,
        *,
        provider: AiProvider,
        api_key: str,
        model_name: str | None,
    ) -> LlmResponse:
        resolved_model = self._resolve_litellm_model(provider=provider, model_name=model_name)
        try:
            response = await self._call_litellm(
                api_key=api_key,
                model_name=resolved_model,
                system_prompt="Responde unicamente con la palabra OK.",
                user_prompt="OK",
                temperature=0,
                max_tokens=5,
            )
        except ProviderKeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"API Key inválida o con rate limit: {exc}",
            ) from exc
        except HTTPException as exc:
            if exc.status_code == status.HTTP_502_BAD_GATEWAY:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="AI provider verification failed",
                ) from exc
            raise
        usage = self._extract_usage(response)
        return LlmResponse(
            output_text=self._extract_output_text(response),
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

        if provider == AiProvider.GROQ:
            if not model_name:
                return "groq/llama-3-70b-versatile"
            return model_name if model_name.startswith("groq/") else f"groq/{model_name}"

        if provider == AiProvider.NVIDIA:
            if not model_name:
                return "nvidia_nim/meta/llama-3.1-70b-instruct"
            return model_name if model_name.startswith("nvidia_nim/") else f"nvidia_nim/{model_name}"

        if provider == AiProvider.OTHER:
            if not model_name or "/" not in model_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "model_name with an explicit LiteLLM provider prefix is required for OTHER. "
                        "Examples: together_ai/..., deepinfra/..."
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
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ):
        from litellm import acompletion
        from litellm.exceptions import RateLimitError, AuthenticationError
        try:
            kwargs = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "api_key": api_key,
                "temperature": temperature,
                "drop_params": True,
            }
            if max_tokens is not None:
                kwargs["max_tokens"] = max_tokens

            return await acompletion(**kwargs)
        except (RateLimitError, AuthenticationError) as exc:
            # Retryable: the key is rate-limited or invalid — let the caller try the next one
            raise ProviderKeyError(str(exc)) from exc
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

    async def list_provider_models(self, *, provider: AiProvider, api_key: str) -> list[dict]:
        import urllib.request
        import json
        import asyncio

        def _fetch_models(url: str, headers: dict | None = None) -> list[dict]:
            req_headers = headers or {}
            if "User-Agent" not in req_headers:
                req_headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                
            req = urllib.request.Request(url, headers=req_headers)
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    data = json.loads(response.read().decode("utf-8"))
                    if provider == AiProvider.GEMINI:
                        return [{"id": m["name"].replace("models/", ""), "name": m.get("displayName", m["name"])} for m in data.get("models", [])]
                    elif provider == AiProvider.OPENROUTER:
                        return [{"id": m["id"], "name": m.get("name", m["id"])} for m in data.get("data", [])]
                    else:
                        return [{"id": m["id"], "name": m["id"]} for m in data.get("data", [])]
            except Exception as e:
                print(f"Error fetching models: {e}")
                return []

        if provider == AiProvider.OPENAI:
            url = "https://api.openai.com/v1/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            return await asyncio.to_thread(_fetch_models, url, headers)
        elif provider == AiProvider.OPENROUTER:
            url = "https://openrouter.ai/api/v1/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            return await asyncio.to_thread(_fetch_models, url, headers)
        elif provider == AiProvider.GEMINI:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
            return await asyncio.to_thread(_fetch_models, url)
        elif provider == AiProvider.GROQ:
            url = "https://api.groq.com/openai/v1/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            models = await asyncio.to_thread(_fetch_models, url, headers)
            return [{"id": f"groq/{m['id']}", "name": m["name"]} for m in models]
        elif provider == AiProvider.NVIDIA:
            url = "https://integrate.api.nvidia.com/v1/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            models = await asyncio.to_thread(_fetch_models, url, headers)
            return [{"id": f"nvidia_nim/{m['id']}", "name": m["name"]} for m in models]
        elif provider == AiProvider.OTHER:
            return []
        elif provider == AiProvider.ANTHROPIC:
            # Anthropic doesn't have an endpoint. Provide static list.
            return [
                {"id": "claude-3-5-sonnet-20240620", "name": "Claude 3.5 Sonnet"},
                {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku"},
                {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus"}
            ]
        
        return []
