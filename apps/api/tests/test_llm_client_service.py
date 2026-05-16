from fastapi import HTTPException
import pytest

from app.models.enums import AiProvider
from app.services.llm_client_service import LlmClientService


class FakeLiteLlmClient(LlmClientService):
    def __init__(self) -> None:
        self.called_model = None

    async def _call_litellm(self, *, api_key, model_name, system_prompt, user_prompt):
        self.called_model = model_name
        return {
            "choices": [{"message": {"content": "ok"}}],
            "usage": {"prompt_tokens": 3, "completion_tokens": 4},
        }


@pytest.mark.asyncio
async def test_openai_without_model_uses_default():
    client = FakeLiteLlmClient()

    response = await client.generate_analysis(
        provider=AiProvider.OPENAI,
        api_key="secret",
        model_name=None,
        system_prompt="s",
        user_prompt="u",
    )

    assert client.called_model == "gpt-4o-mini"
    assert response.model_name == "gpt-4o-mini"
    assert response.tokens_input == 3
    assert response.tokens_output == 4


@pytest.mark.asyncio
async def test_gemini_model_gets_litellm_prefix():
    client = FakeLiteLlmClient()

    response = await client.generate_analysis(
        provider=AiProvider.GEMINI,
        api_key="secret",
        model_name="gemini-1.5-flash",
        system_prompt="s",
        user_prompt="u",
    )

    assert client.called_model == "gemini/gemini-1.5-flash"
    assert response.model_name == "gemini/gemini-1.5-flash"


@pytest.mark.asyncio
async def test_openrouter_without_model_returns_400():
    client = FakeLiteLlmClient()

    with pytest.raises(HTTPException) as exc:
        await client.generate_analysis(
            provider=AiProvider.OPENROUTER,
            api_key="secret",
            model_name=None,
            system_prompt="s",
            user_prompt="u",
        )

    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_other_without_prefix_returns_400():
    client = FakeLiteLlmClient()

    with pytest.raises(HTTPException) as exc:
        await client.generate_analysis(
            provider=AiProvider.OTHER,
            api_key="secret",
            model_name="llama-3.1-8b-instant",
            system_prompt="s",
            user_prompt="u",
        )

    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_other_with_prefix_uses_exact_model():
    client = FakeLiteLlmClient()

    response = await client.generate_analysis(
        provider=AiProvider.OTHER,
        api_key="secret",
        model_name="groq/llama-3.1-8b-instant",
        system_prompt="s",
        user_prompt="u",
    )

    assert client.called_model == "groq/llama-3.1-8b-instant"
    assert response.model_name == "groq/llama-3.1-8b-instant"
