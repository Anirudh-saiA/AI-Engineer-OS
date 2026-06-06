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

from sqlalchemy import text
@app.on_event("startup")
def migrate_db():
    try:
        with engine.connect() as conn:
            # Check if category column exists in projects
            try:
                conn.execute(text("SELECT category FROM projects LIMIT 1"))
            except Exception:
                # If query fails, it means columns do not exist. Add them.
                try:
                    # Rollback aborted transaction to allow subsequent DDL commands in PostgreSQL
                    try:
                        conn.execute(text("ROLLBACK"))
                    except Exception:
                        pass
                    
                    # Run ALTER TABLE commands
                    conn.execute(text("ALTER TABLE projects ADD COLUMN category VARCHAR DEFAULT 'General'"))
                    conn.execute(text("ALTER TABLE projects ADD COLUMN hours_spent INTEGER DEFAULT 0"))
                    conn.execute(text("ALTER TABLE projects ADD COLUMN skills VARCHAR"))
                    
                    # If using postgreSQL/SQLite we might need to commit
                    try:
                        conn.commit()
                    except Exception:
                        pass
                    print("Database migrated successfully: Added custom analytics columns to projects table.")
                except Exception as e:
                    print("Migration warning (possibly already applied or running parallel):", e)

            # Migrate error_analyses table: add enhanced AI mentor columns
            mentor_columns = [
                ("beginner_explanation", "TEXT"),
                ("chain_of_events", "TEXT"),
                ("code_suggestions", "TEXT"),
                ("learning_concepts", "TEXT"),
                ("recommended_fix", "TEXT"),
                ("search_text", "TEXT"),
            ]
            for col_name, col_type in mentor_columns:
                try:
                    conn.execute(text(f"SELECT {col_name} FROM error_analyses LIMIT 1"))
                except Exception:
                    try:
                        try:
                            conn.execute(text("ROLLBACK"))
                        except Exception:
                            pass
                        conn.execute(text(f"ALTER TABLE error_analyses ADD COLUMN {col_name} {col_type}"))
                        try:
                            conn.commit()
                        except Exception:
                            pass
                        print(f"Migration: Added '{col_name}' column to error_analyses.")
                    except Exception as col_err:
                        print(f"Migration warning for error_analyses.{col_name}: {col_err}")

    except Exception as global_err:
        print("Database startup migration bypassed safely to prevent server crash:", global_err)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}!",
        "docs_url": f"{settings.API_V1_STR}/docs"
    }
