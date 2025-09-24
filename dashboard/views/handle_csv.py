import pandas as pd
import traceback
from .core import process_data

def handle_csv(uploaded_file):
    """
    Recebe um arquivo CSV (UploadedFile) e retorna os dados processados para charts + summary + insights.
    """
    try:
        if not uploaded_file.name.endswith(".csv"):
            raise ValueError("Only CSV files allowed")
        
        df = pd.read_csv(uploaded_file, nrows=1000).reset_index(drop=True)
        df["index"] = df.index

        data = process_data(df)
        return data

    except Exception as e:
        raise ValueError(f"Erro ao processar CSV: {str(e)}\n{traceback.format_exc()}")
