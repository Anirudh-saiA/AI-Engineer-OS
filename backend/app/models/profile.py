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
    
    # Practical experience telemetry (Git, APIs, Deployed projects, AI experience, etc.)
    experience_built_projects = Column(Boolean, default=False)
    experience_used_git = Column(Boolean, default=False)
    experience_hackathons = Column(Boolean, default=False)
    experience_deployed = Column(Boolean, default=False)
    experience_apis = Column(Boolean, default=False)
    experience_worked_ai = Column(Boolean, default=False)
    interest_areas = Column(Text, nullable=True) # Comma-separated strings
    
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

class CompletedRoadmapTask(Base):
    """
    Tracks checkable weekly roadmap tasks completed by the user.
    """
    __tablename__ = "completed_roadmap_tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    node_id = Column(String, index=True, nullable=False) # e.g. 'week-1'
    task_text = Column(String, nullable=False) # e.g. 'Python revision'
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatSession(Base):
    """
    Active chat dialogue sessions for the AI mentor.
    """
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.timestamp")

class ChatMessage(Base):
    """
    Chronological history of messages within a chat session.
    """
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    sender = Column(String, nullable=False) # 'user' or 'assistant'
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

class UserWeakTopic(Base):
    """
    Topics the user struggles with, identified dynamically by AI audits or checklist gaps.
    """
    __tablename__ = "user_weak_topics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    topic_name = Column(String, nullable=False)
    difficulty_level = Column(String, default="beginner")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class DailyTask(Base):
    """
    Daily personalized tasks generated automatically by the AI Planner.
    """
    __tablename__ = "daily_tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    task_text = Column(String, nullable=False)
    category = Column(String, default="study") # 'study', 'dsa', 'coding', 'revision', 'project'
    completed = Column(Boolean, default=False)
    task_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


