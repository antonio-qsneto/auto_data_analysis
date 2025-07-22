import pandas as pd
import random
from datetime import datetime, timedelta

categorias = ["Alimentação", "Transporte", "Lazer", "Educação", "Investimento", "Saúde", "Aluguel", "Outros"]
tipos = ["Despesa", "Receita"]

dados = []

for _ in range(100):
    data = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 180))
    categoria = random.choice(categorias)
    tipo = "Despesa" if categoria != "Investimento" else "Receita"
    valor = round(random.uniform(50, 1000), 2) if tipo == "Despesa" else round(random.uniform(500, 5000), 2)
    
    dados.append([data.strftime('%Y-%m-%d'), categoria, tipo, valor])

df = pd.DataFrame(dados, columns=["Data", "Categoria", "Tipo", "Valor"])
df.to_csv("gastos_fake.csv", index=False)
