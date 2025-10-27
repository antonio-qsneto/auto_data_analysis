from celery import shared_task
import time

@shared_task(bind=True)
def hello_celery(self, name="Antonio"):
    print(f"👋 Iniciando tarefa Celery de teste para {name}...")
    time.sleep(5)  # simula processamento
    message = f"✅ Olá, {name}! Celery está funcionando corretamente."
    print(message)
    return {"status": "completed", "message": message}
