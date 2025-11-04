import json
import pandas as pd
import traceback
import sqlalchemy as sa
from .core import process_data

# ==================== DEPENDÊNCIAS ====================
import psycopg2


# ==================== GET TABLES ====================

def get_tables(request):
    if request.method != "POST":
        return {"error": "Only POST method allowed"}, 405

    try:
        body = json.loads(request.body)
        host = body.get("host")
        port = body.get("port")
        user = body.get("user")
        password = body.get("password")
        database = body.get("database")
        db_type = body.get("db_type", "postgresql").lower()

        if not all([host, port, user, password, database]):
            return {"error": "All database fields are required"}, 400

        # ========== PostgreSQL ==========
        if db_type == "postgresql":
            conn_str = f"postgresql+psycopg://{user}:{password}@{host}:{port}/{database}"
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

        # ========== Executa e corrige nome da coluna ==========
        engine = sa.create_engine(conn_str)
        tables_df = pd.read_sql(table_query, engine)

        colname = [c for c in tables_df.columns if c.lower() == "table_name"]
        if not colname:
            return {"error": f"Unexpected table list columns: {tables_df.columns.tolist()}"}, 500

        tables = table_filter(tables_df[colname[0]].tolist())
        engine.dispose()

        if not tables:
            return {"error": "No user tables found in the database"}, 400

        return {"tables": tables}, 200

    except Exception as e:
        print("error =>", e)
        return {"error": str(e), "traceback": traceback.format_exc()}, 500


# ==================== FETCH & PROCESS TABLE ====================

def fetch_and_process_table(request):
    if request.method != "POST":
        return {"error": "Only POST method allowed"}, 405

    try:
        body = json.loads(request.body)
        host = body.get("host")
        port = body.get("port")
        user = body.get("user")
        password = body.get("password")
        database = body.get("database")
        table = body.get("table")
        db_type = body.get("db_type", "postgresql").lower()

        if not all([host, port, user, password, database, table]):
            return {"error": "All database fields and table name are required"}, 400

        # ========== PostgreSQL ==========
        if db_type == "postgresql":
            conn_str = f"postgresql+psycopg://{user}:{password}@{host}:{port}/{database}"

            if "." in table:
                schema, table_name = table.split(".", 1)
                query = f'SELECT * FROM {schema}."{table_name}" LIMIT 1000'
            else:
                query = f'SELECT * FROM "{table}" LIMIT 1000'

        # ========== MySQL / MariaDB ==========
        elif db_type in ["mysql", "mariadb"]:
            driver = "pymysql"
            dialect = "mysql" if db_type == "mysql" else "mariadb"
            conn_str = f"{dialect}+{driver}://{user}:{password}@{host}:{port}/{database}"
            query = f"SELECT * FROM `{table}` LIMIT 1000"

        # ========== SQL Server ==========
        elif db_type == "sqlserver":
            conn_str = (
                f"mssql+pyodbc://{user}:{password}@{host}:{port}/{database}"
                "?driver=ODBC+Driver+17+for+SQL+Server"
            )
            query = f"SELECT TOP 1000 * FROM [{table}]"

        else:
            return {"error": f"Unsupported database type: {db_type}"}, 400

        # ========== Executa a Query ==========
        print(f"[DEBUG] Executando query:\n{query}")
        engine = sa.create_engine(conn_str)
        df = pd.read_sql(query, engine).reset_index(drop=True)
        df["index"] = df.index

        # ========== Processa com IA ==========
        data = process_data(df, user=request.user)
        engine.dispose()
        return data, 200

    except Exception as e:
        print("error =>", e)
        return {"error": str(e), "traceback": traceback.format_exc()}, 500
