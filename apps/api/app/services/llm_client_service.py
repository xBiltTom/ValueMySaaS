import logging
from dataclasses import dataclass
from decimal import Decimal

from fastapi import HTTPException, status

from app.models.enums import AiProvider
from app.services.chatgpt_web_client import ChatGptWebClient, ChatGptWebClientError

logger = logging.getLogger(__name__)

# ── Per-provider text-model filters ─────────────────────────────────────────
# These patterns are matched against the raw model IDs returned by each API.

# OpenAI: prefixes / substrings that identify non-text models
_OPENAI_EXCLUDE_PREFIXES: tuple[str, ...] = (
    "dall-e",
    "whisper-",
    "tts-",
    "text-embedding",
    "text-search",
    "text-similarity",
    "code-search",
)
_OPENAI_EXCLUDE_SUBSTRINGS: tuple[str, ...] = (
    "-embedding",
    "-moderation",
    "-audio-",
)

# NVIDIA / Groq: substrings that identify non-text models
_GENERIC_EXCLUDE_SUBSTRINGS: tuple[str, ...] = (
    "embed",
    "rerank",
    "vision",  # pure-vision/image-gen models — note: multimodal *text* models are fine
    "tts",
    "whisper",
    "audio",
)


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
        user_agent: str | None = None,
    ) -> LlmResponse:
        if provider in (AiProvider.CHATGPT_WEB, AiProvider.G4F):
            client = ChatGptWebClient()
            try:
                output_text = await client.send_message(
                    session_token=api_key,
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    user_agent=user_agent,
                )
                return LlmResponse(
                    output_text=output_text,
                    output_json=None,
                    tokens_input=None,
                    tokens_output=None,
                    estimated_cost=None,
                    model_name="chatgpt-web",
                )
            except ChatGptWebClientError as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=str(exc),
                )
            finally:
                await client.close()

        candidates: list[tuple[AiProvider, str, str | None]] = [
            (provider, api_key, model_name)
        ]
        if fallback_keys:
            candidates.extend(fallback_keys)

        for try_provider, try_api_key, try_model in candidates:
            resolved = self._resolve_litellm_model(
                provider=try_provider, model_name=try_model
            )
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
                logger.warning(
                    "Provider %s rechazó la key, intentando siguiente fallback...",
                    try_provider,
                )
                continue
            except ValueError as e:
                if "request_too_large" in str(e) or "context_length_exceeded" in str(e):
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="El historial del proyecto es demasiado extenso para el límite de memoria (tokens) de este modelo pequeño. Intenta usar un modelo de mayor capacidad (ej. Claude 3.5 Sonnet, GPT-4o o Gemini 1.5 Pro).",
                    )
                raise
            except Exception as e:
                err_str = str(e).lower()
                if "context_length_exceeded" in err_str or "maximum context length" in err_str:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="El historial del proyecto es demasiado extenso para el límite de memoria (tokens) de este modelo pequeño. Intenta usar un modelo de mayor capacidad.",
                    )
                raise

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
        user_agent: str | None = None,
    ):
        if provider in (AiProvider.CHATGPT_WEB, AiProvider.G4F):
            client = ChatGptWebClient()
            try:
                async def _chatgpt_web_stream():
                    try:
                        async for chunk in client.stream_message(
                            session_token=api_key,
                            system_prompt=system_prompt,
                            user_prompt=user_prompt,
                            user_agent=user_agent,
                        ):
                            if chunk == "[[SESSION_EXPIRED]]":
                                yield "\n\n⚠️ **Sesión de ChatGPT expirada**\nEl administrador necesita renovar la sesión en el panel de administración."
                                return
                            yield chunk
                    finally:
                        await client.close()
                return "chatgpt-web", _chatgpt_web_stream()
            except Exception as exc:
                await client.close()
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"ChatGPT Web error: {exc}",
                )

        from litellm import acompletion
        from litellm.exceptions import AuthenticationError, RateLimitError

        candidates: list[tuple[AiProvider, str, str | None]] = [
            (provider, api_key, model_name)
        ]
        if fallback_keys:
            candidates.extend(fallback_keys)

        for try_provider, try_api_key, try_model in candidates:
            resolved = self._resolve_litellm_model(
                provider=try_provider, model_name=try_model
            )
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
                    except ValueError as e:
                        if "request_too_large" in str(e) or "context_length_exceeded" in str(e):
                            yield "\n\n⚠️ **Error de Capacidad del Modelo**\nEl historial del proyecto es demasiado extenso para el límite de memoria (tokens) de este modelo pequeño.\nPor favor, intenta usar un modelo de mayor capacidad (ej. Claude 3.5 Sonnet, Gemini 1.5 Pro, o GPT-4o) para proyectos con mucho historial."
                        else:
                            yield f"\n[Error de generación: {str(e)}]"
                    except Exception as e:
                        err_str = str(e).lower()
                        if "context_length_exceeded" in err_str or "maximum context length" in err_str:
                            yield "\n\n⚠️ **Error de Capacidad del Modelo**\nEl historial del proyecto es demasiado extenso para el límite de memoria (tokens) de este modelo. Por favor, intenta usar un modelo de mayor capacidad."
                        else:
                            yield f"\n[Error de generación: {str(e)}]"

                return resolved, event_generator()
            except (RateLimitError, AuthenticationError) as exc:
                logger.warning(
                    "Provider %s rechazó la key para stream, intentando siguiente...",
                    try_provider,
                )
                continue
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="AI provider request failed",
                ) from exc

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
        resolved_model = self._resolve_litellm_model(
            provider=provider, model_name=model_name
        )
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

    def _resolve_litellm_model(
        self, *, provider: AiProvider, model_name: str | None
    ) -> str:
        if provider == AiProvider.OPENAI:
            return model_name or "gpt-4o-mini"

        if provider == AiProvider.GEMINI:
            if not model_name:
                return "gemini/gemini-1.5-flash"
            return (
                model_name
                if model_name.startswith("gemini/")
                else f"gemini/{model_name}"
            )

        if provider == AiProvider.ANTHROPIC:
            if not model_name:
                return "anthropic/claude-3-5-haiku-20241022"
            return (
                model_name
                if model_name.startswith("anthropic/")
                else f"anthropic/{model_name}"
            )

        if provider == AiProvider.OPENROUTER:
            if not model_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="model_name is required for OPENROUTER, for example openrouter/meta-llama/llama-3.1-8b-instruct",
                )
            return (
                model_name
                if model_name.startswith("openrouter/")
                else f"openrouter/{model_name}"
            )

        if provider == AiProvider.GROQ:
            if not model_name:
                return "groq/llama-3.3-70b-versatile"
            return (
                model_name if model_name.startswith("groq/") else f"groq/{model_name}"
            )

        if provider == AiProvider.NVIDIA:
            if not model_name:
                return "nvidia_nim/meta/llama-3.1-70b-instruct"
            return (
                model_name
                if model_name.startswith("nvidia_nim/")
                else f"nvidia_nim/{model_name}"
            )

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

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported AI provider"
        )

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
        from litellm.exceptions import AuthenticationError, RateLimitError

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

    # ── Text-model filtering ────────────────────────────────────────────────

    def _is_text_model_openai(self, model_id: str) -> bool:
        """Return True if the OpenAI model ID corresponds to a text-generation model."""
        lower = model_id.lower()
        if any(lower.startswith(p) for p in _OPENAI_EXCLUDE_PREFIXES):
            return False
        if any(s in lower for s in _OPENAI_EXCLUDE_SUBSTRINGS):
            return False
        return True

    def _is_text_model_openrouter(self, raw: dict) -> bool:
        """OpenRouter exposes architecture.modality; keep only models whose *output* is text."""
        modality: str = raw.get("architecture", {}).get("modality", "")
        if not modality:
            # No modality info — accept by default to avoid hiding valid models.
            return True
        return "->text" in modality

    def _is_text_model_gemini(self, raw: dict) -> bool:
        """Keep Gemini models that support generateContent (text generation)."""
        methods: list[str] = raw.get("supportedGenerationMethods", [])
        return "generateContent" in methods

    def _is_text_model_generic(self, model_id: str) -> bool:
        """Generic ID-based filter used for Groq, NVIDIA and similar providers."""
        lower = model_id.lower()
        return not any(s in lower for s in _GENERIC_EXCLUDE_SUBSTRINGS)

    # ── Model listing ────────────────────────────────────────────────────────

    async def list_provider_models(
        self, *, provider: AiProvider, api_key: str
    ) -> list[dict]:
        import asyncio
        import json
        import urllib.request

        def _fetch_raw(url: str, headers: dict | None = None) -> list[dict]:
            """Fetch the raw model list from *url* and return it unparsed."""
            req_headers = {**(headers or {})}
            req_headers.setdefault(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            )
            req = urllib.request.Request(url, headers=req_headers)
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    # Gemini wraps in "models", all others in "data"
                    return data.get("models") or data.get("data") or []
            except Exception as exc:
                logger.warning("Error fetching models from %s: %s", url, exc)
                return []

        if provider == AiProvider.OPENAI:
            raw = await asyncio.to_thread(
                _fetch_raw,
                "https://api.openai.com/v1/models",
                {"Authorization": f"Bearer {api_key}"},
            )
            return [
                {"id": m["id"], "name": m["id"]}
                for m in raw
                if self._is_text_model_openai(m.get("id", ""))
            ]

        elif provider == AiProvider.OPENROUTER:
            raw = await asyncio.to_thread(
                _fetch_raw,
                "https://openrouter.ai/api/v1/models",
                {"Authorization": f"Bearer {api_key}"},
            )
            return [
                {"id": m["id"], "name": m.get("name", m["id"])}
                for m in raw
                if self._is_text_model_openrouter(m)
            ]

        elif provider == AiProvider.GEMINI:
            raw = await asyncio.to_thread(
                _fetch_raw,
                f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
            )
            return [
                {
                    "id": m["name"].replace("models/", ""),
                    "name": m.get("displayName", m["name"]),
                }
                for m in raw
                if self._is_text_model_gemini(m)
            ]

        elif provider == AiProvider.GROQ:
            raw = await asyncio.to_thread(
                _fetch_raw,
                "https://api.groq.com/openai/v1/models",
                {"Authorization": f"Bearer {api_key}"},
            )
            return [
                {"id": f"groq/{m['id']}", "name": m["id"]}
                for m in raw
                if self._is_text_model_generic(m.get("id", ""))
            ]

        elif provider == AiProvider.NVIDIA:
            raw = await asyncio.to_thread(
                _fetch_raw,
                "https://integrate.api.nvidia.com/v1/models",
                {"Authorization": f"Bearer {api_key}"},
            )
            return [
                {"id": f"nvidia_nim/{m['id']}", "name": m["id"]}
                for m in raw
                if self._is_text_model_generic(m.get("id", ""))
            ]

        elif provider == AiProvider.ANTHROPIC:
            # Anthropic has no public models endpoint; static list of text models.
            return [
                {"id": "claude-3-5-sonnet-20240620", "name": "Claude 3.5 Sonnet"},
                {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku"},
                {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus"},
            ]

        elif provider == AiProvider.OTHER:
            return []

        return []
