from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.base_class import Base
from app.db.session import engine
import app.models.profile # Force map models to Base registry
import app.models.document
# Ensure all models (including LearningNote) are registered with Base.metadata
# so create_all() can auto-generate their tables on startup

# Auto-generate PostgreSQL schemas on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

from sqlalchemy import text, inspect
@app.on_event("startup")
def migrate_db():
    try:
        # Check database columns using Inspector instead of executing SELECT queries
        inspector = inspect(engine)
        
        # 1. Projects table check/migration
        existing_project_cols = []
        try:
            existing_project_cols = [col["name"] for col in inspector.get_columns("projects")]
        except Exception as e:
            print("Could not inspect projects columns:", e)
            
        if existing_project_cols:
            # Check and add columns to projects
            with engine.begin() as conn:
                if "category" not in existing_project_cols:
                    conn.execute(text("ALTER TABLE projects ADD COLUMN category VARCHAR DEFAULT 'General'"))
                    print("Migration: Added 'category' column to projects.")
                if "hours_spent" not in existing_project_cols:
                    conn.execute(text("ALTER TABLE projects ADD COLUMN hours_spent INTEGER DEFAULT 0"))
                    print("Migration: Added 'hours_spent' column to projects.")
                if "skills" not in existing_project_cols:
                    conn.execute(text("ALTER TABLE projects ADD COLUMN skills VARCHAR"))
                    print("Migration: Added 'skills' column to projects.")

        # 2. Error analyses table check/migration
        existing_error_cols = []
        try:
            existing_error_cols = [col["name"] for col in inspector.get_columns("error_analyses")]
        except Exception as e:
            print("Could not inspect error_analyses columns:", e)

        if existing_error_cols:
            mentor_columns = [
                ("beginner_explanation", "TEXT"),
                ("chain_of_events", "TEXT"),
                ("code_suggestions", "TEXT"),
                ("learning_concepts", "TEXT"),
                ("recommended_fix", "TEXT"),
                ("search_text", "TEXT"),
            ]
            for col_name, col_type in mentor_columns:
                if col_name not in existing_error_cols:
                    with engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE error_analyses ADD COLUMN {col_name} {col_type}"))
                        print(f"Migration: Added '{col_name}' column to error_analyses.")
                        
    except Exception as global_err:
        print("Database startup migration bypassed safely to prevent server crash:", global_err)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}!",
        "docs_url": f"{settings.API_V1_STR}/docs"
    }
