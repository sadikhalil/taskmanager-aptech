# models.py
# These are reference models showing the shape of data stored in JSON files.
# Actual validation is handled by Pydantic schemas in schemas.py.

# ─── Task Model (stored in tasks.json) ───────────────────────────────────────
#
# {
#   "id":          str   — UUID4, auto-generated
#   "title":       str   — 3–200 chars, unique per user (case-insensitive)
#   "description": str   — optional, max 1000 chars
#   "completed":   bool  — defaults to False
#   "owner":       str   — username of the creator
#   "created_at":  str   — ISO 8601 UTC timestamp
#   "updated_at":  str   — ISO 8601 UTC timestamp (updated on every change)
# }

# ─── User Model (stored in users.json) ───────────────────────────────────────
#
# {
#   "id":         str  — UUID4, auto-generated
#   "username":   str  — 3–50 chars, alphanumeric + underscore, stored lowercase
#   "password":   str  — bcrypt hashed, never stored as plaintext
#   "created_at": str  — ISO 8601 UTC timestamp
# }