from regex import E
from rest_framework.decorators import api_view, permission_classes
from .handle_db import get_tables, fetch_and_process_table
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from dashboard.utils.quota import require_quota
from .handle_csv import handle_csv
from django.conf import settings
from django.utils import timezone
import boto3
import json
from ..models import Report

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_quota
def generate_chart_from_csv(request):
    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return Response({"error": "No file uploaded"}, status=400)

    try:
        # 1. Processa CSV
        result = handle_csv(uploaded_file)
        if(result):
            print("resultado gerado: ===>", result)

        # 2. Salvar JSON no S3
        s3 = boto3.client("s3")
        if(s3):
            print("s3 gerado: ===>", s3)

        file_key = f"reports/{request.user.id}/{timezone.now().isoformat()}.json"
        if(file_key):
            print("file_key gerado: ===>", file_key)

        body = json.dumps({
            "business_summary": result["business_summary"],
            "insights_text": result["insights_text"],
            "charts": result["charts"]
        })
        if(body):
            print("body gerado: ===>", body)

        s3.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=file_key,
            Body=body,
            ContentType="application/json"
        )
        s3_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_key}"
        if(s3_url):
            print("s3_url gerado: ===>", s3_url)


        try:
            # 3. Salvar no banco
            Report.objects.create(
                user=request.user,
                s3_key=file_key,
                s3_url=s3_url
            )
            print("Report criado!")
        except Exception as e:
            print("Erro ao salvar no banco: ====> ", e)
            return Response({"error": f"Erro ao salvar no banco: {str(e)}"}, status=500)


        # 4. Retornar resposta
        return Response({
            "business_summary": result["business_summary"],
            "charts": result["charts"],
            "insights_text": result["insights_text"],
            "s3_url": s3_url,
        })

    except Exception as e:
        print(e)
        return Response({"error": str(e)}, status=500)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_quota
def list_database_tables(request):
    data, status_code = get_tables(request)
    return Response(data, status=status_code)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@require_quota
def generate_chart_from_database(request):
    """
    Conecta ao DB, busca a tabela, processa, salva no S3 e no banco.
    """
    try:
        # 1. Processar tabela
        result, status_code = fetch_and_process_table(request)
        if status_code != 200:
            return Response(result, status=status_code)

        # 2. Salvar no S3
        s3 = boto3.client("s3")
        file_key = f"reports/{request.user.id}/{timezone.now().isoformat()}.json"
        body = json.dumps({
            "business_summary": result["business_summary"],
            "insights_text": result["insights_text"],
            "charts": result["charts"]
        })

        s3.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=file_key,
            Body=body,
            ContentType="application/json"
        )

        s3_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_key}"

        # 3. Salvar no banco
        Report.objects.create(
            user=request.user,
            s3_key=file_key,
            s3_url=s3_url
        )

        # 4. Retornar resposta
        return Response({
            "business_summary": result["business_summary"],
            "charts": result["charts"],
            "insights_text": result["insights_text"],
            "s3_url": s3_url,
        }, status=200)

    except Exception as e:
        print("Erro em generate_chart_from_database =>", e)
        return Response({"error": str(e)}, status=500)