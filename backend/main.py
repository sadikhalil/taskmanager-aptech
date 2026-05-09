from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from routers import tasks, auth

app = FastAPI(title="Task Manager API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://taskmanager-aptech.vercel.app/",
                   "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    errors = []
    for e in exc.errors():
        field = " -> ".join(str(l) for l in e["loc"] if l != "body")
        errors.append({"field": field or "input", "message": e["msg"].replace("Value error, ","")})
    return JSONResponse(status_code=422, content={"detail": "Validation failed", "errors": errors})

@app.exception_handler(StarletteHTTPException)
async def http_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Unexpected server error."})

app.include_router(auth.router)
app.include_router(tasks.router)

@app.get("/", tags=["Health"])
def root():
    return {"message": "Task Manager API v2.0", "docs": "/docs"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}