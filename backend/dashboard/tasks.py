# backend/dashboard/tasks.py
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


@shared_task(bind=True, name="generate_chart_from_csv_task")
def generate_chart_from_csv_task(self, file_content, user_id):
    """
    Executa em background o pipeline de CSV -> LLM -> Charts -> S3 -> Report
    """
    try:
        # ====== 1️⃣ Processar CSV ======
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

        uploaded_file = io.BytesIO(file_content.encode("utf-8"))
        uploaded_file.name = "async_uploaded.csv"

        result = handle_csv(uploaded_file)

        # ====== 2️⃣ Salvar no S3 ======
        s3 = boto3.client("s3")
        file_key = f"reports/{user.id}/{timezone.now().isoformat()}.json"
        body = json.dumps({
            "business_summary": result["business_summary"],
            "insights_text": result["insights_text"],
            "charts": result["charts"],
        })

        s3.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=file_key,
            Body=body,
            ContentType="application/json"
        )
        s3_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_key}"

        # ====== 3️⃣ Registrar Report ======
        Report.objects.create(user=user, s3_key=file_key, s3_url=s3_url)

        return {
            "status": "completed",
            "s3_url": s3_url,
            "business_summary": result["business_summary"],
            "charts": result["charts"],
            "insights_text": result["insights_text"],
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "failed", "error": str(e)}


@shared_task(bind=True, name="generate_chart_from_database_task")
def generate_chart_from_database_task(self, connection_data, table, user_id):
    """
    Executa em background o pipeline DB -> LLM -> Charts -> S3 -> Report
    """
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

        result, status_code = fetch_and_process_table({"body": json.dumps({
            **connection_data,
            "table": table
        }), "method": "POST"})

        if status_code != 200:
            return {"status": "failed", "error": result.get("error")}

        # ====== Salvar no S3 ======
        s3 = boto3.client("s3")
        file_key = f"reports/{user.id}/{timezone.now().isoformat()}.json"
        body = json.dumps({
            "business_summary": result["business_summary"],
            "insights_text": result["insights_text"],
            "charts": result["charts"],
        })
        s3.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=file_key,
            Body=body,
            ContentType="application/json"
        )
        s3_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_key}"

        # ====== Salvar no banco ======
        Report.objects.create(user=user, s3_key=file_key, s3_url=s3_url)

        return {
            "status": "completed",
            "s3_url": s3_url,
            "business_summary": result["business_summary"],
            "charts": result["charts"],
            "insights_text": result["insights_text"],
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "failed", "error": str(e)}
