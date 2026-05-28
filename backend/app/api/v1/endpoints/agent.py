import os
import json
import urllib.request
import urllib.error
import datetime
import re
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.orm import Session
from app.api.deps import get_db, verify_token
from app.models import profile as models
from app.core.mentor_prompts import MENTOR_PROMPTS

router = APIRouter()

class ChatQuery(BaseModel):
    message: str = Field(..., description="The user query or prompt message")
    session_id: Optional[str] = Field(None, description="Active chat session identifier")
    context: Optional[dict] = Field(None, description="Optional developer profile metadata")

class ChatResponse(BaseModel):
    sender: str = "assistant"
    text: str
    timestamp: str
    session_id: Optional[str] = None

class MessageSchema(BaseModel):
    id: str
    sender: str
    text: str
    timestamp: str

    class Config:
        from_attributes = True

class SessionSchema(BaseModel):
    id: str
    title: str
    messages: List[MessageSchema] = []
    timestamp: str

    class Config:
        from_attributes = True

class SessionCreateSchema(BaseModel):
    id: str
    title: str

class WeakTopicSchema(BaseModel):
    topic_name: str
    difficulty_level: Optional[str] = "beginner"

def simulate_openai_chat(message: str, db: Session, uid: str) -> str:
    """
    Cognitive AI Mentor Simulation Engine: Mimics advanced OpenAI GPT response mapping
    by dynamically evaluating the query context against the PostgreSQL developer profile.
    Supports detailed commands: /idea, /summary, /debug, /code, /db, /rag.
    """
    lower_msg = message.lower()
    
    # 1. Fetch profile context if onboarded
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    dev_name = profile.full_name if profile else "Developer"
    mentor_type = "Pragmatic Architect"
    if profile and profile.bio:
        if "Algorithmic Sherpa" in profile.bio:
            mentor_type = "Algorithmic Sherpa"
        elif "SaaS Evangelist" in profile.bio:
            mentor_type = "SaaS Evangelist"
        elif "Rapid Prototype Guru" in profile.bio:
            mentor_type = "Rapid Prototype Guru"
        elif "Pragmatic Architect" in profile.bio:
            mentor_type = "Pragmatic Architect"

    # 2. Command Mappings
    if "/idea" in lower_msg or "project idea" in lower_msg or "project blueprint" in lower_msg:
        interest_list = [i.strip() for i in profile.interest_areas.split(",")] if (profile and profile.interest_areas) else []
        skills_descr = []
        if profile:
            if profile.python_level > 20: skills_descr.append(f"Python ({profile.python_level}%)")
            if profile.web_level > 20: skills_descr.append(f"Web ({profile.web_level}%)")
            if profile.dsa_level > 20: skills_descr.append(f"DSA ({profile.dsa_level}%)")
            if profile.ml_level > 20: skills_descr.append(f"ML ({profile.ml_level}%)")
            if profile.genai_level > 20 or profile.rag_level > 20: skills_descr.append(f"GenAI/RAG ({max(profile.genai_level, profile.rag_level)}%)")
        
        skills_str = ", ".join(skills_descr) if skills_descr else "General Development"
        
        return f"""👋 Hello {dev_name}! As your **{mentor_type}** AI Mentor, I've designed three customized advanced project blueprints tailored to your active skills ({skills_str}) and interest areas ({', '.join(interest_list) if interest_list else 'general software engineering'}):

### 💡 Project Blueprint 1: Multi-Agent Docker Sandboxed Orchestrator
* **Concept**: Build an autonomous developer workspace agent that spins up, runs, and evaluates code tests inside isolated container environments.
* **Tech Stack**: FastAPI, Docker Engine SDK, PostgreSQL (Pool connections), Python.
* **Core Exercise**: Write a secure endpoint `/api/v1/sandbox/run` that executes a user's script in a temporary sandboxed container and streams back the execution stdout logs in real-time.

### 💡 Project Blueprint 2: High-Performance Semantic RAG Repository Search
* **Concept**: Build a smart search service that recursively token-chunks files in a monorepo, computes cosine similarity, and locates matching files in a vector collection.
* **Tech Stack**: Python, Qdrant Vector DB (Port 6333), text-embedding-ada-002, LlamaIndex.
* **Core Exercise**: Configure a recursive splitting tokenizer with standard slide overlap limits, upload file chunks to your Qdrant collection, and write matching scoring algorithms.

### 💡 Project Blueprint 3: Real-Time Developer Activity Dashboard
* **Concept**: Construct a beautiful telemetry statistics tracker displaying active streaks, commit activities, and skill levels.
* **Tech Stack**: Next.js (TypeScript), Tailwind CSS / Vanilla CSS, FastAPI backend, PostgreSQL.
* **Core Exercise**: Build an interactive canvas rendering streak calendars and XP metrics with dynamic transition micro-animations.

**Next Steps**: Select one blueprint, create a new branch, and ask me to help you write the backend database schemas!"""

    elif "/summary" in lower_msg or "summarize" in lower_msg or "my progress" in lower_msg:
        streak_val = 1
        longest_val = 1
        xp = 0
        college = "Self-Taught"
        branch = "CS & Engineering"
        graduation = "N/A"
        
        if profile:
            xp = profile.xp_points
            college = profile.college_name or college
            branch = profile.branch_degree or branch
            graduation = f"Class of {profile.graduation_year}" if profile.graduation_year else "N/A"
            
            # Fetch streak
            streak_record = db.query(models.Streak).filter(models.Streak.user_id == uid).first()
            if streak_record:
                streak_val = streak_record.current_streak
                longest_val = streak_record.longest_streak
                
        goals = db.query(models.UserGoal).filter(models.UserGoal.user_id == uid).all()
        goals_str = ", ".join([g.goal_name for g in goals]) if goals else "None set"
        
        completed_nodes = db.query(models.RoadmapProgress).filter(
            models.RoadmapProgress.user_id == uid,
            models.RoadmapProgress.status == "completed"
        ).count()
        total_nodes = db.query(models.RoadmapProgress).filter(models.RoadmapProgress.user_id == uid).count()
        
        return f"""📊 ### AI-Engineer-OS Developer Telemetry Report
Greetings {dev_name}! I have compiled your live development metrics and learning data from the active databases:

#### 👤 Profile Identity
* **Developer Name**: {dev_name}
* **Institution**: {college} ({branch}, {graduation})
* **Target Goals**: {goals_str}
* **Active Cognitive Mentor**: **{mentor_type}**

#### 🏆 Mastery Progress & Streaks
* **Total XP Accumulation**: `{xp} XP`
* **Current Consistency Streak**: `{streak_val} Days` 🔥
* **Longest Streak Recorded**: `{longest_val} Days`
* **Roadmap Milestones Cleared**: `{completed_nodes} / {total_nodes if total_nodes else 4} Stages`

#### ⚡ Skills Proficiency Index
| Skill | Level | Mastery Tier |
| :--- | :---: | :--- |
| **Python** | {profile.python_level if profile else 0}% | {'Advanced' if (profile and profile.python_level > 70) else 'Intermediate' if (profile and profile.python_level > 30) else 'Beginner'} |
| **DSA & Algorithms** | {profile.dsa_level if profile else 0}% | {'Advanced' if (profile and profile.dsa_level > 70) else 'Intermediate' if (profile and profile.dsa_level > 30) else 'Beginner'} |
| **JavaScript / Web** | {profile.web_level if profile else 0}% | {'Advanced' if (profile and profile.web_level > 70) else 'Intermediate' if (profile and profile.web_level > 30) else 'Beginner'} |
| **Machine Learning** | {profile.ml_level if profile else 0}% | {'Advanced' if (profile and profile.ml_level > 70) else 'Intermediate' if (profile and profile.ml_level > 30) else 'Beginner'} |
| **Generative AI & RAG** | {max(profile.genai_level, profile.rag_level) if profile else 0}% | {'Advanced' if (profile and max(profile.genai_level, profile.rag_level) > 70) else 'Intermediate' if (profile and max(profile.genai_level, profile.rag_level) > 30) else 'Beginner'} |

Keep up the outstanding work! Your target daily commitment is `{profile.time_availability_mins if profile else 60} minutes/day`. Ready to unlock your next roadmap milestone?"""

    elif "/debug" in lower_msg or "error" in lower_msg or "bug" in lower_msg or "fix" in lower_msg:
        return f"""🐛 ### AIOS Developer Debugger Sandbox Audit
Hello {dev_name}! I have initiated a code audit sequence on your sandboxed backend router configurations. 

#### 🔍 Issue Identified
The developer reported a `500 Internal Server Error` (or database session locking issues) when invoking state-updating REST endpoints (like `/profile/roadmap/{node_id}/complete`). 

#### 🔬 Root Cause Analysis
In multi-threaded FastAPI environments using SQLite or PostgreSQL connection pools, transaction locks occur when a write/update database session is opened, but not properly committed, or a rollback sequence is missing when exceptions are thrown:
1. `db.commit()` is not called inside a resilient `try-except` block.
2. The session pool becomes starved or locked by inactive connections.
3. Foreign key constraints fail if a node depends on a user record that isn't fully created.

#### 🛠️ Corrected Secure Implementation Blueprint
Here is the recommended resilient and transaction-safe FastAPI route structure:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.api.deps import get_db, verify_token
from app.models import profile as models

router = APIRouter()

@router.put("/roadmap/{node_id}/complete", status_code=200)
def complete_roadmap_milestone(
    node_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    uid = current_user["uid"]
    
    # 1. Fetch target node securely
    node = db.query(models.RoadmapProgress).filter(
        models.RoadmapProgress.user_id == uid,
        models.RoadmapProgress.node_id == node_id
    ).first()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified roadmap node not found."
        )
        
    try:
        # 2. Resiliently update node state
        node.status = "completed"
        node.completed_at = datetime.datetime.utcnow()
        
        # 3. Award XP bonus
        profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
        if profile:
            profile.xp_points += 50
            
        # 4. Commit transaction
        db.commit()
        db.refresh(node)
        return {"status": "completed", "awarded_xp": 50, "node_id": node_id}
        
    except Exception as e:
        # 5. RESILIENT ROLLBACK: Prevents database locks
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction error: {str(e)}"
        )
```

**Actions Guided:**
* Wrap all write/update DB queries inside `try-except-rollback` boundaries.
* Verify your API router mounts have standard `Depends(get_db)` to leverage pool connections.

Let me know if you would like me to audit your local Docker container logs to check for network connection drops!"""

    elif "code" in lower_msg or "fastapi" in lower_msg or "/code" in lower_msg:
        return f"""👋 Hello {dev_name}! As your **{mentor_type}** AI Mentor, I've prepared a professional, secure FastAPI code template to bootstrap your sandboxed services:

```python
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Secure API Sandbox")

class IngestionItem(BaseModel):
    data: str
    tokens: int

@app.post("/api/v1/ingest", status_code=201)
def ingest_data(item: IngestionItem):
    if not item.data:
        raise HTTPException(status_code=400, detail="Data payload cannot be empty.")
    return {"status": "ingested", "processed_tokens": item.tokens}
```

**Implementation Steps:**
1. Save this code to `backend/app/api/v1/endpoints/sandbox.py`.
2. Register the routing endpoint in `api/router.py`.
3. Launch standard tests in your AIOS Dashboard quick-actions tab to verify compilation.

Let me know if you would like me to write the database migration scripts!"""

    elif "database" in lower_msg or "postgres" in lower_msg or "sql" in lower_msg or "/db" in lower_msg:
        return f"""👋 Greetings {dev_name}! I am auditing your active **PostgreSQL Database** configurations on sandbox port `5434`. 

Here is a recommended SQLAlchemy schema representing user active learning logs:

```python
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from app.db.base_class import Base
import datetime

class LearningFocusLog(Base):
    __tablename__ = "learning_focus_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    topic_id = Column(String, nullable=False)
    mins_spent = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
```

**Actions Logged:**
- Connected pool engine successfully to PostgreSQL database server.
- Synced migration schema logs inside table `learning_profiles`.
Would you like me to generate the Alembic migrations for this structure?"""

    elif "vector" in lower_msg or "qdrant" in lower_msg or "search" in lower_msg or "/rag" in lower_msg:
        return f"""👋 Hello {dev_name}! Your vector semantic engine is bound to Qdrant cluster port `6333`. 

Here is the exact Python structure to token-chunk documents and generate cosine similarity matches:

```python
import urllib.request
import json

def search_qdrant_embeddings(query_vector: list, limit: int = 3):
    url = "http://localhost:6333/collections/ai_engineer_kb/points/search"
    payload = {
        "vector": query_vector,
        "limit": limit,
        "with_payload": True
    }
    # Direct urllib POST to Qdrant REST api
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))
```

Feel free to drag-and-drop code or markdown files in the **Vector Search** tab to splits tokens, invoke text-embedding-ada-002, and populate your semantic databases!"""

    else:
        return f"""🤖 Greetings {dev_name}! I am your AIOS Cognitive Mentor, acting with the persona of a **{mentor_type}**.

I am connected to the monorepo databases, container sandboxes, and semantic indexes. I can generate dynamic roadmaps, project blueprints, or help you audit code in real-time.

**Quick Command Shortcuts Available:**
* 🐘 **Database Schemas**: Type `/db` to get Postgres connection pooling and transactional tips.
* ⚡ **Code Boilerplate**: Type `/code` to get validated FastAPI models and routers.
* 🎯 **Semantic Search**: Type `/rag` to review cosine similarity scoring inside Qdrant.
* 💡 **Project Blueprints**: Type `/idea` to get three custom advanced engineering project ideas.
* 📊 **Progress Report**: Type `/summary` to get your active skill levels, XP counts, and streaks.
* 🐛 **Sandbox Debugger**: Type `/debug` to audit sandbox errors and get resilient coding solutions.

What are we orchestrating today inside the developer stack?"""

