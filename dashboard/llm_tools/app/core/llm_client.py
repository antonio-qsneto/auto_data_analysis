import os
import requests
from openai import OpenAI # type: ignore
from google import genai # type: ignore
from google.genai import types # type: ignore
from dotenv import load_dotenv

load_dotenv()

def call_openRouter(prompt: str, api_key: str, type: str) -> str:
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    model_mapping = {
        "chart": "moonshotai/kimi-k2:free",
        "insight": "deepseek/deepseek-chat-v3-0324:free",
    }
    model = model_mapping.get(type)
    if not model:
        raise ValueError(f"Invalid type specified: {type}. Must be 'chart' or 'insight'.")

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a data analyst."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 3000,
    }

    response = requests.post(url, json=payload, headers=headers, timeout=60)
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        print(f"api_key in llm Client: {api_key}")
        print(f"Response status code: {response.status_code}")
        print(f"Response text: {response.text}")
        raise RuntimeError(f"Erro {response.status_code}: {response.text}")
 

def call_openAI(prompt: str) -> str:
    """
    Calls GPT-5 Nano using the OpenAI Python SDK.
    Uses API key from environment variable OPENAI_API_KEY.

    Args:
        prompt (str): The user prompt for the model.

    Returns:
        str: The model's response content.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Environment variable OPENAI_API_KEY not found.")

    try:
        # Create client with API key from env
        client = OpenAI(api_key=api_key)

        # Call GPT-5 Nano
        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {"role": "system", "content": "You are a data analyst who generates Python code for visualization."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=3000
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        raise RuntimeError(f"OpenAI API error: {str(e)}")
    

def call_gemini(prompt: str) -> str:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY not found in environment variables.")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0)  # Desativa thinking
        ),
    )
    
    return response.text

