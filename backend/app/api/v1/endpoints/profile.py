import datetime
import os
import json
import urllib.request
import urllib.error
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.api.deps import get_db, verify_token
from app.models import profile as models
from app.schemas import profile as schemas

router = APIRouter()

def check_and_update_streak(db: Session, uid: str) -> models.Streak:
    """
    Consistency Telemetry Tracker: Calculates and increments or resets daily learning streaks.
    """
    streak = db.query(models.Streak).filter(models.Streak.user_id == uid).first()
    now = datetime.datetime.utcnow()
    today_date = now.date()
    
    if not streak:
        streak = models.Streak(
            user_id=uid,
            current_streak=1,
            longest_streak=1,
            last_login_date=now
        )
        db.add(streak)
        db.commit()
        db.refresh(streak)
        return streak
        
    last_login = streak.last_login_date
    last_date = last_login.date()
    yesterday = today_date - datetime.timedelta(days=1)
    
    if last_date == yesterday:
        streak.current_streak += 1
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak
        streak.last_login_date = now
        db.commit()
        db.refresh(streak)
    elif last_date == today_date:
        pass
    else:
        streak.current_streak = 1
        streak.last_login_date = now
        db.commit()
        db.refresh(streak)
        
    return streak

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
            completed_at=p.completed_at
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
    streak_record = check_and_update_streak(db, uid)
    streak_val = streak_record.current_streak if streak_record else 1
    longest_val = streak_record.longest_streak if streak_record else 1

    # 6.5 Fetch study activity calendar dates
    active_days_set = set()
    
    # Completed roadmap check list tasks
    roadmap_tasks = db.query(models.CompletedRoadmapTask).filter(
        models.CompletedRoadmapTask.user_id == uid
    ).all()
    for rt in roadmap_tasks:
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

# ================= AI PROMPT ENGINE & COGNITIVE LLM COMPILER =================

SYSTEM_PROMPT = """
ROLE & CORE MANDATE:
You are the elite AI-Engineer-OS Cognitive Roadmap Architect. Your job is to analyze a developer's educational baseline, current skill proficiencies, career aspirations, and physical time constraints to design a highly personalized, structured 4-stage technical learning roadmap.

TEACHING & ROADMAP DESIGN PRINCIPLES:
1. Pragmatic Milestone Progression: Construct stages that progress logically from basic prerequisites (like sandboxing or version control if they are beginners) to advanced engineering layers.
2. Skill Differential Calibration: Analyze the gap between their current skills and target career goals. If there is a massive gap (e.g. goal is AI Engineer but Python is 10%), Stage 1 must focus heavily on fundamental building blocks.
3. Realistic Daily Time Budgeting: Keep the checklist tasks extremely realistic to complete within their specified daily minutes budget (e.g., 60 mins/day).
4. Concrete, Actionable Deliverables: Every task checklist item must represent a real-world, hands-on, testable software deliverable (e.g., "Write a transaction rollback test suite", "Initialize a cosine similarity search on a Qdrant collection"). Avoid vague theoretical descriptions.

OUTPUT FORMAT INSTRUCTIONS:
- You MUST output exactly a JSON object matching the schema below. No conversational prose, no markdown labels.
- The roadmap must consist of EXACTLY 4 sequential nodes (weeks/milestones).
- Every node must have EXACTLY 3 highly actionable, descriptive checklist items in the "tasks" array.

JSON Schema:
{
  "mentor_type": "string (calibrated personality: 'Algorithmic Sherpa' if goals focus on DSA/placement, 'SaaS Evangelist' for startup/mvp goals, 'Rapid Prototype Guru' for experimental/hackathon goals, 'Pragmatic Architect' for systems/backend infrastructure goals)",
  "nodes": [
    {
      "node_id": "string (kebab-case stage identifier, e.g. 'stage-1-version-control')",
      "title": "string (highly descriptive, professional milestone title)",
      "description": "string (concise explanation of learning deliverables and practical outcomes)",
      "status": "string ('active' for the first node, 'locked' for all subsequent nodes)",
      "tasks": [
        "string (concrete micro-deliverable task 1, max 60 chars)",
        "string (concrete micro-deliverable task 2, max 60 chars)",
        "string (concrete micro-deliverable task 3, max 60 chars)"
      ]
    }
  ]
}
"""

