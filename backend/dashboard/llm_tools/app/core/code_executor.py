import contextlib
import io
import pandas as pd
import re
import numpy as np
import traceback
import sklearn

from sklearn.linear_model import LinearRegression, Ridge, Lasso, LogisticRegression
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, Normalizer, PolynomialFeatures,
    LabelEncoder, OneHotEncoder
)
from sklearn.model_selection import train_test_split



def extrair_codigo_puro(resposta_llm: str) -> str:
    """
    Extrai o código Python contido na resposta da LLM,
    removendo delimitadores ```python ... ``` ou resíduos incorretos.

    Retorna sempre um código limpo, pronto para execução.
    """
    if not resposta_llm:
        return ""

    # 🧹 Remove caracteres de controle ou markdown incorreto
    resposta_limpa = resposta_llm.replace("```python", "```").replace("```py", "```")

    # 🧩 Tenta capturar o bloco principal entre delimitadores de código
    blocos = re.findall(r"```(.*?)```", resposta_limpa, re.DOTALL)

    if blocos:
        codigo_extraido = blocos[0].strip()
    else:
        # 🔍 Caso não tenha delimitadores, pega linhas plausíveis de código
        linhas = resposta_limpa.strip().splitlines()
        linhas_filtradas = []
        for linha in linhas:
            # Ignora emojis, explicações e comentários descritivos
            if any(
                linha.strip().startswith(prefix)
                for prefix in ["#", "🔧", "💡", "```", "Output", "Saída", "Explicação"]
            ):
                continue
            linhas_filtradas.append(linha)
        codigo_extraido = "\n".join(linhas_filtradas).strip()

    # 🧽 Remove delimitadores soltos (``` no início ou final)
    codigo_extraido = re.sub(r"^```+|```+$", "", codigo_extraido).strip()

    # 🔒 Remove caracteres de controle invisíveis como <ctrlXX> ou \u200b
    codigo_extraido = re.sub(r"<ctrl\d+>", "", codigo_extraido)
    codigo_extraido = codigo_extraido.replace("\u200b", "")

    # 🚫 Garante que o código não termine com resquícios de markdown
    while codigo_extraido.endswith("```") or codigo_extraido.endswith("`"):
        codigo_extraido = codigo_extraido[:-1].strip()

    return codigo_extraido


def executar_codigo_ia(codigo: str, df: pd.DataFrame) -> dict:
    stdout = io.StringIO()
    namespace = {"pd": pd, "df": df, "np": np, "chart_data": []}

    try:
        with contextlib.redirect_stdout(stdout):
            exec(codigo, namespace)

        charts = namespace.get("chart_data", [])
        return {
            "stdout": stdout.getvalue(),
            "charts": charts
        }

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print("Error executing code:\n", error_trace)
        return {
            "stdout": stdout.getvalue(),
            "error": str(e),
            "traceback": error_trace,
            "charts": []
        }


def executar_codigo_chat(codigo: str, df: pd.DataFrame) -> dict:
    """
    Executa um código Python simples gerado pela IA no contexto de chat.

    O código deve:
      - Usar apenas o DataFrame `df`
      - Retornar informações numéricas, estatísticas ou prints
      - NÃO gerar gráficos (isso é papel da função executar_codigo_ia)
      - Pode usar apenas funções e classes leves do scikit-learn
    """
    stdout = io.StringIO()

    # Namespace controlado com apenas bibliotecas seguras
    namespace = {
        "pd": pd,
        "np": np,
        "df": df,

        # Modelos lineares leves
        "LinearRegression": LinearRegression,
        "Ridge": Ridge,
        "Lasso": Lasso,
        "LogisticRegression": LogisticRegression,

        # Pré-processamento e utilitários leves
        "StandardScaler": StandardScaler,
        "MinMaxScaler": MinMaxScaler,
        "Normalizer": Normalizer,
        "PolynomialFeatures": PolynomialFeatures,
        "LabelEncoder": LabelEncoder,
        "OneHotEncoder": OneHotEncoder,
        "train_test_split": train_test_split,
    }

    try:
        with contextlib.redirect_stdout(stdout):
            exec(codigo, namespace)

        # Captura variáveis criadas pelo código
        result_vars = {
            k: v for k, v in namespace.items()
            if not k.startswith("_") and k not in namespace.keys()
        }

        # Monta resposta textual com stdout e variáveis finais
        resposta = stdout.getvalue().strip()
        if not resposta and result_vars:
            resposta = "\n".join(
                [f"{k} = {repr(v)}" for k, v in result_vars.items()]
            )

        return {
            "success": True,
            "stdout": resposta or "Código executado sem saída.",
            "result_vars": result_vars
        }

    except Exception as e:
        error_trace = traceback.format_exc()
        print("[CHAT EXEC ERROR]", error_trace)
        print(e)
        return {
            "success": False,
            "error": str(e),
            "traceback": error_trace,
            "stdout": stdout.getvalue()
        }