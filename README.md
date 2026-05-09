# Taskr — Full Stack Task Manager

A production-structured full stack task management application built with **FastAPI** (Python) and **React** (Vite). Features JWT authentication, full CRUD operations, priority levels, due dates, calendar view, search, filtering, pagination, and password reset.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, Vanilla CSS         |
| Backend   | Python 3.10+, FastAPI, Uvicorn      |
| Auth      | JWT (python-jose), bcrypt (passlib) |
| Storage   | JSON files (tasks.json, users.json) |
| Styling   | Custom CSS Design System (Dark UI)  |

---

## Project Structure

```
task-manager/
│
├── backend/
│   ├── main.py              # FastAPI app entry point, CORS, error handlers
│   ├── auth.py              # JWT creation, bcrypt hashing, auth dependency
│   ├── database.py          # JSON file read/write utilities
│   ├── schemas.py           # Pydantic validation models
│   ├── models.py            # Data shape documentation
│   ├── tasks.json           # Task data storage
│   ├── users.json           # User data storage
│   ├── requirements.txt     # Python dependencies
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Signup, login, forgot/reset password, email verify
│       └── tasks.py         # CRUD, search, filter, calendar, pagination
│
└── frontend/
    └── src/
        ├── App.jsx                      # Root component, auth routing
        ├── main.jsx                     # React entry point
        ├── index.css                    # Full design system
        ├── api/
        │   └── api.js                   # Fetch helper with token injection
        ├── context/
        │   └── AuthContext.jsx          # Global auth state (token, username)
        ├── pages/
        │   ├── Login.jsx                # Login with username or email
        │   ├── Signup.jsx               # Register + auto login
        │   ├── ForgotPassword.jsx       # Password reset flow
        │   └── Dashboard.jsx            # Main task manager UI
        └── components/
            ├── TaskCard.jsx             # Individual task with actions
            ├── TaskForm.jsx             # Create/edit task modal form
            ├── FilterBar.jsx            # Filter tab component
            └── CalendarView.jsx         # Monthly calendar with task dots
```

---

## Features

### Authentication
- Signup with username, email (optional), password
- Login with **username OR email**
- JWT token — expires in 60 minutes
- Auto login after signup — goes directly to dashboard
- Logout with confirmation dialog
- Forgot password → reset token → new password flow
- Email verification endpoint (token-based)

### Task Management
- Create, Read, Update, Delete tasks
- Mark tasks complete / incomplete (toggle)
- Duplicate title detection (per user, case-insensitive)
- Each task owned by authenticated user only

### Task Fields
| Field         | Description                        |
|---------------|------------------------------------|
| `id`          | UUID4 — auto generated             |
| `title`       | 3–200 characters, required         |
| `description` | Optional, max 1000 characters      |
| `completed`   | Boolean, default false             |
| `priority`    | low / medium / high, default medium|
| `due_date`    | Optional, YYYY-MM-DD format        |
| `owner`       | Username of creator                |
| `created_at`  | ISO 8601 UTC timestamp             |
| `updated_at`  | ISO 8601 UTC timestamp             |

### Filtering & Search
- Filter by: **All / Pending / Completed / Overdue**
- Search tasks by **title and description** keywords
- Filter by **priority** (low / medium / high)
- Sort by: **newest / due date / priority**

### Pagination
- 10 tasks per page
- Returns: `total`, `page`, `total_pages`, `has_next`, `has_prev`

### Calendar View
- Monthly calendar with navigation
- Colored dots per day showing tasks by priority
- Click any day to see tasks due that day
- Overdue indicator on past days

### Validation
- All inputs validated with Pydantic on backend
- Client-side validation before API calls
- Character counters on form fields
- Detailed error messages on failure

---

## REST API Reference

### Auth Endpoints

| Method | Endpoint                  | Auth | Description               |
|--------|---------------------------|------|---------------------------|
| POST   | `/auth/signup`            | ❌   | Register new user         |
| POST   | `/auth/login`             | ❌   | Login, returns JWT token  |
| POST   | `/auth/forgot-password`   | ❌   | Request password reset    |
| POST   | `/auth/reset-password`    | ❌   | Reset with token          |
| POST   | `/auth/verify-email`      | ❌   | Verify email address      |

### Task Endpoints

| Method | Endpoint              | Auth | Description                        |
|--------|-----------------------|------|------------------------------------|
| GET    | `/tasks`              | ✅   | Get tasks (filter, search, sort)   |
| POST   | `/tasks`              | ✅   | Create new task                    |
| PUT    | `/tasks/{id}`         | ✅   | Update task fields                 |
| DELETE | `/tasks/{id}`         | ✅   | Delete task                        |
| GET    | `/tasks/calendar`     | ✅   | Get tasks grouped by month/year    |

### Query Parameters — GET /tasks

| Parameter  | Type   | Default      | Description                        |
|------------|--------|--------------|------------------------------------|
| `filter`   | string | `all`        | all / pending / completed / overdue|
| `search`   | string | —            | Search in title and description    |
| `priority` | string | —            | low / medium / high                |
| `sort_by`  | string | `created_at` | created_at / due_date / priority   |
| `page`     | int    | `1`          | Page number                        |
| `limit`    | int    | `10`         | Items per page (max 100)           |

### HTTP Status Codes

| Code | Meaning                              |
|------|--------------------------------------|
| 200  | Success                              |
| 201  | Resource created                     |
| 400  | Bad request / validation error       |
| 401  | Unauthorized — invalid/missing token |
| 403  | Forbidden — not your resource        |
| 404  | Resource not found                   |
| 409  | Conflict — duplicate title           |
| 422  | Unprocessable — input validation fail|
| 500  | Internal server error                |

---

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm

---

### 1. Clone or Download the Project

```bash
cd task-manager
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install fastapi uvicorn python-jose[cryptography] passlib[bcrypt] python-multipart
pip freeze > requirements.txt
```

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

---

### 4. Run the Application

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

---

### 5. Open in Browser

| URL                          | Description              |
|------------------------------|--------------------------|
| http://localhost:5173        | React Frontend           |
| http://localhost:8000        | FastAPI Backend          |
| http://localhost:8000/docs   | Swagger Interactive Docs |
| http://localhost:8000/redoc  | ReDoc API Reference      |

---

## Environment Notes

### Password Reset (Development Mode)
Since there is no email server configured, the reset token is returned directly in the API response under `reset_token_dev`. In the frontend, a dev token box appears automatically so you can copy and use it without any email setup.

To add real email in production, integrate **SMTP** or **SendGrid** inside `routers/auth.py` where the comment says `# In production: send email`.

### Data Storage
Data is stored in plain JSON files:
- `backend/tasks.json` — all tasks
- `backend/users.json` — all users (passwords are bcrypt hashed)

To reset all data, replace the file contents with `[]`.

---

## UI Design

- **Theme:** Dark (deep navy/charcoal)
- **Fonts:** Syne (headings) + DM Sans (body) via Google Fonts
- **Accent:** Purple `#7c6aff` with glow effects
- **Priority Colors:** 🔴 High `#f87171` / 🟡 Medium `#fbbf24` / 🟢 Low `#4ade80`
- **Effects:** Glassmorphism auth card, animated orbs, skeleton loaders, smooth modals

---

## Known Limitations

- No real email sending (dev token shown in response instead)
- Data stored in JSON files — not suitable for large scale production
- No multi-user role system (every user manages only their own tasks)
- JWT tokens not blacklisted on logout (stateless)

---

## Author

Built as a Full Stack Task Manager project using FastAPI + React.
