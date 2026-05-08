
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
import smtplib
from email.message import EmailMessage
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.email_log import EmailLog


def create_email_log(
    db: Session,
    loan_application_id: int | None,
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
        print("SMTP is disabled. Email was not sent.")
        return False

    msg = EmailMessage()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(
                settings.SMTP_USERNAME,
                settings.SMTP_PASSWORD,
            )
            server.send_message(msg)

        print(f"Email sent successfully to {to_email}")
        return True

    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False