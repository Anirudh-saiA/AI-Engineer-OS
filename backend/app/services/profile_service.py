import datetime
import os
import json
import urllib.request
from typing import List
from sqlalchemy.orm import Session
from app.models import profile as models
from app.schemas import profile as schemas
from collections import Counter

# ================= TELEMETRY / STREAK TRACKING =================

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

# ================= ROADMAP GENERATION (SIMULATION & PROMPTS) =================

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

    first_status = "active"

    # Stage 1: Foundations or Version Control Setup
    if not data.experience_used_git:
        nodes.append({
            "node_id": "version-control-sandboxing",
            "title": "Version Control & Isolated Dev Sandboxing",
            "description": "Establish a bulletproof setup using Git, local volume mounts, and isolated Docker network nodes.",
            "status": first_status,
            "tasks": [
                "Install Git, register username, and configure ssh key pairs",
                "Create first local git repo, stage files, and push to GitHub",
                "Write multi-stage Dockerfiles mounting local terminal files"
            ]
        })
        first_status = "locked"

    # Stage 2: Language Mastery (Python/JS Core)
    if "python" in data.interest_areas or data.python_level <= 40:
        nodes.append({
            "node_id": "python-advanced-scripting",
            "title": "Advanced Python Scripting & OOP Architectures",
            "description": "Master decorators, context managers, clean structured logging, and concurrency.",
            "status": first_status,
            "tasks": [
                "Write custom Python decorators logging execution run times",
                "Build dynamic custom exception classes with traceback log routes",
                "Setup concurrent task runner loops using asyncio pools"
            ]
        })
        first_status = "locked"
    else:
        nodes.append({
            "node_id": "web-concurrency-frameworks",
            "title": "Asynchronous Web Architecture & API Pipelines",
            "description": "Configure FastAPI gateway endpoints, CORS rules, and secure auth verification filters.",
            "status": first_status,
            "tasks": [
                "Setup FastAPI boilerplate with router separation structures",
                "Configure CORS middleware filtering specific domain origins",
                "Build bearer verification decorators executing token checks"
            ]
        })
        first_status = "locked"

    # Stage 3: Core Domain Tracks (RAG/AI Agents OR Advanced Algorithms OR SaaS MVP)
    if any("placement" in g or "dsa" in g for g in goals_lower):
        # DSA/Placement Track
        nodes.append({
            "node_id": "algorithmic-complexity-dsa",
            "title": "Advanced Data Structures & Optimization",
            "description": "Analyze Big-O space/time complexities, customize tree models, and solve advanced dynamic programming puzzles.",
            "status": "locked",
            "tasks": [
                "Implement tree search algorithms measuring recursion depths",
                "Write dynamic programming equations solving knapsack weights",
                "Optimize SQLite database indexes decreasing query bounds"
            ]
        })
    elif any("ai" in g or "genai" in g or "rag" in g for g in goals_lower):
        # RAG / Agents Track
        nodes.append({
            "node_id": "vector-qdrant-similarity",
            "title": "Vector Embeddings & Semantic Similarity Engines",
            "description": "Tokenize unstructured texts, generate coordinate embeddings, and execute similarity searches in Qdrant collections.",
            "status": "locked",
            "tasks": [
                "Build text tokenizers generating custom sliding overlap chunks",
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

# ================= DAILY CHECKLIST GENERATION =================

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

def get_daily_planner_tasks_service(db: Session, uid: str) -> List[models.DailyTask]:
    """
    Business Logic: tailoring 4 checklist tasks using active user telemetry parameters.
    """
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    if not profile:
        return []
        
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

# ================= AI MOTIVATION GREETER =================

def get_ai_motivation_service(db: Session, uid: str) -> schemas.AIMotivationResponse:
    """
    AI Motivational System Endpoint logic: Analyzes streaks, roadmap checked tasks,
    recent focus session minutes, and weak topics to evaluate inactivity,
    celebrate progress, and mitigate burnout.
    """
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

# ================= PROJECT ANALYTICS CALCULATION =================

def calculate_project_analytics_service(db: Session, uid: str) -> schemas.ProjectAnalyticsResponse:
    """
    Project Analytics Calculation: Fetches all registered software projects,
    calculates completion percentage, favorite category, total hours spent,
    and maps dynamic skill tag arrays.
    """
    projects = db.query(models.Project).filter(models.Project.user_id == uid).all()
    
    projects_started = len(projects)
    projects_completed = len([p for p in projects if p.status == "completed"])
    
    completion_rate = 0.0
    if projects_started > 0:
        completion_rate = round((projects_completed / projects_started) * 100, 1)
        
    hours_spent = sum([p.hours_spent for p in projects if p.hours_spent is not None])
    
    favorite_category = "General"
    categories = [p.category for p in projects if p.category]
    if categories:
        favorite_category = Counter(categories).most_common(1)[0][0]
        
    # Skills Gained compilation
    skills_set = set()
    for p in projects:
        if p.skills:
            for s in p.skills.split(","):
                s_clean = s.strip()
                if s_clean:
                    skills_set.add(s_clean)
                    
    skills_gained = sorted(list(skills_set))
    
    # User success rate: Completed / Started ratio or 100% completed status
    success_rate = completion_rate
    
    return schemas.ProjectAnalyticsResponse(
        projects_started=projects_started,
        projects_completed=projects_completed,
        completion_rate=completion_rate,
        favorite_category=favorite_category,
        hours_spent=hours_spent,
        success_rate=success_rate,
        skills_gained=skills_gained
    )
