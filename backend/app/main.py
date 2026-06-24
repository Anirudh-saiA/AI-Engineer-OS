from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.base_class import Base
from app.db.session import engine
import app.models.profile # Force map models to Base registry
import app.models.document
import app.models.agents
import app.models.workflow_state

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
                # Week 15: Confidence scoring & analytics
                ("confidence_root_cause", "INTEGER"),
                ("confidence_fix", "INTEGER"),
                ("confidence_explanation", "INTEGER"),
                ("resolution_time_seconds", "INTEGER"),
                ("was_fix_helpful", "BOOLEAN"),
                # Week 16: Community integrations (GitHub & Stack Overflow)
                ("github_references", "TEXT"),
                ("stackoverflow_references", "TEXT"),
            ]
            for col_name, col_type in mentor_columns:
                if col_name not in existing_error_cols:
                    with engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE error_analyses ADD COLUMN {col_name} {col_type}"))
                        print(f"Migration: Added '{col_name}' column to error_analyses.")
                        
    except Exception as global_err:
        print("Database startup migration bypassed safely to prevent server crash:", global_err)


@app.on_event("startup")
def initialize_search():
    """Initialize semantic search index on startup."""
    try:
        from app.core.semantic_search import initialize_search_index
        initialize_search_index()
        print("[Startup] Semantic search index initialized.")
    except Exception as e:
        print(f"[Startup] Semantic search init skipped: {e}")


@app.on_event("startup")
def seed_agents():
    """Seed specialized agents into the DB on startup."""
    from app.db.session import SessionLocal
    from app.models.agents import DBAgent
    from app.core.agents.coordination_prompts import (
        PLANNER_PROMPT,
        RESEARCH_PROMPT,
        CODER_PROMPT,
        REVIEWER_PROMPT,
        DOCUMENTATION_PROMPT
    )
    
    db = SessionLocal()
    try:
        default_agents = [
            {
                "id": "planner",
                "name": "Planner Agent",
                "role": "Project Manager",
                "system_prompt": PLANNER_PROMPT
            },
            {
                "id": "research",
                "name": "Research Agent",
                "role": "Technical Researcher",
                "system_prompt": RESEARCH_PROMPT
            },
            {
                "id": "coder",
                "name": "Coding Agent",
                "role": "Software Engineer",
                "system_prompt": CODER_PROMPT
            },
            {
                "id": "reviewer",
                "name": "Reviewer Agent",
                "role": "Quality Assurance Engineer",
                "system_prompt": REVIEWER_PROMPT
            },
            {
                "id": "documentation",
                "name": "Documentation Agent",
                "role": "Technical Writer",
                "system_prompt": DOCUMENTATION_PROMPT
            }
        ]
        
        for agent_info in default_agents:
            existing = db.query(DBAgent).filter(DBAgent.id == agent_info["id"]).first()
            if existing:
                existing.name = agent_info["name"]
                existing.role = agent_info["role"]
                existing.system_prompt = agent_info["system_prompt"]
            else:
                agent = DBAgent(**agent_info)
                db.add(agent)
        db.commit()
        print("[Startup] Specialized agent prompts seeded and updated successfully.")
    except Exception as e:
        db.rollback()
        print(f"[Startup] Seeding agents failed: {e}")
    finally:
        db.close()



@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}!",
        "docs_url": f"{settings.API_V1_STR}/docs"
    }

# Reloaded configuration trigger comment

