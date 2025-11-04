from dotenv import load_dotenv
from dashboard.views.insights import summarize_business, summarize_text_insights
from dashboard.llm_tools.app.core.prompt_engine import gerar_prompt_dinamico, generate_prompt_insight
from dashboard.llm_tools.app.core.llm_client import switch_model
from dashboard.llm_tools.app.core.code_executor import executar_codigo_ia, extrair_codigo_puro, executar_codigo_chat
from .utils import convert_numpy, save_json
from dashboard.cache import set_dataframe
from dashboard.cache import get_dataframe
load_dotenv()



def process_data(df, model_name="gemini", user=None):
    if user:
        set_dataframe(df, user.id)
        print(f"[DEBUG] DataFrame salvo no Redis para user:{user.id}")

    model = switch_model(model_name)

    business_summary = summarize_business(df)

    insight = summarize_text_insights(df)
    insight_prompt = generate_prompt_insight(insight)
    if(insight_prompt):
        print("prompt insight gerado")
        print(insight_prompt)
        print(f"Tamanho do prompt: {len(insight_prompt)} caracteres")
    else:
        print(f"Erro no {insight_prompt}")

    try:
        insight_raw = model(insight_prompt)
    except Exception as e:
        print(f"[DEBUG] Erro ao chamar Gemini: {e}")
        insight_raw = ""


    print("insight_raw: ", insight_raw)
    if(insight_raw):
        print("model gerado para insights")
    else:
        print(f"Erro no {insight_raw}")
        insight_raw = ""

    print(f"INSIGHT => {insight_raw}")

    chart_prompt = gerar_prompt_dinamico(df)
    if(chart_prompt):
        print("prompt principal gerado!")

    codigo_raw = model(chart_prompt)

    if(codigo_raw):
        print("Codigo gerado!")

    codigo = extrair_codigo_puro(codigo_raw or "")

    print("------------------------ CODIGO ------------------------")
    print(codigo)
    print("--------------------------------------------------------")

    result = executar_codigo_ia(codigo, df)
    if(result):
        print("Codigo executado!")

    charts_serializable = convert_numpy(result["charts"])
    save_json(charts_serializable)

    return {
        "business_summary": business_summary,
        "charts": charts_serializable,
        "insights_text": insight_raw,
    }



def chat_with_data(question: str, user, model_name="gemini"):
    """
    Analisa a pergunta do usuário sobre o dataframe completo já carregado.
    """
    df = get_dataframe(user.id)
    if df is None:
        return {"answer": "Nenhuma tabela foi carregada ainda."}

    model = switch_model(model_name)

    prompt = f"""
        Você é o Xclarity, um assistente de análise de dados.

        O usuário perguntou: "{question}"

        Regras:
        1. Use o DataFrame `df` já carregado.
        2. Gere um código Python válido e funcional.
        3. Não insira comentários, apenas código útil.
        4. Se não for preciso código, responda diretamente com o resultado calculado.
        5. Use apenas as bibliotecas: pandas, numpy e os seguintes módulos leves do scikit-learn:
           - LinearRegression, Ridge, Lasso, LogisticRegression
           - PolynomialFeatures
           - StandardScaler, MinMaxScaler, Normalizer
           - LabelEncoder, OneHotEncoder
           - train_test_split
        6. Não use RandomForest, DecisionTree, SVC, PCA, KMeans, nem redes neurais.
        7. Se envolver datas, use pd.to_datetime(..., dayfirst=True).
        8. Sempre finalize o código com um print contendo uma resposta em linguagem natural.
        9. Se a pergunta não tiver relação com os dados, gere uma resposta simples dentro de um print do Python.
        10. Nunca desvie de temas relacionados ao DataFrame.
        11. caso use algum modulo do scikit-learn, informar qual foi o algoritmo no print para o usuário.
        12. Não explique ou dê considerações. Apenas o resultado de forma humana.
    """

    cols = df.columns.tolist()
    sample = df.head(5).to_dict(orient="records")
    prompt += f"\nO DataFrame tem {len(df)} linhas e colunas: {cols}. Exemplo de dados: {sample}\n"

    raw = model(prompt)
    codigo = extrair_codigo_puro(raw or "")

    print(" -------------------------------------- CODIGO PURO CHAT IA --------------------------------------")
    print(codigo)

    if codigo:
        result = executar_codigo_chat(codigo, df)
        if result.get("success"):
            resposta = result.get("stdout")
        else:
            resposta = f"Erro ao executar o código:\n{result.get('error')}"
    else:
        resposta = raw

    return {"answer": resposta, "debug": {"codigo": codigo, "raw": raw}}