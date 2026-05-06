from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric
from sqlalchemy.sql import func
from app.db.database import Base


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    amount = Column(Numeric, nullable=False)
    purpose = Column(String, nullable=True)

    documents_complete = Column(Boolean, default=False)
    status = Column(String, default="SUBMITTED")

    manager_decision = Column(String, nullable=True)
    finance_decision = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())