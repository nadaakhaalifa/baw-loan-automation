from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

"""
Workflow Task Model

Represents workflow tasks assigned to departments
such as managers and finance teams.

Responsibilities:
- Store task ownership
- Track task status
- Track pending workflow actions
- Support approval/disbursement operations
"""

class WorkflowTask(Base):
    __tablename__ = "workflow_tasks"

    id = Column(Integer, primary_key=True, index=True)
    loan_application_id = Column(Integer, ForeignKey("loan_applications.id"))

    task_type = Column(String, nullable=False)
    assigned_role = Column(String, nullable=False)
    status = Column(String, default="PENDING")
    decision = Column(String, nullable=True)
    note = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)