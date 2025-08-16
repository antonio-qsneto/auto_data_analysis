# handle_db.py (refactored for generic support)
import json
import pandas as pd
import traceback
import sqlalchemy as sa # type: ignore
from django.http import JsonResponse
from .core import process_data

def get_tables(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

    try:
        body = json.loads(request.body)
        host = body.get("host")
        port = body.get("port")
        user = body.get("user")
        password = body.get("password")
        database = body.get("database")
        db_type = body.get("db_type", "postgresql").lower()
        if not all([host, port, user, password, database]):
            return JsonResponse({"error": "All database fields are required"}, status=400)

        if db_type == "postgresql":
            conn_str = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
            table_query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
            table_filter = lambda tables: [t for t in tables if not t.startswith("pg_")]

        elif db_type in ["mysql", "mariadb"]:
            driver = "pymysql"
            dialect = "mysql" if db_type == "mysql" else "mariadb"
            conn_str = f"{dialect}+{driver}://{user}:{password}@{host}:{port}/{database}"
            table_query = "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'"
            table_filter = lambda tables: tables  # No specific prefix filter needed for MySQL/MariaDB
        elif db_type == "sqlserver":
            conn_str = f"mssql+pyodbc://{user}:{password}@{host}:{port}/{database}?driver=ODBC+Driver+17+for+SQL+Server"
            table_query = "SELECT name AS table_name FROM sys.tables WHERE type = 'U'"
            table_filter = lambda tables: tables  # User tables are filtered via type='U'
        else:
            return JsonResponse({"error": f"Unsupported database type: {db_type}"}, status=400)

        engine = sa.create_engine(conn_str)

        tables_df = pd.read_sql(table_query, engine)
        tables = table_filter(tables_df["table_name"].tolist())
        engine.dispose()  # <-- Add this line to close the connection
        if not tables:
            return JsonResponse({"error": "No user tables found in the database"}, status=400)

        return JsonResponse({"tables": tables})

    except Exception as e:
        print("error =>", e)
        return JsonResponse({
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500)

def fetch_and_process_table(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed"}, status=405)

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
            return JsonResponse({"error": "All database fields and table name are required"}, status=400)

        if db_type == "postgresql":
            conn_str = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
            identifier_quote = '"'
        elif db_type in ["mysql", "mariadb"]:
            driver = "pymysql"
            dialect = "mysql" if db_type == "mysql" else "mariadb"
            conn_str = f"{dialect}+{driver}://{user}:{password}@{host}:{port}/{database}"
            identifier_quote = '`'
        elif db_type == "sqlserver":
            conn_str = f"mssql+pyodbc://{user}:{password}@{host}:{port}/{database}?driver=ODBC+Driver+17+for+SQL+Server"
            identifier_quote_start = '['
            identifier_quote_end = ']'
        else:
            return JsonResponse({"error": f"Unsupported database type: {db_type}"}, status=400)

        engine = sa.create_engine(conn_str)

        if db_type == "sqlserver":
            query = f"SELECT * FROM {identifier_quote_start}{table}{identifier_quote_end}"
        else:
            query = f"SELECT * FROM {identifier_quote}{table}{identifier_quote}"
        df = pd.read_sql(query, engine).reset_index(drop=True)
        df["index"] = df.index

        data = process_data(df)
        engine.dispose()
        return JsonResponse(data)

    except Exception as e:
        print("error =>", e)
        return JsonResponse({
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500)