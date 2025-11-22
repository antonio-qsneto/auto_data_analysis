from celery import shared_task
from dashboard.views.handle_csv import handle_csv
from dashboard.views.handle_db import fetch_and_process_table
from dashboard.models import Report
from django.conf import settings
from django.utils import timezone
import boto3
import json
import traceback
import io
import numpy as np

# =====================================================
# 🔧 Função utilitária: limpeza de valores inválidos JSON
# =====================================================
def clean_json(obj):
    if isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return 0  # ou None se quiser que vá como null
        return obj
    elif isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json(v) for v in obj]
    return obj


# =====================================================
# 📊 TASK 1 — Processar CSV e salvar no S3
# =====================================================
@shared_task(bind=True, name="generate_chart_from_csv_task")
def generate_chart_from_csv_task(self, file_content, user_id):
    """
    Executa em background o pipeline de CSV -> LLM -> Charts -> S3 -> Report
    """
    try:
        # ====== 1️⃣ Obter usuário ======
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

        # ====== 2️⃣ Converter CSV recebido ======
        uploaded_file = io.BytesIO(file_content.encode("utf-8"))
        uploaded_file.name = "async_uploaded.csv"

        # ====== 3️⃣ Processar CSV (gera insights e salva df no Redis) ======
        result = handle_csv(uploaded_file, user=user)

        # ====== 4️⃣ Sanitizar dados ======
        safe_result = clean_json(result)

        # ====== 5️⃣ Salvar resultado no S3 ======
        s3 = boto3.client("s3")
        file_key = f"reports/{user.id}/{timezone.now().isoformat()}.json"  # type: ignore

        body = json.dumps({
            "business_summary": safe_result["business_summary"],
            "insights_text": safe_result["insights_text"],
            "charts": safe_result["charts"],
        }, allow_nan=False)

        s3.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=file_key,
            Body=body,
            ContentType="application/json"
        )

        s3_url = (
            f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3."
            f"{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_key}"
        )

        # ====== 6️⃣ Registrar no banco ======
        Report.objects.create(user=user, s3_key=file_key, s3_url=s3_url)

        print(f"[TASK] CSV processado e cache salvo para user:{user.id}")

        return {
            "status": "completed",
            "s3_url": s3_url,
            "business_summary": safe_result["business_summary"],
            "charts": safe_result["charts"],
            "insights_text": safe_result["insights_text"],
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "failed"}


# =====================================================
# 🗄️ TASK 2 — Processar Tabela de Banco e salvar no S3
# =====================================================
@shared_task(bind=True, name="generate_chart_from_database_task")
def generate_chart_from_database_task(self, connection_data, table, user_id):
    print("👋 Iniciando tarefa Celery para generate_chart_from_database...")

    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

        # Envia o payload de forma plana (sem JSON.dumps)
        request_payload = {
            **connection_data,
            "table": table,
            "db_user": connection_data.get("user"),  # garante que vai o certo
            "django_user": user,
        }

        result, status_code = fetch_and_process_table(request_payload)

        if status_code != 200:
            return {"status": "failed"}

        # ====== Sanitiza ======
        safe_result = clean_json(result)

        # ====== Salva no S3 ======
        s3 = boto3.client("s3")
        file_key = f"reports/{user.id}/{timezone.now().isoformat()}.json"
        body = json.dumps({
            "business_summary": safe_result["business_summary"],
            "insights_text": safe_result["insights_text"],
            "charts": safe_result["charts"],
        }, allow_nan=False)

        s3.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=file_key,
            Body=body,
            ContentType="application/json"
        )
        s3_url = (
            f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3."
            f"{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_key}"
        )

        # ====== Cria Report no banco ======
        Report.objects.create(user=user, s3_key=file_key, s3_url=s3_url)

        print(f"[TASK] ✅ Tabela processada e cache salvo para user:{user.id}")

        return {
            "status": "completed",
            "s3_url": s3_url,
            "business_summary": safe_result["business_summary"],
            "charts": safe_result["charts"],
            "insights_text": safe_result["insights_text"],
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "failed", "error": "Erro ao processar sua solicitação."}
