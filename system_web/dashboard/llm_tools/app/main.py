
import pandas as pd
from core.prompt_engine import gerar_prompt_dinamico
from core.llm_client import chamar_openrouter
from utils.plot_utils import executar_codigo_seguro
import os

df = pd.read_csv("dashboard/llm_tools/app/data/gastos_fake.csv")
prompt = gerar_prompt_dinamico(df)

api_key = os.getenv("OPENROUTER_API_KEY")
print(f"Minha API Key: {api_key}")
if api_key is None:
	raise ValueError("OPENROUTER_API_KEY environment variable is not set.")
print(f"Minha API Key: {api_key}")
codigo = chamar_openrouter(prompt, api_key=api_key)

print("Código gerado pela LLM:\n", codigo)
resultados = executar_codigo_seguro(codigo, df)
print(resultados)

