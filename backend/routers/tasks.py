from fastapi import APIRouter, HTTPException, Depends, Query, status
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from schemas import TaskCreate, TaskUpdate
from database import read_tasks, write_tasks
from auth import get_current_user
import uuid
from datetime import datetime, timezone
from typing import Optional

router = APIRouter(prefix="/tasks", tags=["Tasks"])
VALID_FILTERS   = {"all","completed","pending","overdue"}
VALID_PRIORITY  = {"low","medium","high"}


def _now_iso(): return datetime.now(timezone.utc).isoformat()


def find_task(tasks, task_id, username):
    task = next((t for t in tasks if t["id"] == task_id), None)
    if not task:
        raise HTTPException(404, f"Task '{task_id}' not found")
    if task["owner"] != username:
        raise HTTPException(403, "Access denied")
    return task


# ─── GET /tasks ───────────────────────────────────────────────────────────────
@router.get("")
def get_tasks(
    filter:   str = Query("all"),
    priority: Optional[str] = Query(None),
    search:   Optional[str] = Query(None, description="Search in title & description"),
    page:     int = Query(1, ge=1),
    limit:    int = Query(10, ge=1, le=100),
    sort_by:  str = Query("created_at", description="created_at | due_date | priority"),
    current_user: dict = Depends(get_current_user),
):
    if filter not in VALID_FILTERS:
        raise HTTPException(400, f"Invalid filter. Use: {', '.join(VALID_FILTERS)}")
    if priority and priority not in VALID_PRIORITY:
        raise HTTPException(400, f"Invalid priority. Use: low, medium, high")

    username  = current_user["username"]
    all_tasks = read_tasks()
    today     = datetime.now(timezone.utc).date().isoformat()

    # Owner filter
    tasks = [t for t in all_tasks if t["owner"] == username]

    # Status filter
    if filter == "completed":
        tasks = [t for t in tasks if t["completed"]]
    elif filter == "pending":
        tasks = [t for t in tasks if not t["completed"]]
    elif filter == "overdue":
        tasks = [t for t in tasks
                 if not t["completed"]
                 and t.get("due_date")
                 and t["due_date"] < today]

    # Priority filter
    if priority:
        tasks = [t for t in tasks if t.get("priority") == priority]

    # Search filter (title + description)
    if search:
        q = search.strip().lower()
        tasks = [t for t in tasks
                 if q in t["title"].lower()
                 or q in t.get("description","").lower()]

    # Sort
    priority_order = {"high": 0, "medium": 1, "low": 2}
    if sort_by == "priority":
        tasks.sort(key=lambda t: priority_order.get(t.get("priority","medium"), 1))
    elif sort_by == "due_date":
        tasks.sort(key=lambda t: (t.get("due_date") is None, t.get("due_date","")))
    else:
        tasks.sort(key=lambda t: t["created_at"], reverse=True)

    # Pagination
    total       = len(tasks)
    total_pages = max(1, (total + limit - 1) // limit)
    start       = (page - 1) * limit
    paginated   = tasks[start:start + limit]

    return {
        "tasks": paginated,
        "pagination": {
            "total": total, "page": page, "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
        "filter": filter,
    }


# ─── GET /tasks/calendar ─────────────────────────────────────────────────────
@router.get("/calendar")
def get_calendar_tasks(
    month: int = Query(..., ge=1, le=12),
    year:  int = Query(..., ge=2000),
    current_user: dict = Depends(get_current_user),
):
    """Return all tasks with due dates in the given month/year."""
    username  = current_user["username"]
    all_tasks = read_tasks()

    month_str = f"{year}-{month:02d}"
    tasks = [
        t for t in all_tasks
        if t["owner"] == username
        and t.get("due_date","").startswith(month_str)
    ]

    # Group by date
    calendar = {}
    for t in tasks:
        d = t["due_date"]
        calendar.setdefault(d, []).append(t)

    return {"month": month, "year": year, "calendar": calendar}


# ─── POST /tasks ──────────────────────────────────────────────────────────────
@router.post("", status_code=201)
def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    username  = current_user["username"]
    all_tasks = read_tasks()

    if any(t["owner"] == username and t["title"].lower() == task.title.strip().lower()
           for t in all_tasks):
        raise HTTPException(409, f"Task '{task.title.strip()}' already exists.")

    now = _now_iso()
    new_task = {
        "id":          str(uuid.uuid4()),
        "title":       task.title.strip(),
        "description": task.description.strip() if task.description else "",
        "completed":   False,
        "priority":    task.priority or "medium",
        "due_date":    task.due_date or None,
        "owner":       username,
        "created_at":  now,
        "updated_at":  now,
    }

    all_tasks.append(new_task)
    write_tasks(all_tasks)
    return {"message": "Task created", "task": new_task}


# ─── PUT /tasks/:id ───────────────────────────────────────────────────────────
@router.put("/{task_id}")
def update_task(task_id: str, update: TaskUpdate,
                current_user: dict = Depends(get_current_user)):
    username  = current_user["username"]

    if all(v is None for v in [update.title, update.description,
                                update.completed, update.due_date, update.priority]):
        raise HTTPException(400, "No fields provided to update.")

    all_tasks = read_tasks()
    task = find_task(all_tasks, task_id, username)

    if update.title is not None:
        new_title = update.title.strip()
        if any(t["owner"] == username and t["title"].lower() == new_title.lower()
               and t["id"] != task_id for t in all_tasks):
            raise HTTPException(409, f"Another task named '{new_title}' already exists.")
        task["title"] = new_title

    if update.description is not None: task["description"] = update.description.strip()
    if update.completed   is not None: task["completed"]   = update.completed
    if update.priority    is not None: task["priority"]    = update.priority
    if update.due_date    is not None: task["due_date"]    = update.due_date

    task["updated_at"] = _now_iso()
    write_tasks(all_tasks)
    return {"message": "Task updated", "task": task}


# ─── DELETE /tasks/:id ────────────────────────────────────────────────────────
@router.delete("/{task_id}")
def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    username  = current_user["username"]
    all_tasks = read_tasks()
    find_task(all_tasks, task_id, username)
    write_tasks([t for t in all_tasks if t["id"] != task_id])
    return {"message": "Task deleted", "task_id": task_id}