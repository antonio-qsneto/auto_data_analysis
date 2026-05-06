import os
from typing import Any, Callable, Literal

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

load_dotenv()

TaskType = Literal["insight", "chart"]

SYSTEM_PROMPT = "Você é um analista de dados."
OPENROUTER_MODELS: dict[TaskType, str] = {
    "chart": "moonshotai/kimi-k2:free",
    "insight": "deepseek/deepseek-chat-v3-0324:free",
}


def _extract_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts).strip()
    return str(content or "")


def _build_llm(model: str, task: TaskType):
    provider = model.strip().lower()

    if provider == "gemini":
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY não encontrada nas variáveis de ambiente.")
        return ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"),
            google_api_key=api_key,
            temperature=0.3,
            max_output_tokens=3000,
        )

    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("Variável de ambiente OPENAI_API_KEY não encontrada.")
        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-5-nano"),
            api_key=api_key,
            temperature=0.3,
            max_tokens=3000,
        )

    if provider == "openrouter":
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY não encontrada nas variáveis de ambiente.")
        return ChatOpenAI(
            model=OPENROUTER_MODELS[task],
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.3,
            max_tokens=3000,
        )

    raise ValueError(f"Modelo não suportado: {model}")


def _invoke_llm(llm: Any, prompt: str, model_name: str) -> str:
    composed_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"

    try:
        response = llm.invoke(composed_prompt)
    except Exception as e:
        if model_name.strip().lower() == "gemini":
            msg = str(e).upper()
            if "503" in msg or "UNAVAILABLE" in msg:
                return "Xclarity is currently overloaded. Please try again in a few minutes."
        raise RuntimeError(f"Erro ao chamar modelo '{model_name}': {e}") from e

    return _extract_text(response.content)


def invoke_model(prompt: str, model: str = "gemini", task: TaskType = "insight") -> str:
    llm = _build_llm(model=model, task=task)
    return _invoke_llm(llm=llm, prompt=prompt, model_name=model)


def switch_model(model: str, task: TaskType = "insight") -> Callable[[str], str]:
    llm = _build_llm(model=model, task=task)
    return lambda prompt: _invoke_llm(llm=llm, prompt=prompt, model_name=model)
