# ALLA Ayurveda Backend

Backend REST API for ALLA Ayurveda project built with Python, Flask, Flask-JWT-Extended, Flask-SQLAlchemy, and MySQL.

---

## Architecture Overview

- **Framework**: Flask (Application Factory pattern)
- **Database ORM**: Flask-SQLAlchemy / PyMySQL (MySQL database `alla_ayurveda`)
- **Authentication**: Flask-JWT-Extended (Bearer JWT Tokens)
- **Role-Based Access Control (RBAC)**: Custom `@require_role` decorator
- **Cross-Origin Resource Sharing**: Flask-CORS configured for frontend development

---

## Project Structure

```
BACKEND/
├── app.py              # Flask app factory, JWT error callbacks, CORS, and startup
├── config.py           # Environment and Flask configuration
├── extensions.py       # SQLAlchemy and JWTManager instances
├── requirements.txt    # Python package dependencies
├── .env                # Local secrets and config (NEVER commit to Git)
├── .gitignore          # Git exclusion rules
├── seed_users.py       # Development user seeder script
│
├── models/
│   ├── __init__.py     # Models package re-exports
│   └── user.py         # User model and password hashing methods
│
├── routes/
│   ├── __init__.py     # Routes package
│   └── auth.py         # /login, /me, and /test/* endpoints
│
└── utils/
    ├── __init__.py     # Utilities package
    └── security.py     # Password hashing and @require_role authorization decorator
```

---

## Supported Roles

1. `researcher`
2. `iec_secretariat`
3. `iec_member`
4. `regulatory_admin`

---

## Setup & Installation

### 1. Virtual Environment Setup

From the `BACKEND` directory:

```bash
# Create virtual environment with Python 3.12
python3.12 -m venv venv

# Activate virtual environment
# On macOS / Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Environment Variables Configuration (`.env`)

Create a `.env` file inside the `BACKEND/` folder with the following configuration:

```env
DATABASE_URL=mysql+pymysql://<DB_USER>:<DB_PASSWORD>@localhost/<DB_NAME>
JWT_SECRET_KEY=<YOUR_STRONG_RANDOM_SECRET_KEY>
JWT_ACCESS_TOKEN_EXPIRES_HOURS=24
```

> **Note:** Never commit the `.env` file to version control.

### 4. MySQL Database Setup

Ensure MySQL server is running locally and create the database:

```sql
CREATE DATABASE IF NOT EXISTS alla_ayurveda CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

When you start the application or run seeding, SQLAlchemy automatically creates the required tables (`users`).

### 5. Seed Development Users (Optional)

To seed initial test users interactively:

```bash
python seed_users.py
```

---

## Running the Flask Server

To run the Flask development server on `http://127.0.0.1:5000`:

```bash
python app.py
```

Or using the Flask CLI:

```bash
export FLASK_APP=app.py
export FLASK_DEBUG=1
flask run --port=5000
```

---

## API Endpoints Reference

### Base URL: `http://127.0.0.1:5000`

| Method | Endpoint | Auth Required | Allowed Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | No | Any | Backend Health Check |
| `POST` | `/api/auth/login` | No | Any | Authenticate user & get JWT token |
| `GET` | `/api/auth/me` | Yes (JWT) | Any active user | Get current authenticated user profile |
| `GET` | `/api/auth/test/researcher` | Yes (JWT) | `researcher` | Role test endpoint for Researcher |
| `GET` | `/api/auth/test/iec-secretariat` | Yes (JWT) | `iec_secretariat` | Role test endpoint for IEC Secretariat |
| `GET` | `/api/auth/test/iec-member` | Yes (JWT) | `iec_member` | Role test endpoint for IEC Member |
| `GET` | `/api/auth/test/regulatory-admin` | Yes (JWT) | `regulatory_admin` | Role test endpoint for Regulatory Admin |

---

## API Details & Request/Response Examples

### 1. Health Check
- **Endpoint**: `GET /`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "ALLA Ayurveda Backend is running"
}
```

### 2. User Login
- **Endpoint**: `POST /api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "researcher@test.com",
  "password": "yourpassword",
  "role": "researcher"
}
```
- **Success Response**: `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": 1,
    "full_name": "Test Researcher",
    "email": "researcher@test.com",
    "role": "researcher"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: `{"success": false, "message": "Email, password, and role are required"}` or `{"success": false, "message": "Invalid role"}`
  - `401 Unauthorized`: `{"success": false, "message": "Invalid credentials"}` or `{"success": false, "message": "Invalid credentials or role"}`
  - `403 Forbidden`: `{"success": false, "message": "User account is inactive"}`

### 3. Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Success Response**: `200 OK`
```json
{
  "success": true,
  "user": {
    "id": 1,
    "full_name": "Test Researcher",
    "email": "researcher@test.com",
    "role": "researcher"
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: `{"success": false, "message": "Missing Authorization Header"}` or `{"success": false, "message": "Token has expired"}`
  - `403 Forbidden`: `{"success": false, "message": "User account is inactive"}`

### 4. Role Authorization Test Endpoints
- **Endpoints**:
  - `GET /api/auth/test/researcher`
  - `GET /api/auth/test/iec-secretariat`
  - `GET /api/auth/test/iec-member`
  - `GET /api/auth/test/regulatory-admin`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Success Response**: `200 OK` (when user has the required role)
```json
{
  "success": true,
  "message": "Researcher access granted",
  "user": {
    "id": 1,
    "email": "researcher@test.com",
    "role": "researcher"
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid, expired, or missing JWT token.
  - `403 Forbidden`: `{"success": false, "message": "Access forbidden: insufficient permissions"}` when user does not have the required role.

---

## Authentication & Authorization Flow

```
Client Request
      │
      ▼
Is JWT present & valid? ──(No)──► 401 Unauthorized (Missing / Invalid / Expired Token)
      │ (Yes)
      ▼
Fetch User from Database ──(Not Found)──► 404 User Not Found
      │
      ▼
Is User active? ──(No)──► 403 User account is inactive
      │ (Yes)
      ▼
Does User have required Role? ──(No)──► 403 Access forbidden: insufficient permissions
      │ (Yes)
      ▼
Execute Route Handler ──► 200 OK
```

---

## Thunder Client / Postman Testing Guide

1. **Login Request**:
   - Create a `POST` request to `http://127.0.0.1:5000/api/auth/login`.
   - Set Header: `Content-Type: application/json`.
   - Set Body (JSON):
     ```json
     {
       "email": "researcher@test.com",
       "password": "yourpassword",
       "role": "researcher"
     }
     ```
   - Send request and copy the `token` from the response.

2. **Authorized Request**:
   - Create a `GET` request to `http://127.0.0.1:5000/api/auth/me` or `http://127.0.0.1:5000/api/auth/test/researcher`.
   - In Thunder Client / Postman `Auth` tab, select **Bearer Token** and paste the copied token.
   - Send request.

3. **Role Permission Test (Negative Test)**:
   - With the `researcher` token, send a `GET` request to `http://127.0.0.1:5000/api/auth/test/regulatory-admin`.
   - Verify that the server returns `403 Forbidden` with:
     ```json
     {
       "success": false,
       "message": "Access forbidden: insufficient permissions"
     }
     ```
