from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.core.config import settings
from app.models.loan_application import LoanApplication
from app.models.workflow_task import WorkflowTask
from app.models.workflow_history import WorkflowHistory
from app.services.email_service import create_email_log
from app.tasks.email_tasks import send_email_task
from app.tasks.escalation_tasks import escalate_manager_task

"""
Workflow Service

This file contains the core business workflow engine logic.

Responsibilities:
- Process loan applications
- Validate customer documents
- Decide automatic approval or manager approval
- Create workflow history records
- Generate finance tasks
- Trigger email notifications
- Handle resubmission flow
- Update workflow states

This service acts as the orchestration layer
for the entire loan lifecycle.
"""

def add_history(db: Session, loan_id: int, from_status: str, to_status: str, action: str, performed_by="SYSTEM", note=None):
    history = WorkflowHistory(
        loan_application_id=loan_id,
        from_status=from_status,
        to_status=to_status,
        action=action,
        performed_by=performed_by,
        note=note,
    )
    db.add(history)


def update_status(db: Session, loan: LoanApplication, new_status: str, action: str, performed_by="SYSTEM", note=None):
    old_status = loan.status
    loan.status = new_status
    add_history(db, loan.id, old_status, new_status, action, performed_by, note)


def queue_email(db: Session, loan: LoanApplication, subject: str, body: str):
    email = create_email_log(
        db=db,
        loan_application_id=loan.id,
        to_email=loan.customer_email,
        subject=subject,
        body=body,
    )

    send_email_task.delay(email.id)
    return email


def create_task(db: Session, loan_id: int, task_type: str, assigned_role: str):
    task = WorkflowTask(
        loan_application_id=loan_id,
        task_type=task_type,
        assigned_role=assigned_role,
        status="PENDING",
    )
    db.add(task)
    db.flush()
    return task


def start_loan_workflow(db: Session, loan: LoanApplication):
    queue_email(
        db,
        loan,
        "Loan Application Submitted",
        "Your loan application has been submitted successfully. We are validating your documents.",
    )

    update_status(db, loan, "VALIDATING_DOCUMENTS", "START_DOCUMENT_VALIDATION")

    validate_documents(db, loan)

    db.commit()
    db.refresh(loan)
    return loan


def validate_documents(db: Session, loan: LoanApplication):
    if not loan.documents_complete:
        update_status(db, loan, "MISSING_DOCUMENTS", "DOCUMENTS_INCOMPLETE")

        queue_email(
            db,
            loan,
            "Missing Documents Required",
            "Your loan application is missing documents. Please resubmit the required documents.",
        )

        create_task(db, loan.id, "CUSTOMER_RESUBMISSION", "CUSTOMER")
        return

    update_status(db, loan, "DOCUMENTS_VALIDATED", "DOCUMENTS_VALIDATED")
    route_by_amount(db, loan)


def route_by_amount(db: Session, loan: LoanApplication):
    # Auto approve loans less than or equal to configured limit
    if float(loan.amount) <= settings.AUTO_APPROVAL_LIMIT:
        update_status(db, loan, "AUTO_APPROVED", "AUTO_APPROVED_BY_AMOUNT_RULE")

        queue_email(
            db,
            loan,
            "Loan Automatically Approved",
            "Your loan application has been automatically approved and sent to finance.",
        )

        send_to_finance(db, loan)
        return

    update_status(db, loan, "WAITING_MANAGER_APPROVAL", "MANAGER_APPROVAL_REQUIRED")

    queue_email(
        db,
        loan,
        "Loan Application Under Manager Review",
        "Your loan amount requires manager approval. We will notify you once a decision is made.",
    )

    task = create_task(db, loan.id, "MANAGER_APPROVAL", "MANAGER")

    escalate_manager_task.apply_async(
        args=[task.id],
        countdown=settings.MANAGER_ESCALATION_SECONDS,
    )


def manager_decision(db: Session, task: WorkflowTask, decision: str, note: str = None):
    loan = db.query(LoanApplication).filter(LoanApplication.id == task.loan_application_id).first()

    task.status = "COMPLETED"
    task.decision = decision
    task.note = note
    task.completed_at = func.now()

    if decision == "REJECT":
        loan.manager_decision = "REJECTED"
        update_status(db, loan, "REJECTED", "MANAGER_REJECTED", performed_by="MANAGER", note=note)

        queue_email(
            db,
            loan,
            "Loan Application Rejected",
            "We regret to inform you that your loan application has been rejected.",
        )

    elif decision == "APPROVE":
        loan.manager_decision = "APPROVED"
        update_status(db, loan, "MANAGER_APPROVED", "MANAGER_APPROVED", performed_by="MANAGER", note=note)

        queue_email(
            db,
            loan,
            "Loan Approved by Manager",
            "Your loan application has been approved by the manager and sent to finance.",
        )

        send_to_finance(db, loan)

    db.commit()
    db.refresh(loan)
    return loan


def send_to_finance(db: Session, loan: LoanApplication):
    update_status(db, loan, "SENT_TO_FINANCE", "CREATE_FINANCE_TASK")
    create_task(db, loan.id, "FINANCE_DISBURSEMENT", "FINANCE")


def finance_confirm(db: Session, task: WorkflowTask, note: str = None):
    loan = db.query(LoanApplication).filter(LoanApplication.id == task.loan_application_id).first()

    task.status = "COMPLETED"
    task.decision = "DISBURSED"
    task.note = note
    task.completed_at = func.now()

    loan.finance_decision = "DISBURSED"

    update_status(db, loan, "COMPLETED", "FINANCE_DISBURSED", performed_by="FINANCE", note=note)

    queue_email(
        db,
        loan,
        "Loan Disbursement Completed",
        "Your loan has been processed by finance and the disbursement has been completed.",
    )

    db.commit()
    db.refresh(loan)
    return loan