USER_PROMPT = """
Analyze the detailed developer profile telemetry below and output a premium, tailored 4-stage engineering roadmap following the system constraints:

Developer Telemetry Profile:
- Full Name: {full_name}
- Educational Identity: {branch_degree} studying at {college_name} (Expected Graduation: Class of {graduation_year})
- Current Skill Index (0-100%):
  * Python Foundations: {python_level}%
  * JavaScript / Frontend Web: {web_level}%
  * Data Structures & Algorithms: {dsa_level}%
  * Machine Learning Basics: {ml_level}%
- Career Destination Goals: {career_goals}
- Selected Focus Engineering Interests: {interest_areas}
- Learning Methodology Style: {learning_style}
- Daily Available Focus Time: {time_availability_mins} minutes per day
- Verified Skill Telemetry:
  * Has built software projects: {experience_built_projects}
  * Has used Git/GitHub version control: {experience_used_git}
  * Participated in hackathons: {experience_hackathons}
  * Deployed apps to production: {experience_deployed}
  * Integrated external APIs: {experience_apis}
  * Constructed/worked with AI systems: {experience_worked_ai}

Rule Constraints:
1. Git Prerequisite Trigger: If 'Has used Git/GitHub before' is False, Stage 1 MUST focus on 'Version Control & Sandboxing' to establish development environments.
2. Algorithmic Track Trigger: If career goals focus heavily on 'Placement Preparation', 'DSA', or 'Algorithms', engineer a highly rigorous path covering Big-O space/time optimization, SQL indexing, connection pools, and coding mock interview patterns.
3. Cognitive AI/RAG Track Trigger: If career goals focus on 'AI Engineer' or 'GenAI', focus heavily on recursive text splitting tokenizers, cosine similarity nearest-neighbor search inside Qdrant collections, prompt cache setups, and multi-agent state graph architectures.
4. Product Monetization Track Trigger: If career goals focus on 'SaaS/Startup' or 'founder', inject stripe dynamic checkout sessions, secure billing webhooks, metered rate-limiting gateways, and reverse-proxy deployment scripts.
5. General Developer: All other profiles receive a robust, pipeline-first Python AI/ML and software engineering roadmap.
"""

