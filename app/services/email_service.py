import smtplib
from email.message import EmailMessage
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.email_log import EmailLog

"""
Email Service

Handles email notification operations for workflow events.

Current Version:
- Simulates emails by storing them in database logs

Future Version:
- SMTP integration for real email delivery

Responsibilities:
- Queue workflow emails
- Store email logs
- Prepare notification messages
- Support async email processing
"""

def create_email_log(
    db: Session,
    loan_application_id: int,
    to_email: str,
    subject: str,
    body: str,
    status: str = "QUEUED",
):
    email = EmailLog(
        loan_application_id=loan_application_id,
        to_email=to_email,
        subject=subject,
        body=body,
        status=status,
    )
    db.add(email)
    db.commit()
    db.refresh(email)
    return email


def send_real_email(to_email: str, subject: str, body: str):
    if not settings.SMTP_ENABLED:
        return

    msg = EmailMessage()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)