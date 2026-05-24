import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

# Determine engine type and build database connection
db_url = settings.DATABASE_URL
use_sqlite = False

if db_url.startswith("sqlite"):
    use_sqlite = True
else:
    # Try connecting to PostgreSQL. If it fails, fallback to SQLite for local development.
    try:
        temp_engine = create_engine(db_url, connect_args={"connect_timeout": 2})
        with temp_engine.connect() as conn:
            pass
        temp_engine.dispose()
    except Exception as e:
        logger.warning(
            f"PostgreSQL connection failed ({e}). Falling back to local SQLite database for local developer sandbox."
        )
        db_url = "sqlite:///aios_sandbox.db"
        use_sqlite = True

if use_sqlite:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,  # Check connection health before executing operations
        pool_size=10,
        max_overflow=20
    )

# Scoped session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
