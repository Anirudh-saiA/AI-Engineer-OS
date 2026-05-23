from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create engine with connection pooling enabled
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Check connection health before executing operations
    pool_size=10,
    max_overflow=20
)

# Scoped session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
