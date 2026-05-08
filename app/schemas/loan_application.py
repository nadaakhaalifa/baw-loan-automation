from pydantic import BaseModel, EmailStr
from decimal import Decimal

"""
Loan Application Schemas

Defines Pydantic request models used by the API layer.

Responsibilities:
- Validate loan application input
- Validate manager decision input
- Validate finance confirmation input
- Provide clean request contracts for FastAPI endpoints

These schemas are separate from SQLAlchemy database models.
"""
class LoanApplicationCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    amount: Decimal
    purpose: str | None = None
    documents_complete: bool = False
    monthly_salary: Decimal | None = None
    employment_type: str | None = None
    purpose_details: str | None = None


class ManagerDecisionRequest(BaseModel):
    decision: str
    note: str | None = None


class FinanceConfirmRequest(BaseModel):
    note: str | None = None