from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class WorkflowHistory(Base):
    __tablename__ = "workflow_history"

    id = Column(Integer, primary_key=True, index=True)
    loan_application_id = Column(Integer, ForeignKey("loan_applications.id"))

    from_status = Column(String, nullable=True)
    to_status = Column(String, nullable=False)
    action = Column(String, nullable=False)
    performed_by = Column(String, default="SYSTEM")
    note = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())