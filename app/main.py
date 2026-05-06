"""
Main FastAPI Application

This file is the main entry point of the BAW Inspired Loan Workflow API.

Responsibilities:
- Initialize FastAPI application
- Register API routers
- Expose health check endpoints
- Connect all workflow modules together

This application simulates an enterprise workflow automation
system similar to IBM BAW.
"""
from fastapi import FastAPI
from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.finance import router as finance_router
from app.api.loan_applications import router as loan_router
from app.api.manager import router as manager_router
from app.db.database import get_db
from app.api.auth import router as auth_router
from app.core.dependencies import get_current_user
from app.models.user import User

app = FastAPI(
    title="BAW Inspired Loan Workflow API",
    description="A BAW-inspired enterprise loan workflow automation system.",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "Welcome to BAW Loan Automation API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"database": "connected"}


@app.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
    }
    
    
app.include_router(loan_router)
app.include_router(manager_router)
app.include_router(finance_router)
app.include_router(auth_router)


