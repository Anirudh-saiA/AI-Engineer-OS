from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class OnboardingSubmit(BaseModel):
    full_name: str = Field(..., description="User's full name")
    college_name: Optional[str] = Field(None, description="Name of college/university")
    branch_degree: Optional[str] = Field(None, description="Degree or Branch of study")
    graduation_year: Optional[int] = Field(None, description="Expected graduation year")
    bio: Optional[str] = Field(None, description="Short bio about the user")
    github_link: Optional[str] = Field(None, description="GitHub profile URL")
    linkedin_link: Optional[str] = Field(None, description="LinkedIn profile URL")
    
    # Skill level slider values (0 to 100 range)
    python_level: int = Field(0, ge=0, le=100)
    javascript_level: int = Field(0, ge=0, le=100)
    dsa_level: int = Field(0, ge=0, le=100)
    ml_level: int = Field(0, ge=0, le=100)
    dl_level: int = Field(0, ge=0, le=100)
    genai_level: int = Field(0, ge=0, le=100)
    web_level: int = Field(0, ge=0, le=100)
    backend_level: int = Field(0, ge=0, le=100)
    devops_level: int = Field(0, ge=0, le=100)
    agents_level: int = Field(0, ge=0, le=100)
    rag_level: int = Field(0, ge=0, le=100)

    # Goal and Style parameters
    career_goals: List[str] = Field(..., description="Target career paths")
    learning_style: str = Field("project-based", description="Preferred learning methodology")
    time_availability_mins: int = Field(60, ge=30, le=480, description="Available daily minutes")

    # Practical experience telemetry (Git, APIs, Deployed projects, AI experience, etc.)
    experience_built_projects: bool = Field(False, description="Has built projects before")
    experience_used_git: bool = Field(False, description="Has used Git/GitHub before")
    experience_hackathons: bool = Field(False, description="Has participated in hackathons")
    experience_deployed: bool = Field(False, description="Has deployed applications")
    experience_apis: bool = Field(False, description="Has used APIs in development")
    experience_worked_ai: bool = Field(False, description="Has built or integrated AI systems")
    interest_areas: List[str] = Field([], description="Topics of specific engineering interest")

class RoadmapProgressNode(BaseModel):
    node_id: str
    title: str
    description: Optional[str] = None
    status: str # 'locked', 'active', 'completed'
    order_index: int
    completed_at: Optional[datetime] = None
    tasks: List[str] = []

    class Config:
        from_attributes = True

class RoadmapTaskToggleRequest(BaseModel):
    node_id: str
    task_text: str
    completed: bool


class AchievementBadge(BaseModel):
    title: str
    description: str
    badge_icon: str
    unlocked_at: datetime

    class Config:
        from_attributes = True

class ProjectDetails(BaseModel):
    title: str
    description: Optional[str] = None
    repository_link: Optional[str] = None
    status: str
    completed_at: Optional[datetime] = None
    category: str = "General"
    hours_spent: int = 0
    skills: Optional[str] = None

    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    onboarded: bool = False
    full_name: Optional[str] = None
    college_name: Optional[str] = None
    branch_degree: Optional[str] = None
    graduation_year: Optional[int] = None
    bio: Optional[str] = None
    github_link: Optional[str] = None
    linkedin_link: Optional[str] = None

    # Skill indicators
    skills: dict = {}
    
    # Career parameters
    career_goals: List[str] = []
    learning_style: str = "project-based"
    time_availability_mins: int = 60
    xp_points: int = 0
    streak_count: int = 1
    longest_streak: int = 1

    # Experience & Interests
    experience_built_projects: bool = False
    experience_used_git: bool = False
    experience_hackathons: bool = False
    experience_deployed: bool = False
    experience_apis: bool = False
    experience_worked_ai: bool = False
    interest_areas: List[str] = []

    # Playlists & Tracks
    achievements: List[AchievementBadge] = []
    roadmap: List[RoadmapProgressNode] = []
    projects: List[ProjectDetails] = []
    completed_tasks: List[str] = []
    weak_topics: List[str] = []
    active_days: List[str] = []

class UserSettingsSchema(BaseModel):
    theme: str = Field("dark", description="App interface theme preference")
    notifications_enabled: bool = Field(True, description="Enable email/alert notifications")
    privacy_private: bool = Field(False, description="Make portfolio private")
    language_preference: str = Field("en", description="Preferred language selection")

    class Config:
        from_attributes = True

class DailyTaskSchema(BaseModel):
    id: int
    task_text: str
    category: str
    completed: bool
    task_date: datetime

    class Config:
        from_attributes = True

class DailyTaskToggleRequest(BaseModel):
    task_id: int
    completed: bool


class InsightCard(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    metric: str
    color: str


class NotificationItem(BaseModel):
    id: str
    type: str # 'success', 'info', 'warning', 'error'
    message: str
    timestamp: str


class AIMotivationResponse(BaseModel):
    status: str # 'doing_well', 'inactive_returned', 'struggling', 'burnout_risk', 'neutral'
    mentor_message: str
    popup_title: Optional[str] = None
    popup_message: Optional[str] = None
    show_popup: bool = False
    insights: List[InsightCard] = []
    notifications: List[NotificationItem] = []


class ProjectAnalyticsResponse(BaseModel):
    projects_started: int
    projects_completed: int
    completion_rate: float
    favorite_category: str
    hours_spent: int
    success_rate: float
    skills_gained: List[str]