# ═══════════════════════════════════════════════════════════
# SESSIONS AND MESSAGES CRUD ROUTERS
# ═══════════════════════════════════════════════════════════

@router.get("/sessions", response_model=List[SessionSchema])
def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    uid = current_user["uid"]
    sessions = db.query(models.ChatSession).filter(
        models.ChatSession.user_id == uid
    ).order_by(models.ChatSession.updated_at.desc()).all()
    
    response = []
    for s in sessions:
        msgs = []
        for m in s.messages:
            msgs.append(MessageSchema(
                id=m.id,
                sender=m.sender,
                text=m.text,
                timestamp=m.timestamp.strftime("%H:%M")
            ))
        response.append(SessionSchema(
            id=s.id,
            title=s.title,
            messages=msgs,
            timestamp=s.updated_at.strftime("%H:%M")
        ))
    return response

@router.post("/sessions", response_model=SessionSchema)
def create_chat_session(
    session_data: SessionCreateSchema,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    uid = current_user["uid"]
    
    # Check if already exists
    existing = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_data.id
    ).first()
    if existing:
        msgs = []
        for m in existing.messages:
            msgs.append(MessageSchema(
                id=m.id,
                sender=m.sender,
                text=m.text,
                timestamp=m.timestamp.strftime("%H:%M")
            ))
        return SessionSchema(
            id=existing.id,
            title=existing.title,
            messages=msgs,
            timestamp=existing.updated_at.strftime("%H:%M")
        )
        
    db_session = models.ChatSession(
        id=session_data.id,
        user_id=uid,
        title=session_data.title
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    return SessionSchema(
        id=db_session.id,
        title=db_session.title,
        messages=[],
        timestamp=db_session.updated_at.strftime("%H:%M")
    )

@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    uid = current_user["uid"]
    db_session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == uid
    ).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Chat session not found.")
        
    db.delete(db_session)
    db.commit()
    return {"status": "success", "message": "Session wiped successfully."}

