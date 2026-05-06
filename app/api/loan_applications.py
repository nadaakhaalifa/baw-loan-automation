from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.loan_application import LoanApplication
from app.models.workflow_history import WorkflowHistory
from app.models.email_log import EmailLog
from app.models.workflow_task import WorkflowTask
from app.schemas.loan_application import LoanApplicationCreate
from app.services.workflow_service import start_loan_workflow, validate_documents

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
def create_loan_application(payload: LoanApplicationCreate, db: Session = Depends(get_db)):
    loan = LoanApplication(**payload.model_dump())
    db.add(loan)
    db.commit()
    db.refresh(loan)

    start_loan_workflow(db, loan)

    return loan


@router.get("")
def list_loan_applications(db: Session = Depends(get_db)):
    return db.query(LoanApplication).all()


@router.get("/{loan_id}")
def get_loan_application(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(LoanApplication).filter(LoanApplication.id == loan_id).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan application not found")

    return loan


@router.post("/{loan_id}/resubmit-documents")
def resubmit_documents(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(LoanApplication).filter(LoanApplication.id == loan_id).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan application not found")

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