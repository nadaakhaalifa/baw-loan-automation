from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.workflow_task import WorkflowTask
from app.models.loan_application import LoanApplication
from app.schemas.loan_application import ManagerDecisionRequest
from app.services.workflow_service import manager_decision
from app.services.email_service import create_email_log, send_real_email

"""
Manager Approval API

This module contains endpoints used by managers
to review and approve/reject loan applications.
"""

router = APIRouter(prefix="/manager", tags=["Manager"])


@router.get("/tasks")
def get_manager_tasks(db: Session = Depends(get_db)):
    return db.query(WorkflowTask).filter(
        WorkflowTask.assigned_role == "MANAGER",
        WorkflowTask.status == "PENDING",
    ).all()


@router.post("/tasks/{task_id}/decision")
def decide(
    task_id: int,
    payload: ManagerDecisionRequest,
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

    if payload.decision not in ["APPROVE", "REJECT"]:
        raise HTTPException(
            status_code=400,
            detail="Decision must be APPROVE or REJECT",
        )

    loan = db.query(LoanApplication).filter(
        LoanApplication.id == task.loan_application_id
    ).first()

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found",
        )

    result = manager_decision(
        db,
        task,
        payload.decision,
        payload.note,
    )

    db.refresh(loan)

    if payload.decision == "APPROVE":
        subject = "Loan Application Approved by Manager"
        body = f"""
Hello {loan.customer_name},

Your loan application has been approved by the manager.

Application ID: {loan.id}
Current Status: {loan.status}

Your application has now moved to the next step in the workflow.

Best regards,
BAW Loan Automation Team
"""
    else:
        subject = "Loan Application Rejected by Manager"
        body = f"""
Hello {loan.customer_name},

We are sorry to inform you that your loan application has been rejected by the manager.

Application ID: {loan.id}
Current Status: {loan.status}
Manager Note: {payload.note or "No additional note provided."}

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