from app.tasks.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.email_log import EmailLog
from app.services.email_service import send_real_email

"""
Email Background Tasks

Contains asynchronous Celery tasks related to email operations.

Responsibilities:
- Execute email tasks in background
- Simulate delayed email sending
- Prevent blocking API requests

These tasks run independently from FastAPI
using Celery workers.
"""

@celery_app.task
def send_email_task(email_log_id: int):
    db = SessionLocal()

    try:
        email = db.query(EmailLog).filter(EmailLog.id == email_log_id).first()

        if not email:
            return "Email log not found"

        send_real_email(
            to_email=email.to_email,
            subject=email.subject,
            body=email.body,
        )

        email.status = "SENT"
        db.commit()

        return "Email sent"

    except Exception as e:
        if email:
            email.status = "FAILED"
            db.commit()
        raise e

    finally:
        db.close()