import pandas as pd
import traceback
from .core import process_data

def handle_csv(uploaded_file, user):
    """
    Recebe um arquivo CSV (UploadedFile ou BytesIO) e retorna os dados processados para charts + summary + insights.
    """
    try:
        if hasattr(uploaded_file, "name"):
            if not uploaded_file.name.endswith(".csv"):
                raise ValueError("Only CSV files allowed")
            df = pd.read_csv(uploaded_file, nrows=1000).reset_index(drop=True)
        else:
            # Caso seja BytesIO (usado pelo Celery)
            df = pd.read_csv(uploaded_file, nrows=1000).reset_index(drop=True)

        df["index"] = df.index

        data = process_data(df, user=user)
        return data

    except Exception as e:
        raise ValueError("Error processing CSV")
