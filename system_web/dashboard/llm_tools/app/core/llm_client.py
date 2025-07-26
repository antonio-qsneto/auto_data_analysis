import requests

def chamar_openrouter(prompt: str, api_key: str) -> str:
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    payload = {
        #"model": "deepseek/deepseek-chat-v3-0324:free",
        "model": "google/gemini-2.5-flash-lite-preview-06-17",

        "messages": [
            {"role": "system", "content": "You are a data analyst who generates Python code for visualization."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1420
    }

    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        print("Chave não encontrada ou inválida aqui")
        print(f"api_key: {api_key}")
        raise RuntimeError(f"Erro {response.status_code}: {response.text}")
