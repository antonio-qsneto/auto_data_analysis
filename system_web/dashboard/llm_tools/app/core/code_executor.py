import contextlib
import io
import pandas as pd
import matplotlib.pyplot as plt
import re
import plotly.tools as tls

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
    local_vars = {}

    with contextlib.redirect_stdout(stdout):
        exec(codigo, {"pd": pd, "plt": plt, "df": df}, local_vars)

    figures_json = []
    for fig_num in plt.get_fignums():
        fig = plt.figure(fig_num)
        try:
            plotly_fig = tls.mpl_to_plotly(fig)
            if plotly_fig is not None and hasattr(plotly_fig, "to_plotly_json"):
                figures_json.append(plotly_fig.to_plotly_json())
            else:
                figures_json.append({"error": "mpl_to_plotly returned None or object without to_plotly_json"})
        except Exception as e:
            figures_json.append({"error": str(e)})

    plt.close('all')

    return {
        "stdout": stdout.getvalue(),
        "plots": figures_json
    }