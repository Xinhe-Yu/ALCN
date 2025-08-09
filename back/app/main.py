from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import users, entries, translations, comments, auth, translation_votes

app = FastAPI(
    title="Ancient Lexicon CN API",
    description=(
        "A comprehensive dictionary for Greco-Roman name/term translations.\n\n"
        "## Features\n"
        "* **Authentication**: Email-based 6-digit code verification\n"
        "* **Entries**: Create and manage dictionary entries with full-text search\n"
        "* **Trigram Search**: Fuzzy search using PostgreSQL trigrams\n"
        "* **Translations**: Multi-language translation support\n"
        "* **Comments**: Nested comments on entries\n"
        "* **User Management**: Role-based access control\n\n"
        "## Authentication\n"
        "1. POST `/api/v1/auth/login` with email to get verification code\n"
        "2. POST `/api/v1/auth/verify` with email and code to get access token\n"
        "3. Use Bearer token in Authorization header for authenticated endpoints\n\n"
        "In development mode, use code `123456` for any email."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "API Support",
        "email": "xinhe.yu.dsa@gmail.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "authentication",
            "description": "Email-based authentication with 6-digit codes"
        },
        {
            "name": "users",
            "description": "User management and profiles"
        },
        {
            "name": "entries",
            "description": "Dictionary entries with search capabilities"
        },
        {
            "name": "translations",
            "description": "Multi-language translations for entries"
        },
        {
            "name": "comments",
            "description": "User comments and discussions on entries"
        },
        {
            "name": "votes",
            "description": "Translation voting system (upvote/downvote)"
        }
    ]
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(entries.router, prefix="/api/v1/entries", tags=["entries"])
app.include_router(
    translations.router, prefix="/api/v1/translations", tags=["translations"]
)
app.include_router(
    comments.router, prefix="/api/v1/comments", tags=["comments"]
)
app.include_router(
    translation_votes.router, prefix="/api/v1", tags=["votes"]
)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Ancient Lexicon CN API",
        "version": "1.0.0",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "api_endpoints": {
            "auth": "/api/v1/auth",
            "users": "/api/v1/users",
            "entries": "/api/v1/entries",
            "translations": "/api/v1/translations",
            "comments": "/api/v1/comments"
        },
        "features": [
            "Email-based authentication",
            "Full-text search",
            "Trigram fuzzy search",
            "Multi-language support",
            "User comments"
        ],
        "dev_info": {
            "dev_login_code": "123456",
            "environment": settings.environment
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
