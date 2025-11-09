import json
import pandas as pd
import traceback
import sqlalchemy as sa
from .core import process_data
import psycopg2  # apenas para compatibilidade com sqlalchemy+psycopg2


# ==================== GET TABLES ====================

def get_tables(request):
    """
    Retorna lista de tabelas disponíveis no banco.
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

        host = body.get("host")
        port = body.get("port")
        user = body.get("user") or body.get("db_user")
        password = body.get("password")
        database = body.get("database")
        db_type = body.get("db_type", "postgresql").lower()

        if not all([host, port, user, password, database]):
            return {"error": "All database fields are required"}, 400

        # ========== PostgreSQL ==========
        if db_type == "postgresql":
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
            driver = "pymysql"
            dialect = "mysql" if db_type == "mysql" else "mariadb"
            conn_str = f"{dialect}+{driver}://{user}:{password}@{host}:{port}/{database}"
            table_query = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
            """
            table_filter = lambda tables: tables

        # ========== SQL Server ==========
        elif db_type == "sqlserver":
            conn_str = (
                f"mssql+pyodbc://{user}:{password}@{host}:{port}/{database}"
                "?driver=ODBC+Driver+17+for+SQL+Server"
            )
            table_query = "SELECT name AS table_name FROM sys.tables WHERE type = 'U'"
            table_filter = lambda tables: tables

        else:
            return {"error": f"Unsupported database type: {db_type}"}, 400

        # ========== Executa consulta ==========
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

    except Exception as e:
        print(f"[GET_TABLES][ERROR] {e}")
        return {"error": str(e), "traceback": traceback.format_exc()}, 500


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
            # request pode ter 'body' serializado
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
        )
        password = body.get("password")
        database = body.get("database")
        table = body.get("table")
        db_type = (body.get("db_type") or "postgresql").lower()

        # ===== Validação básica =====
        if not all([host, port, db_user, password, database, table]):
            print(f"[FETCH_AND_PROCESS][INVALID PARAMS] body={body}")
            return {"error": "All database fields and table name are required"}, 400

        print(f"[DEBUG] Conectando ao banco como: {db_user}")

        # ===== Monta conexão =====
        if db_type == "postgresql":
            conn_str = f"postgresql+psycopg2://{db_user}:{password}@{host}:{port}/{database}"
            if "." in table:
                schema, table_name = table.split(".", 1)
                query = f'SELECT * FROM {schema}."{table_name}" LIMIT 1000'
            else:
                query = f'SELECT * FROM "{table}" LIMIT 1000'

        elif db_type in ["mysql", "mariadb"]:
            driver = "pymysql"
            dialect = "mysql" if db_type == "mysql" else "mariadb"
            conn_str = f"{dialect}+{driver}://{db_user}:{password}@{host}:{port}/{database}"
            query = f"SELECT * FROM `{table}` LIMIT 1000"

        elif db_type == "sqlserver":
            conn_str = (
                f"mssql+pyodbc://{db_user}:{password}@{host}:{port}/{database}"
                "?driver=ODBC+Driver+17+for+SQL+Server"
            )
            query = f"SELECT TOP 1000 * FROM [{table}]"

        else:
            return {"error": f"Unsupported database type: {db_type}"}, 400

        print(f"[DEBUG] Executando query:\n{query}")
        print(f"[DEBUG] Connection string: {conn_str}")

        # ===== Executa a query =====
        engine = sa.create_engine(conn_str)
        try:
            df = pd.read_sql(query, engine)
        finally:
            engine.dispose()

        df = df.reset_index(drop=True)
        df["index"] = df.index

        # ===== Processa com IA =====
        data = process_data(df, user=django_user)
        return data, 200

    except Exception as e:
        print(f"[FETCH_AND_PROCESS][ERROR] {e}")
        return {"error": str(e), "traceback": traceback.format_exc()}, 500