from typing import Generator
from fastapi import Header, HTTPException, status
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

async def verify_token(authorization: str = Header(None)) -> dict:
    """
    FastAPI dependency that secures route endpoints.
    Validates standard Bearer Authentication tokens in request headers.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in first."
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme. Must be Bearer token."
        )
    
    # Extract the token payload (e.g. Firebase User UID or email string)
    token = authorization.split(" ")[1].strip()
    
    if not token or token == "placeholder_uid" or token == "undefined":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are expired or invalid."
        )
    
    # In production, we'd verify the Firebase ID Token JWT.
    # For local sandbox/development, we accept any active token
    return {"uid": token, "role": "developer"}
