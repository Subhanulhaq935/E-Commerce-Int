# Multi-Vendor E-Commerce Backend

FastAPI, PostgreSQL, aur SQLAlchemy par mabni Multi-Vendor E-Commerce Marketplace ka backend.

## Tech Stack
- FastAPI
- PostgreSQL & SQLAlchemy
- Alembic (Migrations)
- JWT (python-jose & passlib)
- Pytest

## Setup
1. Virtual environment activate karein:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
2. Run server:
   ```powershell
   uvicorn app.main:app --reload
   ```
3. API Docs:
   - Swagger UI: `http://127.0.0.1:8000/docs`
   - ReDoc: `http://127.0.0.1:8000/redoc`

