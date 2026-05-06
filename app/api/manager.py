from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.workflow_task import WorkflowTask
from app.schemas.loan_application import ManagerDecisionRequest
from app.services.workflow_service import manager_decision

"""
Manager Approval API

This module contains endpoints used by managers
to review and approve/reject loan applications.

Responsibilities:
- Retrieve pending manager approval tasks
- Approve loans
- Reject loans
- Add manager notes/comments

Used when loan amount exceeds the automatic approval limit.
"""

router = APIRouter(prefix="/manager", tags=["Manager"])


@router.get("/tasks")
def get_manager_tasks(db: Session = Depends(get_db)):
    return db.query(WorkflowTask).filter(
        WorkflowTask.assigned_role == "MANAGER",
        WorkflowTask.status == "PENDING",
    ).all()


@router.post("/tasks/{task_id}/decision")
def decide(task_id: int, payload: ManagerDecisionRequest, db: Session = Depends(get_db)):
    task = db.query(WorkflowTask).filter(WorkflowTask.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.decision not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Decision must be APPROVE or REJECT")

    return manager_decision(db, task, payload.decision, payload.note)