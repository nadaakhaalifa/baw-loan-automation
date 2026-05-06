from fastapi import FastAPI

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