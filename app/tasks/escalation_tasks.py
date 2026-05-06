from app.tasks.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.workflow_task import WorkflowTask
from app.models.loan_application import LoanApplication
from app.models.workflow_history import WorkflowHistory
from app.services.email_service import create_email_log
from app.tasks.email_tasks import send_email_task

"""
Escalation Tasks

Contains delayed workflow escalation logic.

Example:
- Escalate manager approvals if no response
within configured timeout period

Responsibilities:
- Monitor delayed approvals
- Trigger escalation notifications
- Support enterprise SLA workflows
"""

@celery_app.task
def escalate_manager_task(task_id: int):
    db = SessionLocal()

    try:
        task = db.query(WorkflowTask).filter(WorkflowTask.id == task_id).first()

        if not task:
            return "Task not found"

        if task.status != "PENDING":
            return "Task already completed. No escalation needed."

        loan = db.query(LoanApplication).filter(
            LoanApplication.id == task.loan_application_id
        ).first()

        history = WorkflowHistory(
            loan_application_id=loan.id,
            from_status=loan.status,
            to_status=loan.status,
            action="MANAGER_APPROVAL_ESCALATED",
            performed_by="SYSTEM",
            note="Manager approval task exceeded allowed waiting time.",
        )

        db.add(history)

        email = create_email_log(
            db=db,
            loan_application_id=loan.id,
            to_email=loan.customer_email,
            subject="Loan Application Still Under Review",
            body="Your loan application is still waiting for manager approval. The task has been escalated internally.",
        )

        send_email_task.delay(email.id)

        db.commit()

        return "Escalation completed"

    finally:
        db.close()