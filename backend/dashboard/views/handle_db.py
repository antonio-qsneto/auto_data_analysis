import json
import pandas as pd
import traceback
import sqlalchemy as sa
from .core import process_data
import psycopg2  # apenas para compatibilidade com sqlalchemy+psycopg2
import pymongo
from bson import ObjectId, Decimal128
import datetime

# ----------------- Helpers para conversão BSON -> python serializável -----------------
def _convert_bson_value(v):
    """Converte valores BSON comuns para tipos serializáveis em DataFrame/JSON."""
    try:
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, Decimal128):
            # tenta converter para float/decimal
            try:
                return float(v.to_decimal())
            except Exception:
                return str(v)
        if isinstance(v, (datetime.date, datetime.datetime)):
            return v.isoformat()
        if isinstance(v, dict):
            return {k: _convert_bson_value(val) for k, val in v.items()}
        if isinstance(v, list):
            return [_convert_bson_value(x) for x in v]
        # tipos primitivos (int/float/str/bool/None) seguem iguais
        return v
    except Exception:
        # fallback seguro
        return str(v)


# ==================== GET TABLES ====================

def get_tables(request):
    """
    Retorna lista de tabelas/collections disponíveis no banco.
    Aceita tanto HttpRequest (Django) quanto dict (chamada interna via Celery).
    """
    try:
        # Aceita request ou dict
        if hasattr(request, "body"):  # Django HttpRequest
            body = json.loads(request.body)
        elif isinstance(request, dict):
            body = request
        else:
            return {"error": "Invalid request type"}, 400

        # Campos comuns
        host = body.get("host")
        port = body.get("port")
        user = body.get("user") or body.get("db_user")
        password = body.get("password")
        database = body.get("database")
        db_type = body.get("db_type", "postgresql").lower()

        # Suporte MongoDB: connection_string
        connection_string = body.get("connection_string") or body.get("connectionString") or None

        # ========== MongoDB ==========
        if db_type == "mongodb":
            if not connection_string:
                return {"error": "connection_string is required for MongoDB"}, 400

            # Conecta via pymongo
            client = pymongo.MongoClient(connection_string, serverSelectionTimeoutMS=5000)
            try:
                client.admin.command("ping")
            except Exception as e:
                return {"error": "Could not connect to MongoDB"}, 500

            tables = []

            # Se a URI contém DB (get_default_database retorna None se não houver)
            default_db = client.get_default_database()
            if default_db is not None:
                try:
                    collections = default_db.list_collection_names()
                    tables = collections
                except Exception as e:
                    return {"error": "Could not list collections"}, 500
            else:
                # Lista collections de todos os DBs (exclui dbs de sistema)
                try:
                    db_names = client.list_database_names()
                    for dbn in db_names:
                        if dbn in ("admin", "local", "config"):
                            continue
                        try:
                            colls = client[dbn].list_collection_names()
                            for c in colls:
                                tables.append(f"{dbn}.{c}")
                        except Exception:
                            # ignora DBs inacessíveis
                            continue
                except Exception as e:
                    return {"error": "Could not list databases:"}, 500

            # Limita (proteção) — evita listas gigantescas
            if len(tables) > 200:
                tables = tables[:200]

            if not tables:
                return {"error": "No collections found in the MongoDB deployment"}, 400

            return {"tables": tables}, 200

        # ========== PostgreSQL ==========
        if db_type == "postgresql":
            # validação SQL (mantida)
            if not all([host, port, user, password, database]):
                return {"error": "All database fields are required"}, 400

            conn_str = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
            table_query = """
            SELECT table_schema || '.' || table_name AS table_name
            FROM information_schema.tables
            WHERE table_type = 'BASE TABLE'
            AND table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name
            """
            table_filter = lambda tables: [t for t in tables if not t.startswith("pg_")]

        # ========== MySQL / MariaDB ==========
        elif db_type in ["mysql", "mariadb"]:
            if not all([host, port, user, password, database]):
                return {"error": "All database fields are required"}, 400

            driver = "pymysql"
            dialect = "mysql" if db_type == "mysql" else "mariadb"
            conn_str = f"{dialect}+{driver}://{user}:{password}@{host}:{port}/{database}"
            table_query = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
            """
            table_filter = lambda tables: tables

        # ========== Executa consulta para SQL ==========
        if db_type in ("postgresql", "mysql", "mariadb"):
            engine = sa.create_engine(conn_str)
            tables_df = pd.read_sql(table_query, engine)
            engine.dispose()

            colname = [c for c in tables_df.columns if c.lower() == "table_name"]
            if not colname:
                return {"error": f"Unexpected table list columns: {tables_df.columns.tolist()}"}, 500

            tables = table_filter(tables_df[colname[0]].tolist())
            if not tables:
                return {"error": "No user tables found in the database"}, 400

            return {"tables": tables}, 200

        # ========== Tipo não suportado ==========
        return {"error": f"Unsupported db_type: {db_type}"}, 400

    except Exception as e:
        print(f"[GET_TABLES][ERROR] {e}")
        return {"error": "Erro interno ao processar a tabela."}, 500


# ==================== FETCH & PROCESS TABLE ====================

def fetch_and_process_table(request):
    """
    Aceita tanto HttpRequest (via Django) quanto dict (via Celery/task).
    - Usa 'db_user' ou 'user_db' (do frontend) para autenticação do banco.
    - Usa 'django_user' (ou request.user) apenas para controle de quota/cache.
    """
    try:
        # ===== Detecta o tipo de request =====
        if hasattr(request, "body"):  # Django HttpRequest
            body = json.loads(request.body)
            django_user = getattr(request, "user", None)

        elif isinstance(request, dict):  # Celery task ou chamada direta
            if isinstance(request.get("body"), str):
                body = json.loads(request["body"])
            else:
                body = request.get("body", request)

            django_user = request.get("django_user") or None

        else:
            return {"error": "Invalid request type"}, 400

        # ===== Extrai parâmetros =====
        host = body.get("host")
        port = body.get("port")
        db_user = (
            body.get("db_user")
            or body.get("user_db")
            or body.get("connection_user")
            or body.get("database_user")
            or body.get("user")
        )
        password = body.get("password")
        database = body.get("database")
        table = body.get("table")
        db_type = (body.get("db_type") or "postgresql").lower()
        connection_string = body.get("connection_string") or body.get("connectionString")

        # ===== Validação =====
        if db_type == "mongodb":
            if not connection_string or not table:
                return {"error": "connection_string and table (collection) are required for MongoDB"}, 400
        else:
            if not all([host, port, db_user, password, database, table]):
                return {"error": "All database fields and table name are required"}, 400

        print(f"[DEBUG] Conectando ao banco como: {db_user} - tipo: {db_type}")

        # ===================================================================
        # RDBMS (PostgreSQL, MySQL, MariaDB)
        # ===================================================================
        if db_type == "postgresql":
            conn_str = f"postgresql+psycopg2://{db_user}:{password}@{host}:{port}/{database}"

            if "." in table:
                schema, table_name = table.split(".", 1)
                query = f'SELECT * FROM {schema}."{table_name}" LIMIT 1000'
            else:
                query = f'SELECT * FROM "{table}" LIMIT 1000'

            engine = sa.create_engine(conn_str)
            try:
                df = pd.read_sql(query, engine)
            finally:
                engine.dispose()

        elif db_type in ["mysql", "mariadb"]:
            driver = "pymysql"
            dialect = "mysql" if db_type == "mysql" else "mariadb"

            conn_str = f"{dialect}+{driver}://{db_user}:{password}@{host}:{port}/{database}"
            query = f"SELECT * FROM `{table}` LIMIT 1000"

            engine = sa.create_engine(conn_str)
            try:
                df = pd.read_sql(query, engine)
            finally:
                engine.dispose()

        # ===================================================================
        # MONGODB — INTEGRAÇÃO COMPLETA COM NORMALIZAÇÃO
        # ===================================================================
        elif db_type == "mongodb":
            from dashboard.utils.mongo_dataframe import docs_to_clean_dataframe

            # conecta
            client = pymongo.MongoClient(connection_string, serverSelectionTimeoutMS=5000)
            try:
                client.admin.command("ping")
            except Exception as e:
                return {"error": "Could not connect to MongoDB:"}, 500

            # define db + collection
            if "." in table:
                dbname, collname = table.split(".", 1)
            else:
                default_db = client.get_default_database()
                if default_db is None:
                    return {
                        "error": "Connection string has no default database. Use 'db.collection' or include database in URI."
                    }, 400

                dbname = default_db.name
                collname = table

            coll = client[dbname][collname]

            # busca docs
            cursor = coll.find().limit(1000)
            docs = list(cursor)
            client.close()

            if not docs:
                return {"error": "Collection empty or not found."}, 400

            # ⬇️ AQUI a parte importante: normalização/flatten
            df = docs_to_clean_dataframe(
                docs,
                list_strategy="most_recent",   # você pode mudar
                explode_arrays=[],             # ou ['grades']
                keep_raw=False
            )

        # ===================================================================
        else:
            return {"error": f"Unsupported db_type: {db_type}"}, 400

        # ===================================================================
        # Preparação final
        # ===================================================================
        df = df.reset_index(drop=True)
        df["index"] = df.index

        # ===== Processa com IA =====
        data = process_data(df, user=django_user)

        return data, 200

    except Exception as e:
        print(f"[FETCH_AND_PROCESS][ERROR] {e}")
        return {"error": "Erro interno ao processar a tabela."}, 500

