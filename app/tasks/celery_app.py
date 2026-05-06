from celery import Celery

from app.core.config import settings

"""
Celery Configuration

This file initializes the Celery application used for
background task processing.

Responsibilities:
- Configure Celery workers
- Register async task modules
- Enable distributed background processing

Used for:
- Email processing
- Escalation tasks
- Delayed workflow actions
"""

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