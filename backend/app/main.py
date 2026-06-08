from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.base_class import Base
from app.db.session import engine
import app.models.profile # Force map models to Base registry
import app.models.document
import app.models.agents
# Ensure all models (including LearningNote, RecurringErrorPattern, agents models)
# are registered with Base.metadata so create_all() can auto-generate tables

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
    
    db = SessionLocal()
    try:
        default_agents = [
            {
                "id": "planner",
                "name": "Planner Agent",
                "role": "Project Manager",
                "system_prompt": "You are a specialized Planner Agent. Your job is to understand user goals, break down complex requirements into a structured, step-by-step execution checklist, and allocate responsibilities. Output a structured execution plan."
            },
            {
                "id": "research",
                "name": "Research Agent",
                "role": "Technical Researcher",
                "system_prompt": "You are a specialized Research Agent. Your job is to scan knowledge bases, search vector databases (Qdrant), retrieve relevant documentation, and summarize findings. Output key insights, best practices, references, and technical recommendations."
            },
            {
                "id": "coder",
                "name": "Coding Agent",
                "role": "Software Engineer",
                "system_prompt": "You are a specialized Coding Agent. Your job is to design database schemas, write FastAPI server routes, or write Next.js React components based on the plan and research notes. Output clean, correct, structured code."
            },
            {
                "id": "reviewer",
                "name": "Reviewer Agent",
                "role": "Quality Assurance Engineer",
                "system_prompt": "You are a specialized Reviewer Agent. Your job is to audit generated code for logic bugs, styling violations, or security risks, and provide clear recommended changes. Output an inspection report."
            },
            {
                "id": "documentation",
                "name": "Documentation Agent",
                "role": "Technical Writer",
                "system_prompt": "You are a specialized Documentation Agent. Your job is to compile professional README guides, usage instructions, or setup details. Output clear project documentation."
            }
        ]
        
        for agent_info in default_agents:
            existing = db.query(DBAgent).filter(DBAgent.id == agent_info["id"]).first()
            if not existing:
                agent = DBAgent(**agent_info)
                db.add(agent)
        db.commit()
        print("[Startup] Specialized agent prompts seeded successfully.")
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

