from time import sleep

from app.tasks.celery_app import celery_app


@celery_app.task
def test_celery_task(name: str):
    sleep(5)
    return f"Celery is working, {name}!"