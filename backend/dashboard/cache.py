import pandas as pd
import redis
import io
import pickle
import os
from django.conf import settings


# =========================================
# 🔹 Conexão Redis (usado pelo Celery também)
# =========================================
REDIS_HOST = getattr(settings, "REDIS_HOST", "redis")
REDIS_PORT = int(getattr(settings, "REDIS_PORT", 6379))
REDIS_DB = int(getattr(settings, "REDIS_DB", 0))
REDIS_TTL_SECONDS = 86400  # 1 hora de cache (ajustável)

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)


# =========================================
# 🔹 Serialização / Desserialização
# =========================================
def _serialize_df(df: pd.DataFrame) -> bytes:
    """
    Serializa o DataFrame para bytes (Parquet em memória).
    """
    buffer = io.BytesIO()
    df.to_parquet(buffer, index=False)
    return buffer.getvalue()


def _deserialize_df(data: bytes) -> pd.DataFrame:
    """
    Desserializa bytes em DataFrame.
    """
    buffer = io.BytesIO(data)
    return pd.read_parquet(buffer)


# =========================================
# 🔹 Funções públicas
# =========================================
def set_dataframe(df: pd.DataFrame, user_id: int):
    """
    Salva o DataFrame do usuário no Redis.
    """
    key = f"df_cache:{user_id}"
    try:
        data = _serialize_df(df)
        r.setex(key, REDIS_TTL_SECONDS, data)
        print(f"[CACHE] DataFrame salvo no Redis para user:{user_id}")
    except Exception as e:
        print(f"[CACHE ERROR] Falha ao salvar df no Redis: {e}")


def get_dataframe(user_id: int) -> pd.DataFrame | None:
    """
    Recupera o DataFrame do usuário a partir do Redis.
    Retorna None se não encontrado.
    """
    key = f"df_cache:{user_id}"
    try:
        data = r.get(key)
        if data is None:
            print(f"[CACHE] Nenhum DataFrame encontrado no Redis para user:{user_id}")
            return None
        df = _deserialize_df(data)
        # save dataframe as .csv
        df.to_csv("df.csv", index=False)
        print(f"[CACHE] DataFrame recuperado do Redis para user:{user_id}")
        return df
    except Exception as e:
        print(f"[CACHE ERROR] Falha ao recuperar df do Redis: {e}")
        return None


def clear_dataframe(user_id: int):
    """
    Remove o DataFrame do cache do usuário (opcional).
    """
    key = f"df_cache:{user_id}"
    r.delete(key)
    print(f"[CACHE] Cache limpo para user:{user_id}")
