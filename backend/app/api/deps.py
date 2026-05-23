from typing import Generator
from app.db.session import SessionLocal

def get_db() -> Generator:
    """
    Dependency generator yielding a database session.
    Automatically closes the session after transaction context completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