def simulate_ai_roadmap(data: schemas.OnboardingSubmit) -> dict:
    """
    Cerebral AI Simulation Engine: Simulates LLM prompt execution dynamically.
    Parses prompt parameters and returns highly customized lesson nodes with specific tasks checklist.
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
            "status": "active",
            "tasks": [
                "Install Git and set username/email",
                "Create a new repository on GitHub",
                "Initialize first monorepo commit to main branch"
            ]
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
            "status": first_status,
            "tasks": [
                "Implement an efficient Big-O complexity analyzer",
                "Solve two-sum array problems in python",
                "Build binary tree searching structures"
            ]
        })
        nodes.append({
            "node_id": "postgres-relational",
            "title": "PostgreSQL & Database Transactions",
            "description": "SQL joins, indexing mapping, connection pool configurations, and transaction rollbacks for secure backend stacks.",
            "status": "locked",
            "tasks": [
                "Run PostgreSQL local container sandbox on port 5434",
                "Design database relational schema index mapping",
                "Establish active client pool connections"
            ]
        })
        if "AI Agents" in data.interest_areas or "GenAI" in data.interest_areas:
            nodes.append({
                "node_id": "ai-dsa-combo",
                "title": "AI Integration & Technical Interviews",
                "description": "Master mock coding simulators, standard backend REST API routing, and AI prompt engineering for system design.",
                "status": "locked",
                "tasks": [
                    "Configure technical mock coding interviews",
                    "Write API validation checks in FastAPI",
                    "Benchmark query latency limits"
                ]
            })
        else:
            nodes.append({
                "node_id": "backend-rest",
                "title": "REST API Architecture & Web Servers",
                "description": "Building validated FastAPI routes, schema verification with Pydantic, and backend sandbox deployment.",
                "status": "locked",
                "tasks": [
                    "Write validated FastAPI routing endpoint functions",
                    "Define Pydantic schema validation layers",
                    "Deploy local REST web server sandbox"
                ]
            })
    elif is_genai:
        nodes.append({
            "node_id": "rag-intro",
            "title": "Cognitive RAG & Vector Collections",
            "description": f"Tokenize documents, construct text embeddings, and configure similarity search algorithms inside Qdrant collection scopes.",
            "status": first_status,
            "tasks": [
                "Write recursive sliding text tokenizers",
                "Initialize custom similarity vectors in Qdrant collection",
                "Execute cosine nearest-neighbor search tests"
            ]
        })
        nodes.append({
            "node_id": "llm-chains",
            "title": "Prompt Chaining & Cognitive Memory",
            "description": "Integrate Google Gemini endpoints, parse context maps, and define LangChain state memory paths.",
            "status": "locked",
            "tasks": [
                "Connect Gemini Flash endpoint utilizing system prompts",
                "Build multi-step context prompt maps",
                "Integrate LangChain state routing memory"
            ]
        })
        if "AI Agents" in data.interest_areas:
            nodes.append({
                "node_id": "ai-agents-graph",
                "title": "Multi-Agent Cyclical Graph Networks",
                "description": "Define agentic workflows using cyclical graph nodes, state transitions, and isolated dev containers.",
                "status": "locked",
                "tasks": [
                    "Build LangGraph multi-agent cyclical state nodes",
                    "Configure sandbox terminal tools execution scripts",
                    "Implement custom error handling for model tool pings"
                ]
            })
        else:
            nodes.append({
                "node_id": "llm-integrations",
                "title": "Advanced LLM APIs & Context Optimization",
                "description": "Optimizing prompts, counting context tokens, and caching search embeddings to decrease latency.",
                "status": "locked",
                "tasks": [
                    "Design multi-modal prompt input parameters",
                    "Establish prompt token caching architectures",
                    "Verify model output guardrails alignment"
                ]
            })
    else:
        # General AI/ML Roadmap
        nodes.append({
            "node_id": "python-developer",
            "title": "Python AI Scripting Foundations",
            "description": f"Decorators, generators, and multidimensional data structures with NumPy/Pandas tailored for a {data.learning_style} approach.",
            "status": first_status,
            "tasks": [
                "Write Python generator and decorator scripts",
                "Build custom monorepo log parser parser functions",
                "Add structured exception handling routes"
            ]
        })
        nodes.append({
            "node_id": "ml-basics",
            "title": "Supervised & Unsupervised Learning Models",
            "description": "Scikit-Learn estimators, linear/logistic regression, Decision Trees, and K-Means cluster partitioning.",
            "status": "locked",
            "tasks": [
                "Train Scikit-Learn decision trees on sandbox dataset",
                "Implement train-test cross-validation splits",
                "Plot model precision-recall performance curves"
            ]
        })
        if "MLOps" in data.interest_areas:
            nodes.append({
                "node_id": "mlops-pipeline",
                "title": "MLOps pipelines & Versioning Control",
                "description": "Log runtime model metrics in MLflow registries, version files, and automate Docker deployments.",
                "status": "locked",
                "tasks": [
                    "Configure MLflow server tracking dashboards",
                    "Bundle python app scripts in multi-stage Dockerfiles",
                    "Automate monorepo checks in GitHub Actions workflows"
                ]
            })
        else:
            nodes.append({
                "node_id": "deep-learning",
                "title": "Deep Neural Network Arch with PyTorch",
                "description": "Backpropagation algorithms, layer optimizations, and convolutional visual feature extractions.",
                "status": "locked",
                "tasks": [
                    "Implement linear regression feedforward loops in PyTorch",
                    "Write custom neural network backpropagation steps",
                    "Audit visual feature convolutions epochs"
                ]
            })

    # Stage 4: Capstone Module
    if "AI SaaS" in data.interest_areas or "Startup Founder" in data.career_goals:
        nodes.append({
            "node_id": "capstone-billing",
            "title": "AI SaaS Metered Billing & Stripe Scaling",
            "description": f"Construct Stripe payment webhooks, metered service throttle gates, and deploy a production SaaS dashboard.",
            "status": "locked",
            "tasks": [
                "Implement Stripe billing webhooks connection",
                "Build product throttle limit gates for endpoint services",
                "Deploy client subscription monitoring dashboard"
            ]
        })
    elif "MLOps" in data.interest_areas or data.experience_deployed:
        nodes.append({
            "node_id": "capstone-deploy",
            "title": "Docker Orchestration & Gateway Load Balance",
            "description": "Write complex multi-stage Dockerfiles, configure reverse proxies, and bundle React/FastAPI monorepo deployment.",
            "status": "locked",
            "tasks": [
                "Write multi-stage React/FastAPI monorepo Dockerfiles",
                "Setup Nginx gateway reverse proxies configurations",
                "Deploy container cluster services under port 8000"
            ]
        })
    else:
        nodes.append({
            "node_id": "capstone-portfolio",
            "title": "End-to-End Sandbox Portfolio System",
            "description": f"Build a comprehensive portfolio showcasing your dynamic skills at {data.college_name or 'AIOS'}, complete with telemetry commits.",
            "status": "locked",
            "tasks": [
                "Assemble interactive dynamic timeline dashboard panels",
                "Connect database telemetry to render contribution calendars",
                "Publish sandboxed web portfolio systems"
            ]
        })

    # Enforce exactly 4 nodes
    nodes = nodes[:4]
    while len(nodes) < 4:
        nodes.append({
            "node_id": f"lesson-supplement-{len(nodes)+1}",
            "title": "Supplemental Sandbox Specialization",
            "description": "Additional lesson tracks computed for specialized software engineering workflows.",
            "status": "locked",
            "tasks": [
                "Verify active local DB connection pools health",
                "Calibrate model max token thresholds",
                "Export diagnostic logs reports"
            ]
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

    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT
                    },
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],
                "temperature": 0.2
            }
            
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_key}"
                }
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                text_out = res_data["choices"][0]["message"]["content"]
                
                # Strip markdown json tags if the LLM output wrapped it
                text_out = text_out.strip()
                if text_out.startswith("```json"):
                    text_out = text_out[7:]
                if text_out.endswith("```"):
                    text_out = text_out[:-3]
                text_out = text_out.strip()
                
                parsed_json = json.loads(text_out)
                if "mentor_type" in parsed_json and "nodes" in parsed_json:
                    return parsed_json
        except Exception:
            pass

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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction error: {str(e)}"
        )

# ═══════════════════════════════════════════════════════════
# DAILY PLANNER (AI COACH) ENDPOINTS
# ═══════════════════════════════════════════════════════════

def get_fallback_daily_tasks(goals_str: str, weak_topics_str: str, active_title: str, remaining_tasks: list) -> list:
    """
    Cognitive Fallback Simulator: Generates 4 highly realistic daily scheduler tasks
    when live LLM generation APIs encounter latency or lack keys.
    """
    tasks = []
    
    # 1. Study Task
    study_topic = active_title if active_title else "AI-Engineer-OS Foundations"
    tasks.append({
        "task_text": f"Study active roadmap: {study_topic[:25]}",
        "category": "study"
    })
    
    # 2. DSA Task
    dsa_text = "Solve 2 intermediate String/Array DSA puzzles"
    if "dsa" in goals_str.lower() or "placement" in goals_str.lower() or "prep" in goals_str.lower():
        dsa_text = "Solve 2 dynamic programming or tree DSA questions"
    tasks.append({
        "task_text": dsa_text,
        "category": "dsa"
    })
    
    # 3. Coding Task
    coding_text = "Write clean API endpoint validation routers"
    if "rag" in goals_str.lower() or "ai" in goals_str.lower():
        coding_text = "Build semantic cosine similarity scoring logic"
    elif "saas" in goals_str.lower():
        coding_text = "Implement Stripe checkouts payment hooks"
    tasks.append({
        "task_text": coding_text,
        "category": "coding"
    })
    
    # 4. Revision Task
    rev_topic = "Python OOP concepts"
    if remaining_tasks:
        rev_topic = remaining_tasks[0]
    elif weak_topics_str != "None recorded yet":
        rev_topic = [i.strip() for i in weak_topics_str.split(",")][0]
    tasks.append({
        "task_text": f"Revise weak concept: {rev_topic[:25]}",
        "category": "revision"
    })
    
    return tasks

@router.get("/daily-planner", response_model=List[schemas.DailyTaskSchema])
def get_daily_planner_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Retrieve checkable daily tasks. Generates 4 highly tailored tasks using AI (Gemini/OpenAI)
    if no checklist exists for today. Awards +20 XP per task checklist check.
    """
    uid = current_user["uid"]
    
    # Verify profile exists
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not onboarded yet.")
        
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
        
    # Compile Telemetry variables
    goals = db.query(models.UserGoal).filter(models.UserGoal.user_id == uid).all()
    goals_str = ", ".join([g.goal_name for g in goals]) if goals else "General Software Development"
    
    weak_topics = db.query(models.UserWeakTopic).filter(models.UserWeakTopic.user_id == uid).all()
    weak_topics_str = ", ".join([w.topic_name for w in weak_topics]) if weak_topics else "None recorded yet"
    
    roadmap = db.query(models.RoadmapProgress).filter(
        models.RoadmapProgress.user_id == uid
    ).order_by(models.RoadmapProgress.order_index).all()
    
    active_node = next((node for node in roadmap if node.status == "active"), None)
    active_title = active_node.title if active_node else "Python Core Scripting"
    
    # Parse subtasks remaining
    remaining_tasks = []
    if active_node and active_node.description and active_node.description.strip().startswith("{"):
        try:
            parsed = json.loads(active_node.description)
            total_tasks = parsed.get("tasks", [])
            completed_tasks_records = db.query(models.CompletedRoadmapTask).filter(
                models.CompletedRoadmapTask.user_id == uid,
                models.CompletedRoadmapTask.node_id == active_node.node_id
            ).all()
            completed_set = set(t.task_text for t in completed_tasks_records)
            remaining_tasks = [t for t in total_tasks if t not in completed_set]
        except Exception:
            pass

    # AI Prompt Construction
    system_prompt = (
        "You are the elite AIOS Cognitive Daily Planner. Your goal is to analyze a developer's profile, "
        "their active roadmap milestone, their available daily study time, and their current review topics "
        "to construct a highly customized list of exactly 4 highly realistic, actionable daily micro-tasks.\n\n"
        "TEACHING & PLANNING RULES:\n"
        "1. Time-Budget Compatibility: Ensure that all 4 micro-tasks can be comfortably accomplished within their daily limit of {focus_mins} minutes.\n"
        "2. Multi-Dimensional Skill Balance: Dynamically generate exactly one task from each of these four critical categories:\n"
        "   - 'study': Revise or learn a technical concept matching their active roadmap week: {active_week}\n"
        "   - 'dsa': Solve a structured competitive coding or algorithmic challenge matching their career aspirations: {goals}\n"
        "   - 'coding': Write clean code, configure database connection pools, setup docker files, or query vector indices\n"
        "   - 'revision': Review and simplify one of their active review topics: {weak_topics}\n"
        "3. Actionable & Under-60 Chars: Keep each micro-task highly concrete, descriptive, realistic to achieve, and under 60 characters.\n\n"
        "OUTPUT SCHEMA REQUIREMENTS:\n"
        "Output MUST be a JSON object containing exactly a list of 4 micro-task items as defined below. No conversational prose, no wrappers.\n"
        "{{\n"
        "  \"tasks\": [\n"
        "    {{\n"
        "      \"task_text\": \"string (clear actionable micro-task under 60 characters)\",\n"
        "      \"category\": \"string ('study' | 'dsa' | 'coding' | 'revision')\"\n"
        "    }}\n"
        "  ]\n"
        "}}\n"
    ).format(
        focus_mins=profile.time_availability_mins,
        active_week=active_title,
        goals=goals_str,
        weak_topics=weak_topics_str
    )

    openai_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    ai_json_str = ""

    # Attempt OpenAI Generation
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate today's 4 custom tasks for developer {profile.full_name}."}
                ],
                "temperature": 0.2
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                ai_json_str = res_data["choices"][0]["message"]["content"]
        except Exception:
            pass

    # Attempt Google Gemini Generation
    if not ai_json_str and gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": system_prompt},
                            {"text": f"Generate today's 4 custom tasks for developer {profile.full_name}."}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
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
                ai_json_str = res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            pass

    task_list = []
    # Parse LLM response
    if ai_json_str:
        try:
            cleaned_str = ai_json_str.strip()
            if cleaned_str.startswith("```json"):
                cleaned_str = cleaned_str[7:]
            if cleaned_str.endswith("```"):
                cleaned_str = cleaned_str[:-3]
            cleaned_str = cleaned_str.strip()
            
            parsed = json.loads(cleaned_str)
            if "tasks" in parsed:
                task_list = parsed["tasks"]
        except Exception:
            pass

    # Fallback to simulated scheduling if parser/API fails
    if not task_list or len(task_list) < 4:
        task_list = get_fallback_daily_tasks(goals_str, weak_topics_str, active_title, remaining_tasks)

    # Save daily tasks in database
    saved_tasks = []
    for item in task_list[:4]:
        db_task = models.DailyTask(
            user_id=uid,
            task_text=item["task_text"][:55],
            category=item.get("category", "study"),
            completed=False,
            task_date=datetime.datetime.utcnow()
        )
        db.add(db_task)
        saved_tasks.append(db_task)
        
    db.commit()
    
    # Refresh to load IDs
    for st in saved_tasks:
        db.refresh(st)
        
    return saved_tasks

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
    recent focus session minutes, and weak topics to evaluate inactivity,
    celebrate progress, and mitigate burnout.
    """
    uid = current_user["uid"]
    
    # 1. Fetch user profile context
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    if not profile:
        return schemas.AIMotivationResponse(
            status="neutral",
            mentor_message="Welcome! Please complete the onboarding setup to unlock your AI Mentor.",
            insights=[],
            notifications=[]
        )
        
    dev_name = profile.full_name or "Developer"
    
    # Resolve Mentor Personality
    mentor_type = "Pragmatic Architect"
    if profile.bio:
        if "Algorithmic Sherpa" in profile.bio:
            mentor_type = "Algorithmic Sherpa"
        elif "SaaS Evangelist" in profile.bio:
            mentor_type = "SaaS Evangelist"
        elif "Rapid Prototype Guru" in profile.bio:
            mentor_type = "Rapid Prototype Guru"
        elif "Pragmatic Architect" in profile.bio:
            mentor_type = "Pragmatic Architect"

    now = datetime.datetime.utcnow()
    
    # 2. Inactivity Detection (based on study activity dates)
    study_timestamps = []
    
    last_session = db.query(models.LearningSession).filter(
        models.LearningSession.user_id == uid
    ).order_by(models.LearningSession.session_date.desc()).first()
    if last_session:
        study_timestamps.append(last_session.session_date)
        
    last_completed_task = db.query(models.CompletedRoadmapTask).filter(
        models.CompletedRoadmapTask.user_id == uid
    ).order_by(models.CompletedRoadmapTask.completed_at.desc()).first()
    if last_completed_task:
        study_timestamps.append(last_completed_task.completed_at)
        
    if study_timestamps:
        latest_study = max(study_timestamps)
        days_inactive = (now.date() - latest_study.date()).days
    else:
        days_inactive = 5  # default if they haven't logged activity yet
        
    # 3. Active Roadmap Milestone Checklists
    active_node = db.query(models.RoadmapProgress).filter(
        models.RoadmapProgress.user_id == uid,
        models.RoadmapProgress.status == "active"
    ).first()
    
    active_node_pct = 0
    completed_tasks_count = 0
    total_tasks_count = 0
    
    if active_node:
        try:
            parsed = json.loads(active_node.description)
            tasks_list = parsed.get("tasks", [])
            total_tasks_count = len(tasks_list)
            
            completed_records = db.query(models.CompletedRoadmapTask).filter(
                models.CompletedRoadmapTask.user_id == uid,
                models.CompletedRoadmapTask.node_id == active_node.node_id
            ).all()
            
            completed_task_texts = {r.task_text for r in completed_records}
            completed_tasks_count = sum(1 for t in tasks_list if t in completed_task_texts)
            
            if total_tasks_count > 0:
                active_node_pct = int((completed_tasks_count / total_tasks_count) * 100)
        except Exception:
            pass
            
    # 4. Consistency Streaks
    streak_record = db.query(models.Streak).filter(models.Streak.user_id == uid).first()
    streak_val = streak_record.current_streak if streak_record else 1
    
    # 5. Burnout Mitigation (Minutes in last 3 days)
    three_days_ago = now - datetime.timedelta(days=3)
    recent_sessions = db.query(models.LearningSession).filter(
        models.LearningSession.user_id == uid,
        models.LearningSession.session_date >= three_days_ago
    ).all()
    recent_mins = sum(s.duration_mins for s in recent_sessions)
    
    # 6. Struggle Detection (Weak topics)
    weak_topics = db.query(models.UserWeakTopic).filter(models.UserWeakTopic.user_id == uid).all()
    
    # 7. Evaluate Motivation Status
    status = "neutral"
    show_popup = False
    popup_title = None
    popup_message = None
    
    if days_inactive >= 3:
        status = "inactive_returned"
        show_popup = True
        popup_title = "Welcome Back, Creator! 🚀"
        popup_message = f"You've been away for {days_inactive} days. Let's fire up your AI-OS workspaces and resume your engineering journey!"
    elif recent_mins >= 180:
        status = "burnout_risk"
    elif active_node_pct >= 60:
        status = "doing_well"
    elif streak_val >= 3:
        status = "doing_well"
    elif weak_topics:
        status = "struggling"
        
    # 8. Dynamic Quote/Instruction Compiler (LLM or Rules Fallback)
    reply_text = ""
    api_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    
    system_prompt_str = (
        f"You are the elite AIOS Cognitive Mentor, operating with the specialized **{mentor_type}** persona. "
        "Your objective is to review a developer's real-time system learning telemetry, assess their motivational state, "
        "and formulate a highly tailored, brief, and incredibly powerful mentorship greeting.\n\n"
        "DEVELOPER TELEMETRY PORTAL:\n"
        f"- Developer Name: {dev_name}\n"
        f"- Assessed Motivation State: {status}\n"
        f"- Active Roadmap Node Name: {active_node.title if active_node else 'N/A'}\n"
        f"- Active Node Checklist Progress: {active_node_pct}%\n"
        f"- Current Streaks Count: {streak_val} Days\n"
        f"- Focus Duration in Last 3 Days: {recent_mins} minutes\n"
        f"- Active Concept Review Logs (Weak Topics): {', '.join([w.topic_name for w in weak_topics]) if weak_topics else 'None'}\n\n"
        "DIRECTIVES & CONSTRAINTS:\n"
        f"1. Tone Alignment: Match your specialized {mentor_type} personality. Be structural and enterprise-focused if Pragmatic Architect; "
        "be mathematical and complexity-driven if Algorithmic Sherpa; be monetization-first if SaaS Evangelist; be experimental "
        "and hackathon-centric if Rapid Prototype Guru.\n"
        "2. Contextual Integration: Weave their active streaks, recent study hours, or current weak topics naturally into your greeting. "
        "Avoid generic 'Keep going' remarks; greet them personally by name.\n"
        "3. Explicit Formatting: Output EXACTLY 2 to 3 sentences of pure, highly motivating text. Do not wrap in quotes, do not "
        "include markdown banners, labels, or prefixes."
    )
    
    # Try Gemini/OpenAI if keys exist
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system_prompt_str},
                    {"role": "user", "content": "Generate my mentor quote."}
                ],
                "temperature": 0.7,
                "max_tokens": 150
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                reply_text = res_data["choices"][0]["message"]["content"].strip()
        except Exception:
            pass
            
    if not reply_text and api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"SYSTEM INSTRUCTION: {system_prompt_str}"},
                            {"text": "Generate my mentor quote."}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 150
                }
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                reply_text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            pass
            
    # Local fallback rules engine
    if not reply_text:
        topic = weak_topics[-1].topic_name if weak_topics else "core software engineering"
        
        if status == "inactive_returned":
            local_quotes = {
                "Algorithmic Sherpa": f"Welcome back, {dev_name}! Continuous climbing is how we summit. Let’s tackle the next step on your algorithmic path today.",
                "SaaS Evangelist": f"Great to see you back, {dev_name}! The marketplace moves fast, but consistency is how you build a lasting product. Let's ship some code today!",
                "Rapid Prototype Guru": f"Welcome back, {dev_name}! Your sandbox misses you. Let's spin up our workspace and prototype some fresh ideas today!",
                "Pragmatic Architect": f"Welcome back, {dev_name}! Systems build best with continuous integration. Let's resume your learning roadmap and commit some progress today."
            }
        elif status == "burnout_risk":
            local_quotes = {
                "Algorithmic Sherpa": f"You've been training hard, {dev_name} ({recent_mins} mins recently). Take a short breathing break to keep your mind sharp for complex structures.",
                "SaaS Evangelist": f"Outstanding hustle, {dev_name}! But even the best startups need downtime to scale sustainably. Take a quick break to recharge your batteries.",
                "Rapid Prototype Guru": f"You're prototype building at lightspeed ({recent_mins} mins)! Remember to hit pause, stretch, and let your ideas simmer. Take a 5-minute break.",
                "Pragmatic Architect": f"High system load detected ({recent_mins} mins). To prevent cognitive leak and ensure optimal architecture, I recommend pacing yourself. Step away for a few minutes."
            }
        elif status == "struggling":
            local_quotes = {
                "Algorithmic Sherpa": f"I see you're working through {topic}. Don't worry, complexity theory can feel difficult initially. Let's simplify the stack and solve it step by step!",
                "SaaS Evangelist": f"Tackling {topic} is a common roadmap roadblock. But remember: MVP stands for Minimum Viable Product. Let's simplify this feature and ship a basic working prototype today.",
                "Rapid Prototype Guru": f"Struggling with {topic}? Don't worry, building fast means breaking things. Let's isolate this issue, throw away the complexity, and build it step by step!",
                "Pragmatic Architect": f"I see {topic} is in our review logs. Complex layers are best understood by modularizing them. Let's refactor this concept and simplify it step by step."
            }
        elif status == "doing_well":
            local_quotes = {
                "Algorithmic Sherpa": f"Superb climbing, {dev_name}! You’ve completed {active_node_pct}% of your roadmap tasks. Your algorithmic foundation is scaling beautifully!",
                "SaaS Evangelist": f"Amazing hustle, {dev_name}! You’ve completed {active_node_pct}% of our target metrics. We are tracking towards a successful production deploy!",
                "Rapid Prototype Guru": f"Fast and furious progress, {dev_name}! You’ve built out {active_node_pct}% of our roadmap targets. The momentum is absolutely electric!",
                "Pragmatic Architect": f"Excellent execution, {dev_name}! Synced {active_node_pct}% of this stage's roadmap deliverables. Architecture stability and consistency are operating within optimal parameters."
            }
        else:
            local_quotes = {
                "Algorithmic Sherpa": f"Hello {dev_name}! Let’s align our sights on today's target node. Every single task solved brings us closer to algorithmic mastery.",
                "SaaS Evangelist": f"Hey {dev_name}! Ready to add value to our codebase today? Let's check our checklist and ship some robust features.",
                "Rapid Prototype Guru": f"Hey {dev_name}! A fresh day in the sandbox! Let's hack together some cool scripts and push our coding velocity limits.",
                "Pragmatic Architect": f"Greetings {dev_name}. The system stack is online and ready for active commits. Let's analyze our deliverables and complete today's targets systematically."
            }
        reply_text = local_quotes.get(mentor_type, local_quotes["Pragmatic Architect"])
        
    # 9. Build UI Insight Cards
    insights = [
        schemas.InsightCard(
            id="streak-status",
            title="Daily Streak Status",
            description="Maintain your daily login momentum to scale your skill levels.",
            icon="🔥",
            metric=f"{streak_val} Days Active",
            color="var(--accent)"
        ),
        schemas.InsightCard(
            id="roadmap-momentum",
            title="Roadmap Completion",
            description="Your current milestone checklist task completion progress.",
            icon="🚀",
            metric=f"{active_node_pct}% Complete",
            color="var(--accent)"
        ),
        schemas.InsightCard(
            id="burnout-radar",
            title="Burnout Radar",
            description=f"{recent_mins} focus minutes logged in the last 3 days.",
            icon="🧘",
            metric="System Load: High" if recent_mins >= 180 else "System Load: Stable",
            color="var(--warning)" if recent_mins >= 180 else "#38bdf8"
        ),
        schemas.InsightCard(
            id="struggle-tracker",
            title="Struggle Tracker",
            description=f"{len(weak_topics)} concepts currently in review logs.",
            icon="💡",
            metric=f"{len(weak_topics)} Review Areas" if weak_topics else "All Clean ✨",
            color="#ef4444" if weak_topics else "#22c55e"
        )
    ]
    
    # 10. Generate Notifications List
    notifications = []
    if days_inactive >= 3:
        notifications.append(schemas.NotificationItem(
            id="notif-inact",
            type="warning",
            message=f"Returned from inactivity! You've been away for {days_inactive} days. Let's resume daily habits.",
            timestamp="Just now"
        ))
    if recent_mins >= 180:
        notifications.append(schemas.NotificationItem(
            id="notif-burnout",
            type="warning",
            message=f"Burnout Alert: {recent_mins} mins logged recently! Remember to take short breaks to stay fresh.",
            timestamp="Just now"
        ))
    if active_node_pct >= 60:
        notifications.append(schemas.NotificationItem(
            id="notif-progress",
            type="success",
            message=f"Amazing progress! You have completed {active_node_pct}% of this stage's roadmap.",
            timestamp="Just now"
        ))
    if streak_val >= 3:
        notifications.append(schemas.NotificationItem(
            id="notif-streak",
            type="success",
            message=f"On an outstanding {streak_val}-day coding streak! Keep the fire burning 🔥",
            timestamp="Just now"
        ))
        
    # Default info notification
    notifications.append(schemas.NotificationItem(
        id="notif-tip",
        type="info",
        message="Mentor Tip: Struggling with a concept? Click 'Simplify Concept' to break it down step by step.",
        timestamp="Just now"
    ))
    
    return schemas.AIMotivationResponse(
        status=status,
        mentor_message=reply_text,
        popup_title=popup_title,
        popup_message=popup_message,
        show_popup=show_popup,
        insights=insights,
        notifications=notifications
    )



