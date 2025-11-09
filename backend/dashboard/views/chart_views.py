from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from dashboard.tasks.tasks import generate_chart_from_csv_task, generate_chart_from_database_task
from celery.result import AsyncResult
from dashboard.utils.quota import require_quota


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_chart_from_csv(request):
    print("👋 Iniciando tarefa Celery para generate_chart_from_csv...")
    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return Response({"error": "No file uploaded"}, status=400)

    # Lê conteúdo do arquivo
    csv_content = uploaded_file.read().decode("utf-8")

    # Enfileira task Celery
    task = generate_chart_from_csv_task.delay(csv_content, request.user.id)
    print("Task generate_chart_from_csv finalizada!")
    return Response({"task_id": task.id}, status=202)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_chart_from_database(request):
    print("👋 Iniciando tarefa Celery para generate_chart_from_database...")
    data = request.data
    connection_data = {
        "host": data.get("host"),
        "port": data.get("port"),
        "user": data.get("user"),
        "password": data.get("password"),
        "database": data.get("database"),
        "db_type": data.get("db_type", "postgresql").lower(),
    }
    table = data.get("table")

    task = generate_chart_from_database_task.delay(connection_data, table, request.user.id)
    print("Task generate_chart_from_database finalizada!")
    return Response({"task_id": task.id}, status=202)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_task_status(request, task_id):
    """Consulta o status e resultado de uma task Celery"""
    result = AsyncResult(task_id)
    if result.state in ["PENDING", "STARTED"]:
        return Response({"status": result.state})
    elif result.state == "FAILURE":
        return Response({"status": "failed", "error": str(result.info)}, status=500)
    else:
        return Response(result.result)
    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def list_database_tables(request):
    from .handle_db import get_tables
    data, status_code = get_tables(request)
    return Response(data, status=status_code)

