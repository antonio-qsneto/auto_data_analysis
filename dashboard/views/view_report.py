# dashboard/views/view_report.py
import os
import uuid
import logging

import boto3 # type: ignore
from botocore.exceptions import ClientError # type: ignore

from django.conf import settings
from django.utils import timezone
from django.utils.text import get_valid_filename

from rest_framework.decorators import api_view, permission_classes, parser_classes # type: ignore
from rest_framework.permissions import IsAuthenticated # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework.parsers import MultiPartParser, FormParser # type: ignore
from django.shortcuts import get_object_or_404
from rest_framework import status # type: ignore



from ..models import Report

logger = logging.getLogger(__name__)
s3_client = boto3.client("s3")

def s3_file_exists(bucket_name, key):
    try:
        s3_client.head_object(Bucket=bucket_name, Key=key)
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == "404":
            return False
        logger.exception("Erro ao verificar existência do arquivo: %s", e)
        return False


def generate_presigned_url(key: str, expires_in: int = 3600) -> str | None:
    """
    Gera uma URL pré-assinada (GET) para um objeto S3.
    Retorna None em caso de falha.
    """
    try:
        # Se você tiver AWS_S3_REGION_NAME em settings, passe para o client
        region = getattr(settings, "AWS_S3_REGION_NAME", None)
        s3_client = boto3.client(
            "s3",
            region_name=region,
            # boto3 por padrão lê credenciais do env / profile / IAM role
            # Se preferir, force credenciais via settings (não recomendado em código).
        )
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": key},
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as e:
        logger.exception("Erro ao gerar presigned url para key=%s: %s", key, e)
        return None
    except Exception as e:
        logger.exception("Erro inesperado ao gerar presigned url: %s", e)
        return None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_report(request):
    """
    Recebe multipart/form-data com campo 'file'.
    Salva o Report (usa upload_to do model) e devolve a presigned url.
    """
    file = request.FILES.get("file")
    if not file:
        return Response({"error": "No file uploaded. Use 'file' field."}, status=400)

    try:
        now = timezone.now()
        created_label = now.strftime("%Y-%m-%d %H:%M:%S")
        # Mantemos 'name' amigável para exibição; extensão preservada
        ext = os.path.splitext(file.name)[1] or ".pdf"
        display_name = f"Report generated at {created_label}{ext}"

        # Cria o objeto Report (o FileField usará upload_to do model para gerar storage key)
        report = Report(user=request.user, name=display_name)
        # Salva arquivo: isso aciona upload_to do model e grava no storage (S3)
        report.file.save(file.name, file, save=True)

        # Gera presigned URL para o arquivo recém-salvo
        presigned = generate_presigned_url(report.file.name, expires_in=3600)

        return Response({
            "id": report.id, # type: ignore
            "name": report.name,
            "url": presigned or report.file.url,
            "created_at": report.created_at.isoformat(),
            "storage_key": report.file.name,
        }, status=201)
    except Exception as e:
        logger.exception("Erro no upload_report: %s", e)
        return Response({"error": "Failed to save file"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_reports(request):
    """
    Retorna lista de reports do usuário com presigned URLs,
    mas só para os arquivos que ainda existem no S3.
    """
    try:
        reports = Report.objects.filter(user=request.user).order_by("-created_at")
        data = []
        for report in reports:
            storage_key = report.file.name  # caminho interno no S3
            if not storage_key:
                continue

            # check existence in S3
            if not s3_file_exists(settings.AWS_STORAGE_BUCKET_NAME, storage_key):
                continue  # skip if missing

            presigned = generate_presigned_url(storage_key, expires_in=3600)
            url = presigned or (report.file.url if getattr(report.file, 'url', None) else None)

            data.append({
                "id": report.id, # type: ignore
                "name": report.name,
                "created_at": report.created_at.isoformat(),
                "url": url,
                "storage_key": storage_key,
            })
        return Response(data)

    except Exception as e:
        logger.exception("Erro no list_reports: %s", e)
        return Response({"error": "Failed to list reports"}, status=500)
    

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_report(request, report_id):
    try:
        report = Report.objects.get(id=report_id, user=request.user)
        
        # delete file from storage (S3 or local)
        if report.file:
            storage = report.file.storage
            if storage.exists(report.file.name):
                storage.delete(report.file.name)

        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    except Report.DoesNotExist:
        return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.exception("Error deleting report: %s", e)
        return Response({"error": "Failed to delete report"}, status=500)