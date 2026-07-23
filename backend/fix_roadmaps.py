from app.db.session import SessionLocal
from app.models import profile as models
from app.schemas import profile as schemas
from app.services.profile_service import generate_ai_roadmap
import json

def fix_all_roadmaps():
    db = SessionLocal()
    
    profiles = db.query(models.LearningProfile).all()
    for profile in profiles:
        uid = profile.user_id
        print(f"Fixing roadmap for {uid}...")
        
        goals = db.query(models.UserGoal).filter(models.UserGoal.user_id == uid).all()
        goal_names = [g.goal_name for g in goals]
        
        interests = [i.strip() for i in profile.interest_areas.split(",")] if profile.interest_areas else []
    
        data = schemas.OnboardingSubmit(
            full_name=profile.full_name or "Developer",
            college_name=profile.college_name,
            branch_degree=profile.branch_degree,
            graduation_year=profile.graduation_year,
            bio=profile.bio,
            github_link=profile.github_link,
            linkedin_link=profile.linkedin_link,
            
            python_level=profile.python_level or 0,
            javascript_level=profile.javascript_level or 0,
            dsa_level=profile.dsa_level or 0,
            ml_level=profile.ml_level or 0,
            dl_level=profile.dl_level or 0,
            genai_level=profile.genai_level or 0,
            web_level=profile.web_level or 0,
            backend_level=profile.backend_level or 0,
            devops_level=profile.devops_level or 0,
            agents_level=profile.agents_level or 0,
            rag_level=profile.rag_level or 0,
            
            career_goals=goal_names,
            learning_style=profile.learning_style or "Visual",
            time_availability_mins=profile.time_availability_mins or 60,
            
            experience_built_projects=profile.experience_built_projects or False,
            experience_used_git=profile.experience_used_git or False,
            experience_hackathons=profile.experience_hackathons or False,
            experience_deployed=profile.experience_deployed or False,
            experience_apis=profile.experience_apis or False,
            experience_worked_ai=profile.experience_worked_ai or False,
            interest_areas=interests
        )
    
        db.query(models.RoadmapProgress).filter(models.RoadmapProgress.user_id == uid).delete()
        
        ai_roadmap_data = generate_ai_roadmap(data)
        nodes = ai_roadmap_data.get("nodes", [])
    
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
        db.commit()
        print(f"Updated roadmap for user: {uid}")
    
    db.close()

if __name__ == "__main__":
    fix_all_roadmaps()
