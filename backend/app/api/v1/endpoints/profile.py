import datetime
import os
import json
import urllib.request
import urllib.error
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

# ================= AI PROMPT ENGINE & COGNITIVE LLM COMPILER =================

SYSTEM_PROMPT = """
You are the AI-Engineer-OS Cognitive Roadmap Architect. Your job is to analyze a developer's onboarding profile and generate a highly personalized, structured learning roadmap.
The output MUST be a JSON object containing exactly a list of 4 roadmap nodes.
JSON Schema:
{
  "mentor_type": "string (e.g. 'Algorithmic Sherpa', 'SaaS Evangelist', 'Rapid Prototype Guru', 'Pragmatic Architect')",
  "nodes": [
    {
      "node_id": "string (kebab-case identifier, e.g. 'git-sandboxing')",
      "title": "string (clear milestone title)",
      "description": "string (concise learning goals & focus tasks)",
      "status": "string ('active' for first node, 'locked' for subsequent nodes)"
    }
  ]
}
"""

USER_PROMPT = """
Analyze the following developer profile and output a tailored 4-stage engineering roadmap:

Developer Profile:
- Full Name: {full_name}
- Academic Level: {branch_degree} at {college_name} (Class of {graduation_year})
- Current Skills Proficiency (0-100):
  * Python: {python_level}%
  * JavaScript/Web: {web_level}%
  * DSA: {dsa_level}%
  * ML/DL: {ml_level}%
- Career Goals: {career_goals}
- Selected Engineering Interests: {interest_areas}
- Learning Style: {learning_style}
- Commitment Speed: {time_availability_mins} mins/day
- Telemetry Verification:
  * Built Projects before: {experience_built_projects}
  * Used Git before: {experience_used_git}
  * Participated in hackathons: {experience_hackathons}
  * Deployed apps to production: {experience_deployed}
  * Integrated APIs before: {experience_apis}
  * Built AI solutions: {experience_worked_ai}

Rule Constraints:
1. If 'used Git before' is False, the first stage MUST be a 'Version Control & Sandboxing' module to establish prerequisites.
2. If career goal focuses on 'Placement Preparation' or 'DSA', build an algorithmic path (DSA Foundations, SQL, APIs, Mock Simulator).
3. If career goal focuses on 'AI Engineer' or 'GenAI', focus on RAG, Vector Stores, LLM APIs, and Docker/Deployment.
4. If career goal focuses on 'SaaS/Startup', inject Stripe, API scaling, and product deployment.
5. All other profiles should get a generic but highly tailored Python AI/ML pipelines roadmap.
"""

