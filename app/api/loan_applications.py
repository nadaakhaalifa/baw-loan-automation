from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.loan_application import LoanApplication
from app.models.workflow_history import WorkflowHistory
from app.models.email_log import EmailLog
from app.models.workflow_task import WorkflowTask
from app.schemas.loan_application import LoanApplicationCreate
from app.services.workflow_service import start_loan_workflow, validate_documents
from app.services.email_service import create_email_log, send_real_email
from app.core.dependencies import get_current_user
from app.models.user import User

"""
Loan Applications API

Main API endpoints for customer loan workflow operations.

Responsibilities:
- Submit loan applications
- Retrieve loan details
- Retrieve workflow history
- Retrieve email logs
- Resubmit missing documents

This module acts as the customer-facing workflow API.
"""

router = APIRouter(prefix="/loan-applications", tags=["Loan Applications"])


@router.post("")
def create_loan_application(
    payload: LoanApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loan = LoanApplication(**payload.model_dump())

    if not loan.customer_email:
        loan.customer_email = current_user.email

    db.add(loan)
    db.commit()
    db.refresh(loan)

    start_loan_workflow(db, loan)

    subject = "Loan Application Submitted Successfully"

    body = f"""
Hello {loan.customer_name},

Your loan application has been submitted successfully.

Application ID: {loan.id}
Requested Amount: {loan.amount}
Current Status: {loan.status}

We will notify you once your application is reviewed.

Best regards,
BAW Loan Automation Team
"""

    email_sent = send_real_email(
        to_email=loan.customer_email,
        subject=subject,
        body=body,
    )

    create_email_log(
        db=db,
        loan_application_id=loan.id,
        to_email=loan.customer_email,
        subject=subject,
        body=body,
        status="SENT" if email_sent else "FAILED",
    )

    db.refresh(loan)

    return loan


@router.get("")
def list_loan_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "ADMIN":
        return db.query(LoanApplication).all()

    return db.query(LoanApplication).filter(
        LoanApplication.customer_email == current_user.email
    ).all()


@router.get("/{loan_id}")
def get_loan_application(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(LoanApplication).filter(
        LoanApplication.id == loan_id
    ).first()

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    return loan


@router.post("/{loan_id}/resubmit-documents")
def resubmit_documents(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(LoanApplication).filter(
        LoanApplication.id == loan_id
    ).first()

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    loan.documents_complete = True
    loan.status = "VALIDATING_DOCUMENTS"

    pending_task = db.query(WorkflowTask).filter(
        WorkflowTask.loan_application_id == loan_id,
        WorkflowTask.task_type == "CUSTOMER_RESUBMISSION",
        WorkflowTask.status == "PENDING",
    ).first()

    if pending_task:
        pending_task.status = "COMPLETED"

    validate_documents(db, loan)
    db.commit()
    db.refresh(loan)

    subject = "Loan Documents Resubmitted Successfully"

    body = f"""
Hello {loan.customer_name},

Your missing documents have been resubmitted successfully.

Application ID: {loan.id}
Current Status: {loan.status}

We will continue processing your application.

Best regards,
BAW Loan Automation Team
"""

    email_sent = send_real_email(
        to_email=loan.customer_email,
        subject=subject,
        body=body,
    )

    create_email_log(
        db=db,
        loan_application_id=loan.id,
        to_email=loan.customer_email,
        subject=subject,
        body=body,
        status="SENT" if email_sent else "FAILED",
    )

    return loan


@router.get("/{loan_id}/history")
def get_history(loan_id: int, db: Session = Depends(get_db)):
    return db.query(WorkflowHistory).filter(
        WorkflowHistory.loan_application_id == loan_id
    ).all()


@router.get("/{loan_id}/emails")
def get_emails(loan_id: int, db: Session = Depends(get_db)):
    return db.query(EmailLog).filter(
        EmailLog.loan_application_id == loan_id
    ).all()