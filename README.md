# BAW Loan Automation Platform

A production-style loan workflow automation platform inspired by enterprise Business Automation Workflow (BAW) systems. The platform automates the complete loan lifecycle — from customer submission and document validation to approval routing, manager review, finance disbursement, audit tracking, email notifications, SMS-based password recovery, and role-based operational dashboards.

Built using FastAPI, React, PostgreSQL, Redis, Celery, Docker, JWT authentication, Twilio Verify, and SMTP email services, the project demonstrates enterprise-level workflow orchestration, asynchronous background processing, secure authentication, and modern full-stack architecture principles.

## Project Overview

BAW Loan Automation is a full-stack workflow orchestration system designed to simulate how financial institutions digitize and automate loan processing operations. The platform applies configurable business rules, routes applications between departments, generates workflow tasks, records every status transition, and integrates real email and SMS notification services.

The system supports three primary operational roles:

- **Customer** — submits and tracks loan applications.
- **Manager** — reviews high-value applications requiring manual approval.
- **Finance** — confirms loan disbursement and finalizes workflows.
## Key Features

### Authentication and Security

- JWT-based authentication.
- Role-based routing for customer, manager, finance, and admin users.
- Secure registration and login flow.
- Phone number storage for account recovery.
- Password strength validation on the frontend.
- SMS verification for password reset using Twilio Verify.
- Real email confirmation after registration and password reset.

### Loan Workflow Automation

- Customer loan application submission.
- Automated document validation.
- Configurable automatic approval limit.
- Automatic approval for eligible loans.
- Manager approval workflow for high-value loans.
- Finance disbursement workflow after approval.
- Customer document resubmission flow for incomplete applications.
- Escalation support using Celery scheduled tasks.

### Workflow Tracking and Auditability

- Workflow task creation and completion.
- Full workflow history records for every status transition.
- Email notification logs stored in the database.
- Clear separation between loan applications, workflow tasks, workflow history, users, and email logs.

### Notifications

- Real SMTP email sending for important workflow events.
- Email log persistence for traceability.
- Twilio SMS verification for secure password recovery.
- Customer notifications for submission, approval, rejection, finance completion, missing documents, and password reset.

### Dashboards and UI

- Professional React + Vite frontend.
- Customer dashboard for loan submission and tracking.
- Manager dashboard for approval decisions and risk review.
- Finance dashboard for disbursement confirmation.
- Dark glassmorphism UI design with gradient cards, status badges, and role-specific layouts.
- Logged-in user profile displayed in dashboard headers.

## Tech Stack

### Backend

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Redis
- Celery
- JWT Authentication
- Twilio Verify API
- SMTP Email Integration
- Docker and Docker Compose

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Protected routes
- Role-based navigation

### Infrastructure

- Dockerized FastAPI API service
- Dockerized Celery worker
- PostgreSQL database container
- Redis container
- Environment-based configuration

## Workflow Lifecycle

1. Customer submits a loan application.
2. The workflow engine starts document validation.
3. If documents are incomplete, the application moves to missing documents status.
4. If documents are complete, the system checks the loan amount.
5. Loans under or equal to the configured limit are automatically approved.
6. Loans above the limit are routed to the manager approval queue.
7. The manager approves or rejects the application.
8. Approved loans are sent to finance.
9. Finance confirms disbursement.
10. The workflow is completed and the customer receives a final notification.

## Business Rules

- Loans less than or equal to the automatic approval limit are auto-approved.
- Loans above the automatic approval limit require manager approval.
- Missing documents pause the workflow and create a customer resubmission task.
- Manager approval creates a finance disbursement task.
- Finance confirmation marks the workflow as completed.

## Main Backend Modules

```txt
app/
├── api/
│   ├── auth.py
│   ├── loan_applications.py
│   ├── manager.py
│   └── finance.py
├── core/
│   ├── config.py
│   ├── dependencies.py
│   └── security.py
├── db/
│   └── database.py
├── models/
│   ├── user.py
│   ├── loan_application.py
│   ├── workflow_task.py
│   ├── workflow_history.py
│   └── email_log.py
├── schemas/
│   ├── auth.py
│   └── loan_application.py
├── services/
│   ├── workflow_service.py
│   ├── email_service.py
│   └── sms_service.py
└── tasks/
    ├── celery_app.py
    ├── email_tasks.py
    └── escalation_tasks.py
```

## Frontend Structure

```txt
frontend/src/
├── api/
│   ├── authApi.ts
│   ├── loanApi.ts
│   ├── managerApi.ts
│   └── financeApi.ts
├── layouts/
│   └── AppLayout.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ManagerPage.tsx
│   └── FinancePage.tsx
├── types/
│   ├── auth.ts
│   ├── loan.ts
│   └── task.ts
└── utils/
    └── authStorage.ts
```

## Environment Variables

Create a `.env` file for local backend development and a `.env.docker` file for Docker.

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/baw_loan_automation
REDIS_URL=redis://localhost:6380/0

AUTO_APPROVAL_LIMIT=50000
MANAGER_ESCALATION_SECONDS=120

JWT_SECRET_KEY=replace_with_secure_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

SMTP_ENABLED=True
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_google_app_password
EMAIL_FROM=your_email@gmail.com

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
```

> Never commit real `.env` files, SMTP passwords, Twilio tokens, or JWT secrets.

## Running the Project with Docker

```bash
docker compose up --build
```

The services include:

- FastAPI API on port `8001`
- PostgreSQL on port `5433`
- Redis on port `6380`
- Celery worker for background jobs

Run migrations:

```bash
alembic upgrade head
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs using Vite.

## API Highlights

### Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password/send-code`
- `POST /auth/forgot-password/reset`

### Loan Applications

- `POST /loan-applications`
- `GET /loan-applications`
- `GET /loan-applications/{loan_id}`
- `POST /loan-applications/{loan_id}/resubmit-documents`
- `GET /loan-applications/{loan_id}/history`
- `GET /loan-applications/{loan_id}/emails`

### Manager

- `GET /manager/tasks`
- `POST /manager/tasks/{task_id}/decision`

### Finance

- `GET /finance/tasks`
- `POST /finance/tasks/{task_id}/confirm-disbursement`

## What Makes This Project Strong

This project is not a simple CRUD application. It demonstrates backend engineering concepts used in real business systems:

- Workflow orchestration
- Role-based task routing
- State transitions
- Audit history
- Asynchronous processing
- Notification systems
- External API integration
- Dockerized infrastructure
- Database migrations
- JWT security
- Production-style frontend dashboards

## Future Enhancements

- Admin dashboard for managing users and workflow rules.
- Refresh tokens and session management.
- Rate limiting for OTP requests.
- Account lockout after repeated failed login attempts.
- HTML email templates.
- Advanced workflow analytics dashboard.
- File upload support for customer documents.
- Cloud deployment using Railway, Render, AWS, or Azure.
- Unit and integration tests.
- CI/CD pipeline with GitHub Actions.
