import datetime
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.api.deps import get_db, verify_token
from app.models import profile as models
from app.schemas import profile as schemas
from app.services import profile_service

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
    
    roadmap_schema = []
    for rn in roadmap_nodes:
        desc_text = rn.description
        tasks_list = []
        if rn.description and rn.description.strip().startswith("{"):
            try:
                parsed = json.loads(rn.description)
                desc_text = parsed.get("text", rn.description)
                tasks_list = parsed.get("tasks", [])
            except Exception:
                pass
        roadmap_schema.append(
            schemas.RoadmapProgressNode(
                node_id=rn.node_id,
                title=rn.title,
                description=desc_text,
                status=rn.status,
                order_index=rn.order_index,
                completed_at=rn.completed_at,
                tasks=tasks_list
            )
        )
    
    # 5. Fetch projects
    projects = db.query(models.Project).filter(models.Project.user_id == uid).all()
    project_schema = [
        schemas.ProjectDetails(
            title=p.title,
            description=p.description,
            repository_link=p.repository_link,
            status=p.status,
            completed_at=p.completed_at,
            category=p.category,
            hours_spent=p.hours_spent,
            skills=p.skills
        ) for p in projects
    ]
    
    # 5.5 Fetch completed checklist tasks
    completed_tasks_records = db.query(models.CompletedRoadmapTask).filter(
        models.CompletedRoadmapTask.user_id == uid
    ).all()
    completed_tasks_schema = [f"{ct.node_id}:{ct.task_text}" for ct in completed_tasks_records]
    
    # 5.6 Fetch weak topics
    weak_topics_records = db.query(models.UserWeakTopic).filter(
        models.UserWeakTopic.user_id == uid
    ).all()
    weak_topics_schema = [wt.topic_name for wt in weak_topics_records]
    
    # 6. Check and update streaks
    streak_record = profile_service.check_and_update_streak(db, uid)
    streak_val = streak_record.current_streak if streak_record else 1
    longest_val = streak_record.longest_streak if streak_record else 1
 
    # 6.5 Fetch study activity calendar dates
    active_days_set = set()
    
    # Completed roadmap check list tasks
    for rt in completed_tasks_records:
        active_days_set.add(rt.completed_at.date().isoformat())
        
    # Completed daily planner tasks
    daily_tasks = db.query(models.DailyTask).filter(
        models.DailyTask.user_id == uid,
        models.DailyTask.completed == True
    ).all()
    for dt in daily_tasks:
        active_days_set.add(dt.task_date.date().isoformat())
        
    # Logged learning focus sessions
    sessions = db.query(models.LearningSession).filter(
        models.LearningSession.user_id == uid
    ).all()
    for s in sessions:
        active_days_set.add(s.session_date.date().isoformat())
        
    active_days_list = sorted(list(active_days_set))
 
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
        completed_tasks=completed_tasks_schema,
        weak_topics=weak_topics_schema,
        active_days=active_days_list,
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

    # 5. Clean and generate Roadmap Progress via Prompt-Driven AI Engine
    db.query(models.RoadmapProgress).filter(models.RoadmapProgress.user_id == uid).delete()
    
    # Run the hybrid prompt compilation and AI simulation
    ai_roadmap_data = profile_service.generate_ai_roadmap(data)
    mentor_type = ai_roadmap_data.get("mentor_type", "Pragmatic Architect")
    nodes = ai_roadmap_data.get("nodes", [])

    profile.bio = f"{data.bio or ''}\n\n[AI Mentor Personality: {mentor_type}]"

    # Save generated roadmap nodes in strict database order
    for idx, node in enumerate(nodes):
        description_data = {
            "text": node["description"],
            "tasks": node.get("tasks", [])
        }
        db.add(models.RoadmapProgress(
            user_id=uid,
            node_id=node["node_id"],
            title=node["title"],
            description=json.dumps(description_data),
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
        
    try:
        # 2. Check if first project achievement is earned
        count = db.query(models.Project).filter(models.Project.user_id == uid).count()

        # 3. Add Project
        db_project = models.Project(
            user_id=uid,
            title=proj.title,
            description=proj.description,
            repository_link=proj.repository_link,
            status=proj.status,
            completed_at=datetime.datetime.utcnow() if proj.status == "completed" else None,
            category=proj.category or "General",
            hours_spent=proj.hours_spent or 0,
            skills=proj.skills
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
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database transaction error: {str(e)}"
        )

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
        
    try:
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
        db.refresh(node)
        return {"status": "success", "message": "Node completed, next node unlocked, and 50 XP awarded!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database transaction error: {str(e)}"
        )

@router.post("/roadmap/task/toggle")
def toggle_roadmap_task(
    payload: schemas.RoadmapTaskToggleRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Toggle a checkable task within a roadmap stage node, and dynamically recalculate XP + milestones!
    """
    uid = current_user["uid"]
    node_id = payload.node_id
    task_text = payload.task_text
    completed = payload.completed

    # 1. Fetch Learning Profile
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not onboarded yet.")

    # 2. Fetch the target RoadmapProgress node
    node = db.query(models.RoadmapProgress).filter(
        models.RoadmapProgress.user_id == uid,
        models.RoadmapProgress.node_id == node_id
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Roadmap node not found.")

    try:
        # Check if record already exists
        existing_task = db.query(models.CompletedRoadmapTask).filter(
            models.CompletedRoadmapTask.user_id == uid,
            models.CompletedRoadmapTask.node_id == node_id,
            models.CompletedRoadmapTask.task_text == task_text
        ).first()

        was_completed = node.status == "completed"

        if completed:
            if not existing_task:
                # Add task record
                new_task = models.CompletedRoadmapTask(
                    user_id=uid,
                    node_id=node_id,
                    task_text=task_text,
                    completed_at=datetime.datetime.utcnow()
                )
                db.add(new_task)
                profile.xp_points += 10  # +10 XP per task!
        else:
            if existing_task:
                # Delete task record
                db.delete(existing_task)
                profile.xp_points = max(0, profile.xp_points - 10)  # -10 XP

        db.flush()

        # 3. Recalculate Node Progress and Milestone unlocks
        # Extract total tasks from node description JSON
        total_tasks = []
        if node.description and node.description.strip().startswith("{"):
            try:
                parsed = json.loads(node.description)
                total_tasks = parsed.get("tasks", [])
            except Exception:
                pass

        # Query completed tasks for this node
        completed_tasks_count = db.query(models.CompletedRoadmapTask).filter(
            models.CompletedRoadmapTask.user_id == uid,
            models.CompletedRoadmapTask.node_id == node_id
        ).count()

        is_finished_now = len(total_tasks) > 0 and completed_tasks_count == len(total_tasks)

        if is_finished_now and not was_completed:
            # Mark node as completed & award milestone bonus
            node.status = "completed"
            node.completed_at = datetime.datetime.utcnow()
            profile.xp_points += 50  # +50 XP bonus!

            # Unlock the next node in order index
            next_node = db.query(models.RoadmapProgress).filter(
                models.RoadmapProgress.user_id == uid,
                models.RoadmapProgress.order_index > node.order_index
            ).order_by(models.RoadmapProgress.order_index).first()

            if next_node and next_node.status == "locked":
                next_node.status = "active"

        elif not is_finished_now and was_completed:
            # Uncomplete the node if it was previously completed
            node.status = "active"
            node.completed_at = None
            profile.xp_points = max(0, profile.xp_points - 50)  # Deduct milestone bonus

        db.commit()
        return {
            "status": "success",
            "task_completed": completed,
            "node_completed": is_finished_now,
            "xp_points": profile.xp_points
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database transaction error: {str(e)}"
        )

@router.get("/daily-planner", response_model=List[schemas.DailyTaskSchema])
def get_daily_planner_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Retrieve checkable daily tasks. tailors 4 daily micro-tasks using dynamic telemetry.
    """
    uid = current_user["uid"]
    
    # Calculate today date bounds in UTC
    today_date = datetime.datetime.utcnow().date()
    start_of_today = datetime.datetime.combine(today_date, datetime.time.min)
    end_of_today = datetime.datetime.combine(today_date, datetime.time.max)
    
    # Query today's tasks
    daily_tasks = db.query(models.DailyTask).filter(
        models.DailyTask.user_id == uid,
        models.DailyTask.task_date >= start_of_today,
        models.DailyTask.task_date <= end_of_today
    ).order_by(models.DailyTask.id).all()
    
    if daily_tasks:
        return daily_tasks
        
    return profile_service.get_daily_planner_tasks_service(db, uid)

@router.put("/daily-planner/{task_id}/toggle")
def toggle_daily_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Toggle checklist completed state. Awards +20 XP bonus on checked task!
    """
    uid = current_user["uid"]
    task = db.query(models.DailyTask).filter(
        models.DailyTask.id == task_id,
        models.DailyTask.user_id == uid
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Daily task not found.")
        
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not onboarded yet.")
        
    try:
        task.completed = not task.completed
        if task.completed:
            profile.xp_points += 20
        else:
            profile.xp_points = max(0, profile.xp_points - 20)
            
        db.commit()
        db.refresh(task)
        return {
            "status": "success",
            "task_id": task.id,
            "completed": task.completed,
            "xp_points": profile.xp_points
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database transaction error: {str(e)}"
        )

@router.get("/motivation", response_model=schemas.AIMotivationResponse)
def get_ai_motivation(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    AI Motivational System Endpoint: Analyzes streaks, roadmap checked tasks,
    recent focus session minutes, and weak topics to evaluate inactivity.
    """
    uid = current_user["uid"]
    return profile_service.get_ai_motivation_service(db, uid)

@router.get("/analytics", response_model=schemas.ProjectAnalyticsResponse)
def get_project_analytics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Calculate and compile project analytics telemetry metrics for the active developer.
    (Protected: Requires Bearer Auth).
    """
    uid = current_user["uid"]
    return profile_service.calculate_project_analytics_service(db, uid)
