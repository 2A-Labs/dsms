# Driving School Management System

A starter monorepo for a driving school management system.

## Stack

- `frontend`: Next.js 15, TypeScript, and a small dashboard shell
- `backend`: FastAPI, SQLAlchemy, and PostgreSQL
- `db`: PostgreSQL 16

## Run the full stack

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The API is available at [http://localhost:8000/docs](http://localhost:8000/docs).

The backend seeds an admin account on first startup:

- Email: `admin@roadwise.local`
- Password: `Roadwise123!`

Students can create accounts from the login screen, request lessons from the
instructor availability returned by the API, and see their persisted booking
status after signing in again.

To stop the stack:

```bash
docker compose down
```

To remove the local database volume too:

```bash
docker compose down -v
```

## Local development without Docker

Start PostgreSQL separately, then run the backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
$env:DATABASE_URL = "postgresql+psycopg://driving_school:driving_school@localhost:5432/driving_school"
uvicorn app.main:app --reload
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Project layout

```text
backend/    FastAPI service and database models
frontend/   Next.js app
```

The backend currently creates a small `courses` table on startup and seeds two example courses. Replace this startup setup with Alembic migrations as the domain grows.
