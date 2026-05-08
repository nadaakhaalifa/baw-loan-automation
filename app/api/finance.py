from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.workflow_task import WorkflowTask
from app.models.loan_application import LoanApplication
from app.schemas.loan_application import FinanceConfirmRequest
from app.services.workflow_service import finance_confirm
from app.services.email_service import create_email_log, send_real_email

"""
Finance API

This module handles finance department operations.
"""

router = APIRouter(prefix="/finance", tags=["Finance"])


@router.get("/tasks")
def get_finance_tasks(db: Session = Depends(get_db)):
    return db.query(WorkflowTask).filter(
        WorkflowTask.assigned_role == "FINANCE",
        WorkflowTask.status == "PENDING",
    ).all()


@router.post("/tasks/{task_id}/confirm-disbursement")
def confirm_disbursement(
    task_id: int,
    payload: FinanceConfirmRequest,
    db: Session = Depends(get_db),
):
    task = db.query(WorkflowTask).filter(
        WorkflowTask.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    loan = db.query(LoanApplication).filter(
        LoanApplication.id == task.loan_application_id
    ).first()

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    result = finance_confirm(
        db,
        task,
        payload.note,
    )

    db.refresh(loan)

    subject = "Loan Disbursement Completed Successfully"

    body = f"""
Hello {loan.customer_name},

Your loan application has been completed successfully.

Application ID: {loan.id}
Final Status: {loan.status}

Finance has confirmed the disbursement of your loan.

Finance Note: {payload.note or "No additional note provided."}

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

    return result