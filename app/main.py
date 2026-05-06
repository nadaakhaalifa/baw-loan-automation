from fastapi import FastAPI
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import Depends

from app.db.database import get_db
from app.tasks.email_tasks import test_celery_task

app = FastAPI(
    title="BAW Loan Automation API",
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

@app.post("/test-celery")
def test_celery():
    task = test_celery_task.delay("Nada")
    return {
        "message": "Task queued",
        "task_id": task.id,
    }