def simulate_ai_roadmap(data: schemas.OnboardingSubmit) -> dict:
    """
    Cerebral AI Simulation Engine: Simulates LLM prompt execution dynamically.
    Parses prompt parameters and returns highly customized lesson nodes.
    """
    nodes = []
    
    # Evaluate custom mentor personality descriptor based on goals
    mentor_type = "Pragmatic Architect"
    goals_lower = [g.lower() for g in data.career_goals]
    if any(any(x in g for x in ["placement", "dsa", "prep"]) for g in goals_lower):
        mentor_type = "Algorithmic Sherpa"
    elif any("startup" in g or "founder" in g or "saas" in g for g in goals_lower):
        mentor_type = "SaaS Evangelist"
    elif any("hackathon" in g or "builder" in g or "rapid" in g for g in goals_lower):
        mentor_type = "Rapid Prototype Guru"

    # Stage 1: Prerequisite Module
    if not data.experience_used_git:
        nodes.append({
            "node_id": "git-sandboxing",
            "title": "Version Control & Sandbox Setup",
            "description": f"Initialize local Git repositories for {data.full_name}, manage sandbox dev containers on a {data.time_availability_mins}m/day schedule, and learn commit conventions.",
            "status": "active"
        })

    # Determine track paths based on primary goals and interests
    is_placement = any(any(x in g for x in ["placement", "prep", "dsa"]) for g in goals_lower)
    is_genai = any(any(x in g for x in ["genai", "ai engineer", "llm", "agent"]) for g in goals_lower)
    
    first_status = "active" if not nodes else "locked"

    if is_placement:
        nodes.append({
            "node_id": "dsa-foundations",
            "title": "Algorithmic Foundations & DSA",
            "description": f"Focus on advanced {data.learning_style}-based DSA structures: Arrays, Hashmaps, complex trees, and Big-O efficiency calibrated for {data.branch_degree or 'engineering'}.",
            "status": first_status
        })
        nodes.append({
            "node_id": "postgres-relational",
            "title": "PostgreSQL & Database Transactions",
            "description": "SQL joins, indexing mapping, connection pool configurations, and transaction rollbacks for secure backend stacks.",
            "status": "locked"
        })
        if "AI Agents" in data.interest_areas or "GenAI" in data.interest_areas:
            nodes.append({
                "node_id": "ai-dsa-combo",
                "title": "AI Integration & Technical Interviews",
                "description": "Master mock coding simulators, standard backend REST API routing, and AI prompt engineering for system design.",
                "status": "locked"
            })
        else:
            nodes.append({
                "node_id": "backend-rest",
                "title": "REST API Architecture & Web Servers",
                "description": "Building validated FastAPI routes, schema verification with Pydantic, and backend sandbox deployment.",
                "status": "locked"
            })
    elif is_genai:
        nodes.append({
            "node_id": "rag-intro",
            "title": "Cognitive RAG & Vector Collections",
            "description": f"Tokenize documents, construct text embeddings, and configure similarity search algorithms inside Qdrant collection scopes.",
            "status": first_status
        })
        nodes.append({
            "node_id": "llm-chains",
            "title": "Prompt Chaining & Cognitive Memory",
            "description": "Integrate Google Gemini endpoints, parse context maps, and define LangChain state memory paths.",
            "status": "locked"
        })
        if "AI Agents" in data.interest_areas:
            nodes.append({
                "node_id": "ai-agents-graph",
                "title": "Multi-Agent Cyclical Graph Networks",
                "description": "Define agentic workflows using cyclical graph nodes, state transitions, and isolated dev containers.",
                "status": "locked"
            })
        else:
            nodes.append({
                "node_id": "llm-integrations",
                "title": "Advanced LLM APIs & Context Optimization",
                "description": "Optimizing prompts, counting context tokens, and caching search embeddings to decrease latency.",
                "status": "locked"
            })
    else:
        # General AI/ML Roadmap
        nodes.append({
            "node_id": "python-developer",
            "title": "Python AI Scripting Foundations",
            "description": f"Decorators, generators, and multidimensional data structures with NumPy/Pandas tailored for a {data.learning_style} approach.",
            "status": first_status
        })
        nodes.append({
            "node_id": "ml-basics",
            "title": "Supervised & Unsupervised Learning Models",
            "description": "Scikit-Learn estimators, linear/logistic regression, Decision Trees, and K-Means cluster partitioning.",
            "status": "locked"
        })
        if "MLOps" in data.interest_areas:
            nodes.append({
                "node_id": "mlops-pipeline",
                "title": "MLOps pipelines & Versioning Control",
                "description": "Log runtime model metrics in MLflow registries, version files, and automate Docker deployments.",
                "status": "locked"
            })
        else:
            nodes.append({
                "node_id": "deep-learning",
                "title": "Deep Neural Network Arch with PyTorch",
                "description": "Backpropagation algorithms, layer optimizations, and convolutional visual feature extractions.",
                "status": "locked"
            })

    # Stage 4: Capstone Module
    if "AI SaaS" in data.interest_areas or "Startup Founder" in data.career_goals:
        nodes.append({
            "node_id": "capstone-billing",
            "title": "AI SaaS Metered Billing & Stripe Scaling",
            "description": f"Construct Stripe payment webhooks, metered service throttle gates, and deploy a production SaaS dashboard.",
            "status": "locked"
        })
    elif "MLOps" in data.interest_areas or data.experience_deployed:
        nodes.append({
            "node_id": "capstone-deploy",
            "title": "Docker Orchestration & Gateway Load Balance",
            "description": "Write complex multi-stage Dockerfiles, configure reverse proxies, and bundle React/FastAPI monorepo deployment.",
            "status": "locked"
        })
    else:
        nodes.append({
            "node_id": "capstone-portfolio",
            "title": "End-to-End Sandbox Portfolio System",
            "description": f"Build a comprehensive portfolio showcasing your dynamic skills at {data.college_name or 'AIOS'}, complete with telemetry commits.",
            "status": "locked"
        })

    # Enforce exactly 4 nodes
    nodes = nodes[:4]
    while len(nodes) < 4:
        nodes.append({
            "node_id": f"lesson-supplement-{len(nodes)+1}",
            "title": "Supplemental Sandbox Specialization",
            "description": "Additional lesson tracks computed for specialized software engineering workflows.",
            "status": "locked"
        })
        
    return {
        "mentor_type": mentor_type,
        "nodes": nodes
    }

def generate_ai_roadmap(data: schemas.OnboardingSubmit) -> dict:
    """
    Hybrid AI Prompt Engine: Generates personalized roadmaps using live Gemini API
    if GEMINI_API_KEY is configured, otherwise falls back to the Cerebral AI Simulation Engine.
    """
    goals_str = ", ".join(data.career_goals)
    interests_str = ", ".join(data.interest_areas)
    
    user_prompt = USER_PROMPT.format(
        full_name=data.full_name,
        college_name=data.college_name or "Self-Taught",
        branch_degree=data.branch_degree or "CS & Engineering",
        graduation_year=data.graduation_year or "N/A",
        python_level=data.python_level,
        web_level=data.web_level,
        dsa_level=data.dsa_level,
        ml_level=data.ml_level,
        career_goals=goals_str,
        interest_areas=interests_str,
        learning_style=data.learning_style,
        time_availability_mins=data.time_availability_mins,
        experience_built_projects=data.experience_built_projects,
        experience_used_git=data.experience_used_git,
        experience_hackathons=data.experience_hackathons,
        experience_deployed=data.experience_deployed,
        experience_apis=data.experience_apis,
        experience_worked_ai=data.experience_worked_ai
    )

    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": SYSTEM_PROMPT},
                            {"text": user_prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048,
                    "responseMimeType": "application/json"
                }
            }
            
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                text_out = res_data["candidates"][0]["content"]["parts"][0]["text"]
                parsed_json = json.loads(text_out)
                if "mentor_type" in parsed_json and "nodes" in parsed_json:
                    return parsed_json
        except Exception:
            pass

    return simulate_ai_roadmap(data)

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
    ai_roadmap_data = generate_ai_roadmap(data)
    mentor_type = ai_roadmap_data.get("mentor_type", "Pragmatic Architect")
    nodes = ai_roadmap_data.get("nodes", [])

    profile.bio = f"{data.bio or ''}\n\n[AI Mentor Personality: {mentor_type}]"

    # Save generated roadmap nodes in strict database order
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

