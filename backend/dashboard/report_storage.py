import json
from pathlib import Path

import boto3
from django.conf import settings
from django.utils import timezone


def build_report_payload(result):
    return {
        "business_summary": result["business_summary"],
        "insights_text": result["insights_text"],
        "charts": result["charts"],
    }


def save_report_payload(user_id, payload):
    file_key = f"reports/{user_id}/{timezone.now().strftime('%Y%m%dT%H%M%S')}.json"
    body = json.dumps(payload, allow_nan=False)

    if settings.AWS_STORAGE_BUCKET_NAME:
        s3 = boto3.client("s3")
        s3.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=file_key,
            Body=body,
            ContentType="application/json",
        )
        url = (
            f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3."
            f"{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_key}"
        )
        return file_key, url

    local_path = _local_path(file_key)
    local_path.parent.mkdir(parents=True, exist_ok=True)
    local_path.write_text(body, encoding="utf-8")
    return file_key, str(local_path)


def load_report_payload(file_key):
    if settings.AWS_STORAGE_BUCKET_NAME:
        s3 = boto3.client("s3")
        obj = s3.get_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=file_key)
        return json.loads(obj["Body"].read().decode("utf-8"))

    return json.loads(_local_path(file_key).read_text(encoding="utf-8"))


def delete_report_payload(file_key):
    if settings.AWS_STORAGE_BUCKET_NAME:
        s3 = boto3.client("s3")
        s3.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=file_key)
        return

    _local_path(file_key).unlink(missing_ok=True)


def _local_path(file_key):
    root = Path(settings.LOCAL_REPORTS_ROOT).resolve()
    path = (root / file_key).resolve()
    if root not in path.parents and path != root:
        raise ValueError("Invalid report path.")
    return path