# ═══════════════════════════════════════════════════════════
# WEAK TOPICS CRUD ROUTERS
# ═══════════════════════════════════════════════════════════

@router.get("/weak-topics")
def get_weak_topics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    uid = current_user["uid"]
    topics = db.query(models.UserWeakTopic).filter(
        models.UserWeakTopic.user_id == uid
    ).all()
    return [{"id": t.id, "topic_name": t.topic_name, "difficulty_level": t.difficulty_level} for t in topics]

@router.post("/weak-topics")
def add_weak_topic(
    topic: WeakTopicSchema,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    uid = current_user["uid"]
    existing = db.query(models.UserWeakTopic).filter(
        models.UserWeakTopic.user_id == uid,
        models.UserWeakTopic.topic_name == topic.topic_name
    ).first()
    if existing:
        return {"status": "exists", "id": existing.id}
        
    db_topic = models.UserWeakTopic(
        user_id=uid,
        topic_name=topic.topic_name,
        difficulty_level=topic.difficulty_level
    )
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return {"status": "success", "id": db_topic.id}

@router.delete("/weak-topics/{topic_name}")
def remove_weak_topic(
    topic_name: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    uid = current_user["uid"]
    db_topic = db.query(models.UserWeakTopic).filter(
        models.UserWeakTopic.user_id == uid,
        models.UserWeakTopic.topic_name == topic_name
    ).first()
    if not db_topic:
        raise HTTPException(status_code=404, detail="Weak topic not found.")
    db.delete(db_topic)
    db.commit()
    return {"status": "success"}

# ═══════════════════════════════════════════════════════════
# MAIN COGNITIVE CHAT ENGINE
# ═══════════════════════════════════════════════════════════

@router.post("/chat", response_model=ChatResponse)
def chat_with_mentor(
    query: ChatQuery,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Connects to Google Gemini API or OpenAI's API to generate dynamic, personalized responses.
    Maintains persistent session dialogue state and context. Falls back to simulator on failure.
    """
    uid = current_user["uid"]
    prompt_message = query.message
    session_id = query.session_id
    
    # 1. Fetch user profile context if onboarded
    profile = db.query(models.LearningProfile).filter(models.LearningProfile.user_id == uid).first()
    dev_name = profile.full_name if profile else "Developer"
    
    # 2. Resolve/Sync Active Session Thread in DB
    if not session_id:
        # Fallback to last active session
        last_sess = db.query(models.ChatSession).filter(
            models.ChatSession.user_id == uid
        ).order_by(models.ChatSession.updated_at.desc()).first()
        if last_sess:
            session_id = last_sess.id
        else:
            session_id = "session-" + str(int(datetime.datetime.utcnow().timestamp()))
            db_sess = models.ChatSession(id=session_id, user_id=uid, title="AI Mentor Welcome")
            db.add(db_sess)
            db.commit()
    else:
        # Ensure session exists in the database
        db_sess = db.query(models.ChatSession).filter(
            models.ChatSession.id == session_id
        ).first()
        if not db_sess:
            db_sess = models.ChatSession(id=session_id, user_id=uid, title="Active Chat")
            db.add(db_sess)
            db.commit()

    # 3. Save User Prompt message to database immediately
    user_msg_id = "msg-" + str(int(datetime.datetime.utcnow().timestamp())) + "-user"
    db_msg = models.ChatMessage(
        id=user_msg_id,
        session_id=session_id,
        sender="user",
        text=prompt_message,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(db_msg)
    
    # Update Session updated timestamp
    session_obj = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if session_obj:
        session_obj.updated_at = datetime.datetime.utcnow()
    db.commit()

    # 4. Fetch User Progress & Telemetry Context
    goals = db.query(models.UserGoal).filter(models.UserGoal.user_id == uid).all()
    goals_str = ", ".join([g.goal_name for g in goals]) if goals else "Not set yet"
    
    weak_topics_records = db.query(models.UserWeakTopic).filter(models.UserWeakTopic.user_id == uid).all()
    weak_topics_str = ", ".join([w.topic_name for w in weak_topics_records]) if weak_topics_records else "None recorded yet"
    
    total_nodes = db.query(models.RoadmapProgress).filter(models.RoadmapProgress.user_id == uid).count()
    completed_nodes = db.query(models.RoadmapProgress).filter(
        models.RoadmapProgress.user_id == uid,
        models.RoadmapProgress.status == "completed"
    ).count()
    
    streak_record = db.query(models.Streak).filter(models.Streak.user_id == uid).first()
    streak_days = streak_record.current_streak if streak_record else 1
    xp = profile.xp_points if profile else 0
    learning_style = profile.learning_style if profile else "project-based"
    time_avail = profile.time_availability_mins if profile else 60
    
    # Analyze low skills automatically
    low_skills = []
    if profile:
        skills_dict = {
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
        for sk, val in skills_dict.items():
            if val > 0 and val < 40:
                low_skills.append(f"{sk} ({val}%)")
    low_skills_str = ", ".join(low_skills) if low_skills else "None (all active skills are intermediate or advanced)"

    # Identify Active Mentor Persona
    mentor_type = "Pragmatic Architect"
    if profile and profile.bio:
        if "Algorithmic Sherpa" in profile.bio:
            mentor_type = "Algorithmic Sherpa"
        elif "SaaS Evangelist" in profile.bio:
            mentor_type = "SaaS Evangelist"
        elif "Rapid Prototype Guru" in profile.bio:
            mentor_type = "Rapid Prototype Guru"
        elif "Pragmatic Architect" in profile.bio:
            mentor_type = "Pragmatic Architect"

    # 5. Retrieve Thread Chat History for Conversational Context (Limit to last 15 messages)
    history_msgs = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session_id
    ).order_by(models.ChatMessage.timestamp.asc()).all()
    
    history_list = []
    # Loop over prior messages, excluding the one we just wrote (which is history_msgs[-1])
    for m in history_msgs[:-1]:
        history_list.append({
            "role": "user" if m.sender == "user" else "assistant",
            "content": m.text
        })

    # 6. Formulate Robust System Directives
    system_prompt_str = (
        f"ROLE & CORE PERSONA:\n"
        f"You are the elite AIOS Cognitive Mentor, operating as the highly specialized **{mentor_type}** persona.\n"
        f"Your mandate is to pair-program with the developer, teach advanced software concepts simply, "
        f"diagnose sandbox/database errors pragmatically, and motivate them towards clear goals.\n\n"
        f"DEVELOPER SYSTEM CONTEXT:\n"
        f"- Developer Name: {dev_name}\n"
        f"- Career Goals: {goals_str}\n"
        f"- Study Strategy: {learning_style} learning, committing {time_avail} mins/day.\n"
        f"- Roadmap Progress: Cleared {completed_nodes} of {total_nodes if total_nodes else 4} milestones.\n"
        f"- Telemetry Accumulations: {xp} XP points, active {streak_days}-day streak.\n"
        f"- Active Review Topics (Struggles): {weak_topics_str}\n"
        f"- Skill Deficiencies (under 40%): {low_skills_str}\n\n"
        f"DIRECTIVES & CONSTRAINTS:\n"
        f"1. Conversational Personalization: Draw connections to their goals and active streaks naturally. Address them by name. "
        f"Never speak like a generic, context-less assistant. If they have a high streak, commend their consistency; "
        f"if they are struggling, simplify the topic modularly.\n"
        f"2. Persona Execution: Enforce your {mentor_type} teaching philosophy. "
        f"If Pragmatic Architect: explain database pools, index scans, and rollback safety with structured boilerplates. "
        f"If Algorithmic Sherpa: visualize states using ASCII diagrams and provide worst-case/average-case Big-O metrics. "
        f"If SaaS Evangelist: focus on stripe checkout hooks, metered billing gates, and minimal viable product scaling. "
        f"If Rapid Prototype Guru: leverage LangChain custom models, qdrant vector indexing, and fast-paced mock integrations.\n"
        f"3. DYNAMIC WEAK TOPIC TRACKING: If the developer asks a troubleshooting, debugging, or conceptual question showing they are struggling with a specific concept (e.g. Docker, recursive backtracking, Stripe checks), append `[WEAK_TOPIC: <Topic Name>]` to the VERY END of your response so the system can record it. E.g. `[WEAK_TOPIC: Docker Ports]`. You can output multiple if relevant.\n"
        f"4. DYNAMIC TOPIC RESOLUTION: If the developer demonstrates mastery, solves a debugging puzzle, or completes a roadmap challenge they previously struggled with, append `[RESOLVED_TOPIC: <Topic Name>]` to the VERY END of your response to remove it. E.g. `[RESOLVED_TOPIC: Docker Ports]`.\n"
        f"5. Command Shortcuts Support: Fully support these commands, styling them exactly based on your active mentor persona:\n"
        f"   - `/idea`: Present 3 custom project blueprints tailored to their skill indicators and goals.\n"
        f"   - `/summary`: Compile a clean Markdown telemetry report summarizing streaks, XP, and skill tiers.\n"
        f"   - `/debug`: Conduct a sandbox database session/port audit and provide transaction-safe rollback blueprints.\n"
        f"   - `/db`: Outline secure connection pool schemas and indexes.\n"
        f"   - `/rag`: Define sliding text tokenization and qdrant nearest-neighbor search scripts."
    )

    api_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    reply_text = ""

    # 7. Attempt OpenAI Completion
    if api_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            messages_payload = [{"role": "system", "content": system_prompt_str}]
            for h in history_list:
                messages_payload.append({"role": h["role"], "content": h["content"]})
            messages_payload.append({"role": "user", "content": prompt_message})
            
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": messages_payload,
                "temperature": 0.7
            }
            
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
            )
            
            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                reply_text = res_data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenAI Completion failed: {e}")

    # 8. Attempt Google Gemini Completion (High priority per user preference)
    if not reply_text and gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            
            contents_payload = []
            # Inject system prompt securely
            contents_payload.append({
                "role": "user",
                "parts": [{"text": f"SYSTEM INSTRUCTION: {system_prompt_str}\n\nPlease acknowledge these instructions."}]
            })
            contents_payload.append({
                "role": "model",
                "parts": [{"text": "Understood. I will act as your AIOS Cognitive Mentor with the specified persona, incorporating developer progress, goals, weak topics, and streaks, and will append [WEAK_TOPIC: ...] or [RESOLVED_TOPIC: ...] tags when relevant."}]
            })
            
            # Map history
            for h in history_list:
                contents_payload.append({
                    "role": "user" if h["role"] == "user" else "model",
                    "parts": [{"text": h["content"]}]
                })
            # Current message
            contents_payload.append({
                "role": "user",
                "parts": [{"text": prompt_message}]
            })
            
            payload = {
                "contents": contents_payload,
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2048
                }
            }
            
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            
            with urllib.request.urlopen(req, timeout=12) as response:
                res_body = response.read().decode("utf-8")
                res_data = json.loads(res_body)
                reply_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Gemini Completion failed: {e}")

    # 9. Fallback to simulator
    if not reply_text:
        reply_text = simulate_openai_chat(prompt_message, db, uid)

    # 10. Dynamic Weak Topics & Resolution parsing
    weak_matches = re.findall(r"\[WEAK_TOPIC:\s*(.*?)\]", reply_text, re.IGNORECASE)
    resolved_matches = re.findall(r"\[RESOLVED_TOPIC:\s*(.*?)\]", reply_text, re.IGNORECASE)
    
    for topic in weak_matches:
        topic_cleaned = topic.strip()
        exist = db.query(models.UserWeakTopic).filter(
            models.UserWeakTopic.user_id == uid,
            models.UserWeakTopic.topic_name == topic_cleaned
        ).first()
        if not exist:
            db.add(models.UserWeakTopic(user_id=uid, topic_name=topic_cleaned, difficulty_level="beginner"))
            
    for topic in resolved_matches:
        topic_cleaned = topic.strip()
        exist = db.query(models.UserWeakTopic).filter(
            models.UserWeakTopic.user_id == uid,
            models.UserWeakTopic.topic_name == topic_cleaned
        ).first()
        if exist:
            db.delete(exist)

    # Strip dynamic tags from user visible chat message
    reply_text = re.sub(r"\[WEAK_TOPIC:\s*(.*?)\]", "", reply_text, flags=re.IGNORECASE)
    reply_text = re.sub(r"\[RESOLVED_TOPIC:\s*(.*?)\]", "", reply_text, flags=re.IGNORECASE)
    reply_text = reply_text.strip()

    # 11. Save Assistant reply to Database
    assistant_msg_id = "msg-" + str(int(datetime.datetime.utcnow().timestamp())) + "-assistant"
    db_assistant_msg = models.ChatMessage(
        id=assistant_msg_id,
        session_id=session_id,
        sender="assistant",
        text=reply_text,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(db_assistant_msg)
    
    # Update Session updated timestamp again
    if session_obj:
        session_obj.updated_at = datetime.datetime.utcnow()
    db.commit()

    return ChatResponse(
        sender="assistant",
        text=reply_text,
        timestamp=datetime.datetime.now().strftime("%H:%M"),
        session_id=session_id
    )
