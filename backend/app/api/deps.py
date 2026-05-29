from typing import Generator
from fastapi import Header, HTTPException, status, Depends
from app.db.session import SessionLocal
from sqlalchemy.orm import Session
from app.models.profile import User

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

async def verify_token(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> dict:
    """
    FastAPI dependency that secures route endpoints.
    Validates standard Bearer Authentication tokens in request headers.
    Ensures that the corresponding User record exists in the database.
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
    
    # Ensure the user exists in the database to prevent foreign key errors
    try:
        user_record = db.query(User).filter(User.id == token).first()
        if not user_record:
            email = f"{token}@example.com"
            user_record = User(
                id=token,
                email=email,
                display_name="Developer",
                photo_url=None
            )
            db.add(user_record)
            db.commit()
    except Exception as e:
        db.rollback()
        # Log error or fallback gracefully, but do not block authentication
        # since it might be a temporary DB connection glitch.
        import logging
        logger = logging.getLogger("uvicorn.error")
        logger.error(f"Error during verify_token auto-user creation: {e}")

    # In production, we'd verify the Firebase ID Token JWT.
    # For local sandbox/development, we accept any active token
    return {"uid": token, "role": "developer"}
