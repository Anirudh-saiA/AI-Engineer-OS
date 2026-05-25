import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.api.deps import get_db, verify_token
from app.models import profile as models
from app.schemas import profile as schemas

router = APIRouter()

@router.get("/me", response_model=schemas.UserProfileResponse)
def get_user_profile(db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    """
    Get current logged in developer's workspace profile, milestones, and streaks.
    (Protected: Requires Bearer Auth).
    """
    uid = current_user["uid"]
    
    # 1. Fetch user profile
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    if not profile:
        return schemas.UserProfileResponse(onboarded=False)
        
    user_record = db.query(models.User).filter(models.User.id == uid).first()
    
    # 2. Fetch career goals
    goals = db.query(models.UserGoal).filter(models.UserGoal.user_id == uid).all()
    goal_names = [g.goal_name for g in goals]
    
    # 3. Fetch achievements
    achievements = db.query(models.Achievement).filter(models.Achievement.user_id == uid).all()
    achievement_badges = [
        schemas.AchievementBadge(
            title=a.title,
            description=a.description,
            badge_icon=a.badge_icon,
            unlocked_at=a.unlocked_at
        ) for a in achievements
    ]
    
    # 4. Fetch roadmap nodes
    roadmap_nodes = db.query(models.RoadmapProgress).filter(
        models.RoadmapProgress.user_id == uid
    ).order_by(models.RoadmapProgress.order_index).all()
    
    roadmap_schema = [
        schemas.RoadmapProgressNode(
            node_id=rn.node_id,
            title=rn.title,
            description=rn.description,
            status=rn.status,
            order_index=rn.order_index,
            completed_at=rn.completed_at
        ) for rn in roadmap_nodes
    ]
    
    # 5. Fetch projects
    projects = db.query(models.Project).filter(models.Project.user_id == uid).all()
    project_schema = [
        schemas.ProjectDetails(
            title=p.title,
            description=p.description,
            repository_link=p.repository_link,
            status=p.status,
            completed_at=p.completed_at
        ) for p in projects
    ]
    
    # 6. Fetch streaks
    streak_record = db.query(models.Streak).filter(models.Streak.user_id == uid).first()
    streak_val = 1
    longest_val = 1
    if streak_record:
        streak_val = streak_record.current_streak
        longest_val = streak_record.longest_streak

    # 7. Package complete response
    skills_map = {
        "Python": profile.python_level,
        "JavaScript": profile.javascript_level,
        "DSA": profile.dsa_level,
        "Machine Learning": profile.ml_level,
        "Deep Learning": profile.dl_level,
        "GenAI": profile.genai_level,
        "Web Development": profile.web_level,
        "Backend Development": profile.backend_level,
        "DevOps": profile.devops_level,
        "AI Agents": profile.agents_level,
        "RAG Systems": profile.rag_level
    }

    interests = [i.strip() for i in profile.interest_areas.split(",")] if profile.interest_areas else []

    return schemas.UserProfileResponse(
        onboarded=True,
        full_name=profile.full_name,
        college_name=profile.college_name,
        branch_degree=profile.branch_degree,
        graduation_year=profile.graduation_year,
        bio=profile.bio,
        github_link=profile.github_link,
        linkedin_link=profile.linkedin_link,
        skills=skills_map,
        career_goals=goal_names,
        learning_style=profile.learning_style,
        time_availability_mins=profile.time_availability_mins,
        xp_points=profile.xp_points,
        streak_count=streak_val,
        longest_streak=longest_val,
        achievements=achievement_badges,
        roadmap=roadmap_schema,
        projects=project_schema,
        experience_built_projects=profile.experience_built_projects,
        experience_used_git=profile.experience_used_git,
        experience_hackathons=profile.experience_hackathons,
        experience_deployed=profile.experience_deployed,
        experience_apis=profile.experience_apis,
        experience_worked_ai=profile.experience_worked_ai,
        interest_areas=interests
    )

@router.post("/onboard")
def onboard_user(data: schemas.OnboardingSubmit, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    """
    Onboard a developer by storing profile inputs and dynamically generating their roadmap.
    (Protected: Requires Bearer Auth).
    """
    uid = current_user["uid"]
    email = current_user.get("email", f"{uid}@example.com")
    
    # 1. Upsert base User details
    user_record = db.query(models.User).filter(models.User.id == uid).first()
    if not user_record:
        user_record = models.User(
            id=uid,
            email=email,
            display_name=data.full_name,
            photo_url=current_user.get("picture")
        )
        db.add(user_record)
        db.flush()
        
    # 2. Upsert Learning Profile
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    if not profile:
        profile = models.LearningProfile(user_id=uid, full_name=data.full_name)
        db.add(profile)
        
    profile.full_name = data.full_name
    profile.college_name = data.college_name
    profile.branch_degree = data.branch_degree
    profile.graduation_year = data.graduation_year
    profile.bio = data.bio
    profile.github_link = data.github_link
    profile.linkedin_link = data.linkedin_link
    
    # Save skills levels
    profile.python_level = data.python_level
    profile.javascript_level = data.javascript_level
    profile.dsa_level = data.dsa_level
    profile.ml_level = data.ml_level
    profile.dl_level = data.dl_level
    profile.genai_level = data.genai_level
    profile.web_level = data.web_level
    profile.backend_level = data.backend_level
    profile.devops_level = data.devops_level
    profile.agents_level = data.agents_level
    profile.rag_level = data.rag_level
    
    # Save experience booleans and interest telemetry
    profile.experience_built_projects = data.experience_built_projects
    profile.experience_used_git = data.experience_used_git
    profile.experience_hackathons = data.experience_hackathons
    profile.experience_deployed = data.experience_deployed
    profile.experience_apis = data.experience_apis
    profile.experience_worked_ai = data.experience_worked_ai
    profile.interest_areas = ",".join(data.interest_areas) if data.interest_areas else ""
    
    profile.time_availability_mins = data.time_availability_mins
    profile.learning_style = data.learning_style
    profile.xp_points = 100 # Award 100 XP starting bonus!
    
    # 3. Clean and save goals
    db.query(models.UserGoal).filter(models.UserGoal.user_id == uid).delete()
    for goal in data.career_goals:
        db.add(models.UserGoal(user_id=uid, goal_name=goal))
        
    # 4. Clean and save preferences
    db.query(models.LearningPreference).filter(models.LearningPreference.user_id == uid).delete()
    db.add(models.LearningPreference(user_id=uid, preference_type=data.learning_style))

    # 5. Clean and generate Roadmap Progress
    db.query(models.RoadmapProgress).filter(models.RoadmapProgress.user_id == uid).delete()
    
    # ================= INTELLIGENT RULE-BASED ROADMAP GENERATOR =================
    nodes = []
    
    # Choose a custom mentor personality descriptor to include inside their profile bio!
    mentor_type = "Pragmatic Architect"
    if "Placement Prep" in data.career_goals or "Placement Preparation" in data.career_goals or "Placement" in data.career_goals:
        mentor_type = "Algorithmic Sherpa"
    elif "Startup Founder" in data.career_goals:
        mentor_type = "SaaS Evangelist"
    elif "Hackathon Builder" in data.career_goals:
        mentor_type = "Rapid Prototype Guru"

    profile.bio = f"{data.bio or ''}\n\n[AI Mentor Personality: {mentor_type}]"
    
    # 1. Prerequisite: Git & Sandbox Setup (if experience_used_git is False)
    if not data.experience_used_git:
        nodes.append({
            "node_id": "git-sandboxing",
            "title": "Version Control & Workspace Sandboxing",
            "description": "Initialize local repositories, setup commit patterns, and isolate dev container sandboxes.",
            "status": "active"
        })

    # Check if placement prep is selected
    is_placement_prep = "Placement Preparation" in data.career_goals or "Placement Prep" in data.career_goals or "Placement" in data.career_goals
    is_genai = "GenAI Engineer" in data.career_goals or "AI Engineer" in data.career_goals or "GenAI" in data.career_goals
    
    first_status = "active" if not nodes else "locked"

    if is_placement_prep:
        nodes.append({
            "node_id": "dsa-foundations",
            "title": "Master DSA Foundations",
            "description": "Arrays, Linked Lists, Hashmaps, and basic Time Complexity analysis.",
            "status": first_status
        })
        nodes.append({
            "node_id": "postgres-relational",
            "title": "SQL & PostgreSQL Database Relational Schemas",
            "description": "SQL joins, index mapping, transactions, and pool engine orchestrations.",
            "status": "locked"
        })
        nodes.append({
            "node_id": "backend-rest",
            "title": "FastAPI REST API endpoints & CORS",
            "description": "Constructing secure endpoints, routing, and Pydantic validators.",
            "status": "locked"
        })
        nodes.append({
            "node_id": "mock-interview-prep",
            "title": "Technical Coding Interview Prep",
            "description": "Mock interview simulators, solving complex DSA trees and dynamic programming.",
            "status": "locked"
        })
    elif is_genai:
        nodes.append({
            "node_id": "rag-intro",
            "title": "Cognitive RAG Embeddings & Vector Stores",
            "description": "Text tokenization, ADA embedding, and collection search matching in Qdrant.",
            "status": first_status
        })
        nodes.append({
            "node_id": "llm-chains",
            "title": "LangChain & LlamaIndex Frameworks",
            "description": "Chaining prompts, structuring templates, and cognitive agents memory layers.",
            "status": "locked"
        })
        if "AI Agents" in data.interest_areas:
            nodes.append({
                "node_id": "ai-agents-graph",
                "title": "Multi-Agent Topologies inside LangGraph",
                "description": "Defining cyclical graphs, state memory, and sandbox container compilation.",
                "status": "locked"
            })
        else:
            nodes.append({
                "node_id": "llm-integrations",
                "title": "Large Language Models API Integrations",
                "description": "Connecting Gemini API endpoints, token calculations, and prompt engineering.",
                "status": "locked"
            })
        nodes.append({
            "node_id": "genai-production",
            "title": "Docker Orchestration of Agentic Services",
            "description": "Building product bundles, deploying vector containers, and API load balancing.",
            "status": "locked"
        })
    else:
        # General AI/ML Roadmap
        nodes.append({
            "node_id": "python-developer",
            "title": "Python AI Scripting Foundations",
            "description": "Advanced syntax, decorators, generators, and data analysis with NumPy/Pandas.",
            "status": first_status
        })
        nodes.append({
            "node_id": "ml-basics",
            "title": "Supervised & Unsupervised Machine Learning",
            "description": "Linear regression, Decision Trees, K-Means Clustering, and Scikit-Learn models.",
            "status": "locked"
        })
        if "MLOps" in data.interest_areas:
            nodes.append({
                "node_id": "mlops-pipeline",
                "title": "Production MLOps & Model Versioning",
                "description": "Orchestrating pipelines, MLflow metrics logging, and model register deployments.",
                "status": "locked"
            })
        else:
            nodes.append({
                "node_id": "deep-learning",
                "title": "Deep Learning Neural Networks",
                "description": "Backpropagation, PyTorch architecture, Convolutional and Recurrent neural nets.",
                "status": "locked"
            })

    if "AI SaaS" in data.interest_areas:
        nodes.append({
            "node_id": "ai-saas-monetization",
            "title": "AI SaaS Architecture & Stripe Integrations",
            "description": "Building subscriptions, user throttling gateways, and metered usage billing counters.",
            "status": "locked"
        })

    # Save generated roadmap nodes
    for idx, node in enumerate(nodes):
        db.add(models.RoadmapProgress(
            user_id=uid,
            node_id=node["node_id"],
            title=node["title"],
            description=node["description"],
            status=node["status"],
            order_index=idx
        ))
        
    # 6. Initialize user Streak
    streak_record = db.query(models.Streak).filter(models.Streak.user_id == uid).first()
    if not streak_record:
        streak_record = models.Streak(
            user_id=uid,
            current_streak=1,
            longest_streak=1,
            last_login_date=datetime.datetime.utcnow()
        )
        db.add(streak_record)
        
    # 7. Add Initiate Achievement
    db.query(models.Achievement).filter(models.Achievement.user_id == uid).delete()
    db.add(models.Achievement(
        user_id=uid,
        title="AI OS Initiate",
        description="Completed the onboarding flow and successfully registered developer goals!",
        badge_icon="🚀"
    ))
    
    db.commit()
    return {"status": "success", "message": "Onboarding completed successfully and personalized roadmap generated."}

@router.post("/project")
def add_user_project(proj: schemas.ProjectDetails, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    """
    Log a completed project inside the profile system and award XP points + achievements.
    (Protected: Requires Bearer Auth).
    """
    uid = current_user["uid"]
    
    # 1. Fetch Profile
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not onboarded yet.")
        
    # 2. Check if first project achievement is earned
    count = db.query(models.Project).filter(models.Project.user_id == uid).count()

    # 3. Add Project
    db_project = models.Project(
        user_id=uid,
        title=proj.title,
        description=proj.description,
        repository_link=proj.repository_link,
        status=proj.status,
        completed_at=datetime.datetime.utcnow() if proj.status == "completed" else None
    )
    db.add(db_project)
    
    # 4. Award XP Points
    profile.xp_points += 150 # 150 XP starting reward!
    
    if count == 0: # This is the first project
        db.add(models.Achievement(
            user_id=uid,
            title="First Project Complete",
            description="Committed and linked your first development project to the AI-Engineer-OS profile!",
            badge_icon="🏆"
        ))
        
    db.commit()
    return {"status": "success", "message": "Project added and 150 XP points awarded!"}

@router.get("/settings", response_model=schemas.UserSettingsSchema)
def get_user_settings(db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    """
    Get user customizable configuration preferences.
    (Protected: Requires Bearer Auth).
    """
    uid = current_user["uid"]
    
    # Ensure user record exists first to prevent Foreign Key constraint violation
    user_record = db.query(models.User).filter(models.User.id == uid).first()
    if not user_record:
        email = current_user.get("email", f"{uid}@example.com")
        user_record = models.User(
            id=uid,
            email=email,
            display_name=current_user.get("name"),
            photo_url=current_user.get("picture")
        )
        db.add(user_record)
        db.flush()

    settings_record = db.query(models.UserSetting).filter(models.UserSetting.user_id == uid).first()
    if not settings_record:
        # Create default settings if not exists
        settings_record = models.UserSetting(
            user_id=uid,
            theme="dark",
            notifications_enabled=True,
            privacy_private=False,
            language_preference="en"
        )
        db.add(settings_record)
        db.commit()
        db.refresh(settings_record)
        
    return settings_record

@router.put("/settings", response_model=schemas.UserSettingsSchema)
def update_user_settings(settings_data: schemas.UserSettingsSchema, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    """
    Update user customizable configuration preferences.
    (Protected: Requires Bearer Auth).
    """
    uid = current_user["uid"]
    
    # Ensure user record exists first to prevent Foreign Key constraint violation
    user_record = db.query(models.User).filter(models.User.id == uid).first()
    if not user_record:
        email = current_user.get("email", f"{uid}@example.com")
        user_record = models.User(
            id=uid,
            email=email,
            display_name=current_user.get("name"),
            photo_url=current_user.get("picture")
        )
        db.add(user_record)
        db.flush()

    settings_record = db.query(models.UserSetting).filter(models.UserSetting.user_id == uid).first()
    if not settings_record:
        settings_record = models.UserSetting(user_id=uid)
        db.add(settings_record)
        
    settings_record.theme = settings_data.theme
    settings_record.notifications_enabled = settings_data.notifications_enabled
    settings_record.privacy_private = settings_data.privacy_private
    settings_record.language_preference = settings_data.language_preference
    
    db.commit()
    db.refresh(settings_record)
    return settings_record

@router.put("/roadmap/{node_id}/complete")
def complete_roadmap_node(node_id: str, db: Session = Depends(get_db), current_user: dict = Depends(verify_token)):
    """
    Mark a specific learning roadmap node as completed, unlock the subsequent node, and award XP.
    """
    uid = current_user["uid"]
    
    # 1. Fetch the target node
    node = db.query(models.RoadmapProgress).filter(
        models.RoadmapProgress.user_id == uid,
        models.RoadmapProgress.node_id == node_id
    ).first()
    
    if not node:
        raise HTTPException(status_code=404, detail="Roadmap node not found.")
        
    if node.status == "completed":
        return {"status": "success", "message": "Node is already completed."}
        
    # 2. Mark as completed
    node.status = "completed"
    node.completed_at = datetime.datetime.utcnow()
    
    # Award XP points to user profile
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    if profile:
        profile.xp_points += 50  # Award 50 XP for node completion!
        
    # 3. Find the next node in order to mark it as 'active'
    next_node = db.query(models.RoadmapProgress).filter(
        models.RoadmapProgress.user_id == uid,
        models.RoadmapProgress.order_index > node.order_index
    ).order_by(models.RoadmapProgress.order_index).first()
    
    if next_node and next_node.status == "locked":
        next_node.status = "active"
        
    db.commit()
    return {"status": "success", "message": "Node completed, next node unlocked, and 50 XP awarded!"}

