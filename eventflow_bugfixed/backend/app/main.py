from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.database import engine, Base
from app.routers import auth, events, bookings, users, organizer, admin, contact
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables + uploads dir
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print(f"🚀 {settings.APP_NAME} API started | ENV: {settings.APP_ENV}")
    yield
    print("👋 Shutting down...")

# Create uploads dir at import time so StaticFiles mount below doesn't fail
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="EventFlow API",
    description="""
## EventFlow — Online Event Booking & Management System

### Features
- **JWT Authentication** (access + refresh tokens)
- **Role-based Access** (User / Organizer / Admin)
- **Events** — CRUD, search, filter, featured, trending, slug routing
- **Bookings** — Seat management, QR tickets, group booking, check-in
- **Coupons** — Percentage & flat discount with usage limits
- **Payments** — Razorpay integration ready
- **Refunds** — Request & admin approval workflow
- **Reviews** — Verified attendee reviews with helpful votes
- **Wishlist** — Save events for later
- **Notifications** — In-app notification center
- **Analytics** — Organizer & admin dashboards
- **Email** — Booking confirmations, cancellations, welcome

### Demo Accounts
| Role | Email | Password |
|---|---|---|
| 👑 Admin | admin@eventflow.in | admin123 |
| 🎪 Organizer | organizer@eventflow.in | org123 |
| 👤 User | user@eventflow.in | user123 |
    """,
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # In prod: [settings.FRONTEND_URL]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,      prefix="/api/auth",      tags=["🔐 Auth"])
app.include_router(events.router,    prefix="/api/events",    tags=["🎪 Events"])
app.include_router(bookings.router,  prefix="/api/bookings",  tags=["🎟 Bookings"])
app.include_router(users.router,     prefix="/api/users",     tags=["👤 Users"])
app.include_router(organizer.router, prefix="/api/organizer", tags=["🎭 Organizer"])
app.include_router(admin.router,     prefix="/api/admin",     tags=["👑 Admin"])
app.include_router(contact.router,   prefix="/api/contact",   tags=["📬 Contact"])

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/", tags=["🏠 Root"])
def root():
    return {"app": settings.APP_NAME, "version": "2.0.0", "docs": "/api/docs", "status": "running"}

@app.get("/api/health", tags=["🏠 Root"])
def health():
    return {"status": "healthy", "env": settings.APP_ENV}