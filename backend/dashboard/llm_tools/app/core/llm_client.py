import os
import requests
from openai import OpenAI # type: ignore
from google import genai # type: ignore
import json
from dotenv import load_dotenv

load_dotenv()

def call_openAI(prompt: str) -> str | None:

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Variável de ambiente OPENAI_API_KEY não encontrada.")

    try:
        # Cria o cliente com a chave de API do OpenAI
        client = OpenAI(api_key=api_key)

        # Chama o modelo GPT-5 Nano
        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {"role": "system", "content": "Você é um analista de dados que gera código Python para visualização."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=3000
        )

        return response.choices[0].message.content or ""

    except Exception as e:
        print(f"Erro na API do OpenAI: {str(e)}")
        raise RuntimeError(f"Erro na API do OpenAI: {str(e)}")


def call_openRouter(prompt: str, model="insight") -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    model_mapping = {
        "chart": "moonshotai/kimi-k2:free",
        "insight": "deepseek/deepseek-chat-v3-0324:free",
    }
    model = model_mapping.get(model)
    if not model:
        raise ValueError(f"Tipo inválido especificado: {type}. Deve ser 'chart' ou 'insight'.")

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Você é um analista de dados."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 3000,
    }

    response = requests.post(url, json=payload, headers=headers, timeout=60)
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        print(f"Chave de API no cliente LLM: {api_key}")
        print(f"Código de status da resposta: {response.status_code}")
        print(f"Texto da resposta: {response.text}")
        raise RuntimeError(f"Erro {response.status_code}: {response.text}")


def call_gemini(prompt: str) -> str:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY não encontrada nas variáveis de ambiente.")

    client = genai.Client(api_key=api_key)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
        )
        return response.text  # type: ignore

    except Exception as e:
        # Se for um erro do Google API com dicionário de erro, extrai a mensagem
        msg = str(e)
        status_code = None
        error_details = None
        if hasattr(e, "args") and isinstance(e.args[0], dict):
            details = e.args[0].get("error", {})
            status_code = details.get('code')
            error_msg = details.get('message', str(e))
            status = details.get('status', 'Error')

            # 🆕 Detecta overload específico (503 UNAVAILABLE) e retorna mensagem amigável
            if status_code == 503 or status == 'UNAVAILABLE':
                user_friendly_msg = "Xclarity is currently overloaded. Please try again in a few minutes."
                print(f"[Gemini] Overload detectado: {error_msg} - Retornando mensagem amigável: {user_friendly_msg}")
                return user_friendly_msg

            msg = f"{status}: {error_msg}"
            error_details = details

        print(f"[Gemini] Erro na API: {msg}")
        
        # Para outros erros, retorna JSON com detalhes (para depuração interna), mas sem expor ao usuário final
        return json.dumps({
            "error": f"Erro interno no processamento: {msg}",
            "status": "failed"
        })


def switch_model(model: str):
    if model == "gemini":
        return call_gemini
    elif model == "openai":
        return call_openAI
    elif model == "openrouter":
        return call_openRouter
    else:
        raise ValueError(f"Modelo não suportado: {model}")
