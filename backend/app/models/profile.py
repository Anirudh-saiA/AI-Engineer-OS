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
    category = Column(String, default="General")
    hours_spent = Column(Integer, default=0)
    skills = Column(String, nullable=True) # Comma-separated list of skills

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


class ErrorAnalysis(Base):
    """
    Stored debugging analysis results for user error submissions.
    Powers the AI Debugging Assistant history, learning analytics,
    and the AI Mentor teaching pipeline.
    """
    __tablename__ = "error_analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    error_text = Column(Text, nullable=False)
    error_type = Column(String, nullable=True)
    categories = Column(String, nullable=True)        # Comma-separated category names
    file_name = Column(String, nullable=True)
    line_number = Column(Integer, nullable=True)
    severity = Column(String, default="medium")        # low, medium, high, critical
    explanation = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    suggested_fixes = Column(Text, nullable=True)      # JSON-encoded list of strings
    ai_enhanced = Column(Boolean, default=False)       # True if AI API was used for analysis
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Enhanced mentor fields (Feature 1-5)
    beginner_explanation = Column(Text, nullable=True)  # Plain-English explanation with analogy
    chain_of_events = Column(Text, nullable=True)       # JSON-encoded list of failure chain steps
    code_suggestions = Column(Text, nullable=True)      # JSON-encoded list of code improvement objects
    learning_concepts = Column(Text, nullable=True)     # JSON: concept, common mistakes, prevention, examples
    recommended_fix = Column(Text, nullable=True)       # The single top-priority fix
    search_text = Column(Text, nullable=True)           # Concatenated searchable text for full-text filtering

    # Week 15: Confidence scoring & analytics
    confidence_root_cause = Column(Integer, nullable=True)  # 0-99
    confidence_fix = Column(Integer, nullable=True)         # 0-99
    confidence_explanation = Column(Integer, nullable=True)  # 0-99
    resolution_time_seconds = Column(Integer, nullable=True) # time to resolve
    was_fix_helpful = Column(Boolean, nullable=True)         # user feedback


class LearningNote(Base):
    """
    Saved learning insights from debugging sessions.
    Enables the Learning Mode feature — users can revisit concepts,
    track common mistakes, and review prevention techniques.
    """
    __tablename__ = "learning_notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    error_analysis_id = Column(Integer, ForeignKey("error_analyses.id", ondelete="CASCADE"), index=True, nullable=True)
    concept_name = Column(String, nullable=False)             # e.g. "Dictionary key access", "List indexing"
    concept_explanation = Column(Text, nullable=True)         # Full concept explanation
    common_mistakes = Column(Text, nullable=True)             # JSON-encoded list of strings
    prevention_tips = Column(Text, nullable=True)             # JSON-encoded list of strings
    real_world_examples = Column(Text, nullable=True)         # JSON-encoded list of strings
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class RecurringErrorPattern(Base):
    """
    Tracks recurring error patterns per user.
    Used to detect weak areas and suggest targeted learning modules.
    """
    __tablename__ = "recurring_error_patterns"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    error_type = Column(String, nullable=False, index=True)
    occurrence_count = Column(Integer, default=1)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    weak_area_category = Column(String, nullable=True)
    suggested_module = Column(String, nullable=True)
    is_addressed = Column(Boolean, default=False)


class DebuggingAnalyticsSnapshot(Base):
    """
    Periodic analytics snapshots for the debugging dashboard.
    Stores aggregated metrics for trend analysis.
    """
    __tablename__ = "debugging_analytics_snapshots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    snapshot_date = Column(DateTime, default=datetime.datetime.utcnow)
    total_errors = Column(Integer, default=0)
    avg_resolution_time = Column(Integer, nullable=True)     # seconds
    most_common_category = Column(String, nullable=True)
    fix_success_rate = Column(Integer, nullable=True)        # percentage 0-100
    learning_score = Column(Integer, default=0)
