from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.db.database import Base

"""
Email Log Model

Stores email notification records generated
during workflow processing.

Responsibilities:
- Store recipient information
- Store email subjects/bodies
- Track email status
- Support future SMTP integration
"""

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    loan_application_id = Column(Integer, ForeignKey("loan_applications.id"))

    to_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, default="QUEUED")

    created_at = Column(DateTime(timezone=True), server_default=func.now())