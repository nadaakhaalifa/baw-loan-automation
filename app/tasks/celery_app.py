from celery import Celery

from app.core.config import settings


celery_app = Celery(
    "baw_loan_automation",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.email_tasks",
        "app.tasks.escalation_tasks",
    ],
)

celery_app.conf.update(
    task_track_started=True,
    timezone="Africa/Cairo",
)