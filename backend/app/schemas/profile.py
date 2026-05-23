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

class RoadmapProgressNode(BaseModel):
    node_id: str
    title: str
    description: Optional[str] = None
    status: str # 'locked', 'active', 'completed'
    order_index: int
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

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

    # Playlists & Tracks
    achievements: List[AchievementBadge] = []
    roadmap: List[RoadmapProgressNode] = []
    projects: List[ProjectDetails] = []
