# %%
from ydata_profiling import ProfileReport
import requests
import pandas as pd
import re

# %%
df = pd.read_csv("gastos_fake.csv")
profile = ProfileReport(df, title="Relatório Financeiro", explorative=True)
profile_json = profile.to_json()

# %%
def gerar_prompt_dinamico(df: pd.DataFrame, profile_json: dict = None) -> str:
    shape_info = f"The table has {df.shape[0]} rows and {df.shape[1]} columns."
    dtypes_info = df.dtypes.astype(str).to_dict()
    columns_info = "\n".join(f"- {col}: {dtype}" for col, dtype in dtypes_info.items())
    head_preview = df.head(3).to_markdown(index=False)

    summary = ""
    if profile_json:
        try:
            variables = profile_json.get("variables", {})
            resumo = []
            for col, meta in variables.items():
                tipo = meta.get("type", "unknown")
                missing = meta.get("p_missing", 0)
                resumo.append(f"- {col}: type={tipo}, missing={round(missing*100, 1)}%")
            summary = "\n\nProfileReport summary:\n" + "\n".join(resumo)
        except Exception:
            pass

    prompt = f"""
            You are a data scientist assistant.

            A user uploaded a table as a pandas DataFrame named `df`.

            {shape_info}
            Columns and types:
            {columns_info}

            Preview of first rows:
            {head_preview}
            {summary}

            You are a data scientist assistant. A table was uploaded and is available as a pandas DataFrame named `df`.

            Your task:
            1. Analyze the structure and content of `df`.
            2. If appropriate, generate Python code to create visualizations:
            - Time Series Plot (if date/time column exists)
            - Box Plot per category (if categorical + numeric columns)
            - Correlation Heatmap (if multiple numeric columns)
            - Top N Expenses (highest rows by value), all categories.
            - Distribution Plot (histogram or KDE for numeric columns)
            - Anomaly Detection (values far from mean/std)
            - Summary Table (sum, mean, max, count grouped by category)
            - Cumulative Spending Curve (if date + amount/value column)
            - Pie Chart of spending by category

            3. Use `pandas`, `matplotlib`, and `seaborn` (and optionally `numpy`, `datetime`).
            4. Save all plots using `plt.savefig(...)` (do NOT use `plt.show()`).
            5. Assume `df` is already loaded. Do NOT load data again.
            6. Return **only valid Python code**. No explanations or markdown.

            """

    return prompt.strip()


# %%
prompt_final = gerar_prompt_dinamico(df)
prompt_final[:1000]

# %%
def chamar_openrouter(prompt: str, api_key: str) -> str:
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    payload = {
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "messages": [
        {"role": "system", "content": "You are a data analyst who generates Python code for visualization."},
        {"role": "user", "content": prompt}
    ],
    "temperature": 0.3,
    "max_tokens": 1000
    }


    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        print("❌ Erro:", response.status_code)
        print(response.text)
        return ""


# %%
api_key = "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"

codigo_gerado = chamar_openrouter(prompt_final, api_key)

print("🔧 Code generated:")
print(codigo_gerado)

# %%
def executar_codigo_ia(codigo: str, df: pd.DataFrame):
    import contextlib
    import io
    import matplotlib.pyplot as plt

    stdout = io.StringIO()
    local_vars = {}

    try:
        with contextlib.redirect_stdout(stdout):
            exec(codigo, {"pd": pd, "plt": plt, "df": df}, local_vars)
    except Exception as e:
        print("❌ Erro ao executar o código:", e)

    print(stdout.getvalue())


# %%
def extrair_codigo_puro(resposta_llm: str) -> str:
    if "```python" in resposta_llm:
        codigo = re.findall(r"```python(.*?)```", resposta_llm, re.DOTALL)
        return codigo[0].strip() if codigo else resposta_llm.strip()
    else:
        # Remove linhas iniciais não-python como "🔧 Código gerado:" ou cabeçalhos
        linhas = resposta_llm.strip().splitlines()
        linhas_filtradas = [linha for linha in linhas if not linha.strip().startswith("🔧")]
        return "\n".join(linhas_filtradas).strip()


# %%
codigo_puro = extrair_codigo_puro(codigo_gerado)
executar_codigo_ia(codigo_puro, df)

# %%



