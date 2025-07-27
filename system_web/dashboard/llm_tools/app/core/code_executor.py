import contextlib
import io
import pandas as pd
import matplotlib.pyplot as plt
import re
import numpy as np # type: ignore



def extrair_codigo_puro(resposta_llm: str) -> str:
    if "```python" in resposta_llm:
        codigo = re.findall(r"```python(.*?)```", resposta_llm, re.DOTALL)
        return codigo[0].strip() if codigo else resposta_llm.strip()
    else:
        linhas = resposta_llm.strip().splitlines()
        linhas_filtradas = [linha for linha in linhas if not linha.strip().startswith("🔧")]
        return "\n".join(linhas_filtradas).strip()

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
