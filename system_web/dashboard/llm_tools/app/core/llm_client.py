import requests

def chamar_openrouter(prompt: str, api_key: str) -> str:
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    payload = {
        #"model": "deepseek/deepseek-chat-v3-0324:free",
        "model": "qwen/qwen3-coder:free",
        #"model": "moonshotai/kimi-k2:free",

        "messages": [
            {"role": "system", "content": "You are a data analyst who generates Python code for visualization."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 3000,
    }

    response = requests.post(url, json=payload, headers=headers, timeout=60)
    if response.status_code == 200:
        print(f"Response from OpenRouter: {response.json()['choices'][0]['message']['content']}")
        return response.json()["choices"][0]["message"]["content"]
    else:
        print("Chave não encontrada ou inválida aqui")
        print(f"api_key in llm Client: {api_key}")
        print(f"Response status code: {response.status_code}")
        print(f"Response text: {response.text}")
        raise RuntimeError(f"Erro {response.status_code}: {response.text}")
 