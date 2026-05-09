from pydantic import BaseModel, field_validator
from typing import Optional
import re


# ─── Task Schemas ─────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    due_date: Optional[str] = None        # ISO date string "YYYY-MM-DD"
    priority: Optional[str] = "medium"   # low | medium | high

    @field_validator("title")
    @classmethod
    def title_valid(cls, v):
        v = v.strip()
        if not v: raise ValueError("Title cannot be empty")
        if len(v) < 3: raise ValueError("Title must be at least 3 characters")
        if len(v) > 200: raise ValueError("Title cannot exceed 200 characters")
        return v

    @field_validator("description")
    @classmethod
    def description_valid(cls, v):
        if v and len(v) > 1000: raise ValueError("Description cannot exceed 1000 characters")
        return v or ""

    @field_validator("priority")
    @classmethod
    def priority_valid(cls, v):
        if v and v not in ("low", "medium", "high"):
            raise ValueError("Priority must be low, medium, or high")
        return v or "medium"

    @field_validator("due_date")
    @classmethod
    def due_date_valid(cls, v):
        if v:
            if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
                raise ValueError("Due date must be in YYYY-MM-DD format")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_valid(cls, v):
        if v is not None:
            v = v.strip()
            if not v: raise ValueError("Title cannot be empty")
            if len(v) < 3: raise ValueError("Title must be at least 3 characters")
            if len(v) > 200: raise ValueError("Title cannot exceed 200 characters")
        return v

    @field_validator("priority")
    @classmethod
    def priority_valid(cls, v):
        if v and v not in ("low", "medium", "high"):
            raise ValueError("Priority must be low, medium, or high")
        return v

    @field_validator("due_date")
    @classmethod
    def due_date_valid(cls, v):
        if v:
            if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
                raise ValueError("Due date must be in YYYY-MM-DD format")
        return v


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: Optional[str] = ""
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v):
        v = v.strip()
        if not v: raise ValueError("Username cannot be empty")
        if len(v) < 3: raise ValueError("Username must be at least 3 characters")
        if len(v) > 50: raise ValueError("Username cannot exceed 50 characters")
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError("Username can only contain letters, numbers, underscores")
        return v.lower()

    @field_validator("email")
    @classmethod
    def email_valid(cls, v):
        if not v: return ""
        v = v.strip().lower()
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError("Invalid email address")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v):
        if len(v) < 6: raise ValueError("Password must be at least 6 characters")
        if len(v) > 128: raise ValueError("Password too long")
        return v


class UserLogin(BaseModel):
    identifier: str
    password: str


class PasswordResetRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def email_valid(cls, v):
        v = v.strip().lower()
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError("Invalid email address")
        return v


class PasswordReset(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_valid(cls, v):
        if len(v) < 6: raise ValueError("Password must be at least 6 characters")
        return v


class EmailVerify(BaseModel):
    token: str