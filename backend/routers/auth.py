from fastapi import APIRouter, HTTPException, status
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from schemas import UserCreate, UserLogin, PasswordResetRequest, PasswordReset, EmailVerify
from database import read_users, write_users
from auth import hash_password, verify_password, create_access_token
import uuid, secrets
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory token stores (use Redis/DB in production)
reset_tokens  = {}   # token -> {username, expires}
verify_tokens = {}   # token -> {username, expires}


def _now(): return datetime.now(timezone.utc)


# ─── POST /auth/signup ────────────────────────────────────────────────────────
@router.post("/signup", status_code=201)
def signup(user: UserCreate):
    users = read_users()

    if any(u["username"] == user.username for u in users):
        raise HTTPException(400, "Username already taken.")

    if user.email:
        if any(u.get("email","") == user.email for u in users):
            raise HTTPException(400, "Email already registered.")

    # Email verification token
    v_token = secrets.token_urlsafe(32)
    verify_tokens[v_token] = {
        "username": user.username,
        "expires": (_now() + timedelta(hours=24)).isoformat()
    }

    new_user = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email or "",
        "password": hash_password(user.password),
        "email_verified": False,
        "created_at": _now().isoformat(),
    }

    users.append(new_user)
    write_users(users)

    token = create_access_token({"sub": new_user["username"]})

    # In production: send email with verify link
    # For dev: return token in response so you can verify manually
    return {
        "message": "Account created successfully",
        "access_token": token,
        "token_type": "bearer",
        "username": new_user["username"],
        "email_verified": False,
        "verify_token_dev": v_token,  # remove in production
    }


# ─── POST /auth/verify-email ──────────────────────────────────────────────────
@router.post("/verify-email")
def verify_email(body: EmailVerify):
    entry = verify_tokens.get(body.token)
    if not entry:
        raise HTTPException(400, "Invalid or expired verification link.")

    expires = datetime.fromisoformat(entry["expires"])
    if _now() > expires:
        del verify_tokens[body.token]
        raise HTTPException(400, "Verification link has expired.")

    users = read_users()
    for u in users:
        if u["username"] == entry["username"]:
            u["email_verified"] = True
            break

    write_users(users)
    del verify_tokens[body.token]
    return {"message": "Email verified successfully!"}


# ─── POST /auth/login ─────────────────────────────────────────────────────────
@router.post("/login")
def login(user: UserLogin):
    users = read_users()
    identifier = user.identifier.strip().lower()

    db_user = next(
        (u for u in users
         if u["username"].lower() == identifier
         or u.get("email","").lower() == identifier),
        None
    )

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(401, "Invalid credentials.",
                            headers={"WWW-Authenticate": "Bearer"})

    token = create_access_token({"sub": db_user["username"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": db_user["username"],
        "email_verified": db_user.get("email_verified", False),
        "message": "Login successful",
    }


# ─── POST /auth/forgot-password ───────────────────────────────────────────────
@router.post("/forgot-password")
def forgot_password(body: PasswordResetRequest):
    users = read_users()
    db_user = next((u for u in users if u.get("email","") == body.email), None)

    # Always return success (security: don't reveal if email exists)
    if not db_user:
        return {"message": "If that email exists, a reset link has been sent."}

    r_token = secrets.token_urlsafe(32)
    reset_tokens[r_token] = {
        "username": db_user["username"],
        "expires": (_now() + timedelta(hours=1)).isoformat()
    }

    # In production: send email with: /reset-password?token=<r_token>
    return {
        "message": "If that email exists, a reset link has been sent.",
        "reset_token_dev": r_token,  # remove in production
    }


# ─── POST /auth/reset-password ────────────────────────────────────────────────
@router.post("/reset-password")
def reset_password(body: PasswordReset):
    entry = reset_tokens.get(body.token)
    if not entry:
        raise HTTPException(400, "Invalid or expired reset token.")

    expires = datetime.fromisoformat(entry["expires"])
    if _now() > expires:
        del reset_tokens[body.token]
        raise HTTPException(400, "Reset token has expired. Request a new one.")

    users = read_users()
    for u in users:
        if u["username"] == entry["username"]:
            u["password"] = hash_password(body.new_password)
            break

    write_users(users)
    del reset_tokens[body.token]
    return {"message": "Password reset successfully. You can now log in."}