from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.workflow_task import WorkflowTask
from app.schemas.loan_application import FinanceConfirmRequest
from app.services.workflow_service import finance_confirm

"""
Finance API

This module handles finance department operations.

Responsibilities:
- Retrieve finance processing tasks
- Confirm loan disbursement
- Complete finance workflow stage
- Finalize loan applications

This represents the final operational step
before the workflow reaches COMPLETED status.
"""

router = APIRouter(prefix="/finance", tags=["Finance"])


@router.get("/tasks")
def get_finance_tasks(db: Session = Depends(get_db)):
    return db.query(WorkflowTask).filter(
        WorkflowTask.assigned_role == "FINANCE",
        WorkflowTask.status == "PENDING",
    ).all()


@router.post("/tasks/{task_id}/confirm-disbursement")
def confirm_disbursement(task_id: int, payload: FinanceConfirmRequest, db: Session = Depends(get_db)):
    task = db.query(WorkflowTask).filter(WorkflowTask.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return finance_confirm(db, task, payload.note)