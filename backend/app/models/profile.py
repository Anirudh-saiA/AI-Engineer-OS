import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class User(Base):
    """
    Standard user authentication details synced with Firebase credentials.
    """
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True) # Firebase UID
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class LearningProfile(Base):
    """
    Comprehensive basic profile details, skills mapping, and user variables.
    """
    __tablename__ = "learning_profiles"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    full_name = Column(String, nullable=False)
    college_name = Column(String, nullable=True)
    branch_degree = Column(String, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    bio = Column(Text, nullable=True)
    github_link = Column(String, nullable=True)
    linkedin_link = Column(String, nullable=True)
    
    # Skill level variables (1 to 100 range)
    python_level = Column(Integer, default=0)
    javascript_level = Column(Integer, default=0)
    dsa_level = Column(Integer, default=0)
    ml_level = Column(Integer, default=0)
    dl_level = Column(Integer, default=0)
    genai_level = Column(Integer, default=0)
    web_level = Column(Integer, default=0)
    backend_level = Column(Integer, default=0)
    devops_level = Column(Integer, default=0)
    agents_level = Column(Integer, default=0)
    rag_level = Column(Integer, default=0)

    xp_points = Column(Integer, default=0)
    time_availability_mins = Column(Integer, default=60) # minutes per day
    learning_style = Column(String, default="project-based")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class UserGoal(Base):
    """
    Target career goals (AI Engineer, GenAI, Placement prep, Hackathons, etc.)
    """
    __tablename__ = "user_goals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    goal_name = Column(String, nullable=False)

class LearningPreference(Base):
    """
    Preferred study styles (video, projects, reading, quizzes, hands-on coding)
    """
    __tablename__ = "learning_preferences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    preference_type = Column(String, nullable=False)

class Achievement(Base):
    """
    Milestone badges and career titles earned by completing roadmaps or courses.
    """
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    badge_icon = Column(String, nullable=False) # emoji or visual symbol code
    unlocked_at = Column(DateTime, default=datetime.datetime.utcnow)

class RoadmapProgress(Base):
    """
    Personalized roadmap nodes detailing topics, lessons, and completion statuses.
    """
    __tablename__ = "roadmap_progress"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    node_id = Column(String, index=True, nullable=False) # e.g. 'python-basics', 'rag-intro'
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="locked") # 'locked', 'active', 'completed'
    order_index = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)

class LearningSession(Base):
    """
    Chronological learning hours records tracking active focus intervals.
    """
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    duration_mins = Column(Integer, nullable=False)
    session_date = Column(DateTime, default=datetime.datetime.utcnow)

class Project(Base):
    """
    Assigned/completed learning projects showing visual progress.
    """
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    repository_link = Column(String, nullable=True)
    status = Column(String, default="in_progress") # 'in_progress', 'completed'
    completed_at = Column(DateTime, nullable=True)

class Streak(Base):
    """
    User coding streak consistency telemetry.
    """
    __tablename__ = "streaks"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    current_streak = Column(Integer, default=1)
    longest_streak = Column(Integer, default=1)
    last_login_date = Column(DateTime, default=datetime.datetime.utcnow)

class UserSetting(Base):
    """
    User customizable configuration preferences.
    """
    __tablename__ = "user_settings"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    theme = Column(String, default="dark")
    notifications_enabled = Column(Boolean, default=True)
    privacy_private = Column(Boolean, default=False)
    language_preference = Column(String, default="en")
