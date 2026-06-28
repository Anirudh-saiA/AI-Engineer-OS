"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

interface OnboardingWizardProps {
  step: number;
  data: any;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setData: React.Dispatch<React.SetStateAction<any>>;
  close: () => void;
}

const SKILL_TOPICS = {
  python: [
    "Core Python Syntax & Built-ins",
    "Decorators, Generators & Iterators",
    "Package Management & Venvs (pip, poetry)",
    "Popular Libraries (Pandas, Numpy, Requests)",
    "Asyncio, Multithreading & Concurrency"
  ],
  web: [
    "HTML5 & CSS3 layout structures",
    "Modern JS (ES6+) & TypeScript",
    "Frontend Frameworks (React, Next.js)",
    "Backend Servers & Frameworks (FastAPI, Node)",
    "Database Systems & ORMs (Postgres, Prisma)"
  ],
  dsa: [
    "Basic Structures (Arrays, Lists, Stacks)",
    "Trees & Graphs (DFS, BFS, Traversals)",
    "Sorting, Searching & Binary Search",
    "Dynamic Programming & Greedy Approaches",
    "Time/Space Complexity (Big O Notation)"
  ],
  ml: [
    "Supervised learning (Regression, Classification)",
    "Unsupervised learning (Clustering, PCA)",
    "Model Evaluation Metrics (Precision, Recall)",
    "Feature Engineering & Data Preprocessing",
    "Basic Neural Networks & Deep Learning frameworks"
  ]
};

export default function OnboardingWizard({
  step,
  data,
  setStep,
  setData,
  close,
}: OnboardingWizardProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [analysisText, setAnalysisText] = useState("Initializing calibration metrics...");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [onboardedResult, setOnboardedResult] = useState<any>(null);

  // SECTION 2: Basic Info
  const [fullName, setFullName] = useState(data.full_name || user?.displayName || "");
  const [collegeName, setCollegeName] = useState(data.college_name || "");
  const [branchDegree, setBranchDegree] = useState(data.branch_degree || "");
  const [graduationYear, setGraduationYear] = useState<number>(data.graduation_year || 2027);
  const [bio, setBio] = useState(data.bio || "Passionate software engineer building next-gen systems.");
  const [githubLink, setGithubLink] = useState(data.github_link || "");
  const [linkedinLink, setLinkedinLink] = useState(data.linkedin_link || "");

  // SECTION 3: Skill levels (0 - 100)
  const [python, setPython] = useState<number>(data.python_level || 30);
  const [web, setWeb] = useState<number>(data.web_level || 25);
  const [dsa, setDsa] = useState<number>(data.dsa_level || 20);
  const [ml, setMl] = useState<number>(data.ml_level || 10);

  // State for expanded skill details in Step 3
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({
    python: false,
    web: false,
    dsa: false,
    ml: false
  });

  // Checklist state for each skill
  const [pythonChecked, setPythonChecked] = useState<boolean[]>([false, false, false, false, false]);
  const [webChecked, setWebChecked] = useState<boolean[]>([false, false, false, false, false]);
  const [dsaChecked, setDsaChecked] = useState<boolean[]>([false, false, false, false, false]);
  const [mlChecked, setMlChecked] = useState<boolean[]>([false, false, false, false, false]);

  // Sync checkboxes on mount based on initial level values
  useEffect(() => {
    setPythonChecked(Array.from({ length: 5 }, (_, i) => python >= (i + 1) * 20));
    setWebChecked(Array.from({ length: 5 }, (_, i) => web >= (i + 1) * 20));
    setDsaChecked(Array.from({ length: 5 }, (_, i) => dsa >= (i + 1) * 20));
    setMlChecked(Array.from({ length: 5 }, (_, i) => ml >= (i + 1) * 20));
  }, []);

  const handleSliderChange = (skill: "python" | "web" | "dsa" | "ml", val: number) => {
    const checkedState = Array.from({ length: 5 }, (_, i) => val >= (i + 1) * 20);
    if (skill === "python") {
      setPython(val);
      setPythonChecked(checkedState);
    } else if (skill === "web") {
      setWeb(val);
      setWebChecked(checkedState);
    } else if (skill === "dsa") {
      setDsa(val);
      setDsaChecked(checkedState);
    } else if (skill === "ml") {
      setMl(val);
      setMlChecked(checkedState);
    }
  };

  const handleCheckboxChange = (skill: "python" | "web" | "dsa" | "ml", idx: number) => {
    let nextChecked: boolean[];
    if (skill === "python") {
      nextChecked = [...pythonChecked];
      nextChecked[idx] = !nextChecked[idx];
      setPythonChecked(nextChecked);
      const val = nextChecked.filter(Boolean).length * 20;
      setPython(val);
    } else if (skill === "web") {
      nextChecked = [...webChecked];
      nextChecked[idx] = !nextChecked[idx];
      setWebChecked(nextChecked);
      const val = nextChecked.filter(Boolean).length * 20;
      setWeb(val);
    } else if (skill === "dsa") {
      nextChecked = [...dsaChecked];
      nextChecked[idx] = !nextChecked[idx];
      setDsaChecked(nextChecked);
      const val = nextChecked.filter(Boolean).length * 20;
      setDsa(val);
    } else if (skill === "ml") {
      nextChecked = [...mlChecked];
      nextChecked[idx] = !nextChecked[idx];
      setMlChecked(nextChecked);
      const val = nextChecked.filter(Boolean).length * 20;
      setMl(val);
    }
  };

  const toggleSkillExpand = (skill: string) => {
    setExpandedSkills(prev => ({
      ...prev,
      [skill]: !prev[skill]
    }));
  };

  // SECTION 4: Skill Experience Pings
  const [builtProjects, setBuiltProjects] = useState<boolean>(data.experience_built_projects || false);
  const [usedGit, setUsedGit] = useState<boolean>(data.experience_used_git || false);

  // SECTION 5: Career Goals (Multi-select)
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.career_goals || ["AI Engineer"]);

  // SECTION 6: Time Pacing & Commitment
  const [availability, setAvailability] = useState<number>(data.time_availability_mins || 60);

  // SECTION 7: Learning Styles
  const [learningPreference, setLearningPreference] = useState<string>(data.learning_style || "project-based");

  // SECTION 8: Deploy & Practical Experience
  const [hackathons, setHackathons] = useState<boolean>(data.experience_hackathons || false);
  const [deployed, setDeployed] = useState<boolean>(data.experience_deployed || false);
  const [apis, setApis] = useState<boolean>(data.experience_apis || false);
  const [workedAi, setWorkedAi] = useState<boolean>(data.experience_worked_ai || false);

  // SECTION 9: Core Interest Areas (Multi-select)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(data.interest_areas || ["AI Agents"]);

  // Staggered triggers for the neural loading screen (Step 10)
  useEffect(() => {
    if (step === 10 && !onboardedResult) {
      const texts = [
        "Analyzing skill percentage metrics...",
        "Detecting cognitive roadmap gaps...",
        "Connecting semantic vectors in Qdrant...",
        "Deploying custom relational models...",
        "Compiling personalized learning roadmap...",
        "Preparing custom AI mentor personality...",
        "Finalizing developer sandbox maps..."
      ];
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < texts.length) {
          setAnalysisText(texts[index]);
          setAnalysisProgress((prev) => Math.min(prev + 14, 98));
          index++;
        }
      }, 700);

      return () => clearInterval(interval);
    }
  }, [step, onboardedResult]);

  const handleNext = () => {
    // Stage data parameters locally in parent state
    setData((prev: any) => ({
      ...prev,
      full_name: fullName,
      college_name: collegeName,
      branch_degree: branchDegree,
      graduation_year: Number(graduationYear),
      bio: bio,
      github_link: githubLink,
      linkedin_link: linkedinLink,
      python_level: python,
      web_level: web,
      dsa_level: dsa,
      ml_level: ml,
      experience_built_projects: builtProjects,
      experience_used_git: usedGit,
      career_goals: selectedGoals,
      time_availability_mins: availability,
      learning_style: learningPreference,
      experience_hackathons: hackathons,
      experience_deployed: deployed,
      experience_apis: apis,
      experience_worked_ai: workedAi,
      interest_areas: selectedInterests,
    }));
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const triggerOnboardAPI = async () => {
    setSubmitting(true);
    const finalPayload = {
      full_name: fullName || user?.displayName || "Developer",
      college_name: collegeName || null,
      branch_degree: branchDegree || null,
      graduation_year: graduationYear ? Number(graduationYear) : null,
      bio: bio || null,
      github_link: githubLink || null,
      linkedin_link: linkedinLink || null,
      python_level: Number(python),
      javascript_level: 20, // default placeholder JS score
      dsa_level: Number(dsa),
      ml_level: Number(ml),
      dl_level: 10,
      genai_level: 10,
      web_level: Number(web),
      backend_level: 10,
      devops_level: 10,
      agents_level: 5,
      rag_level: 5,
      experience_built_projects: builtProjects,
      experience_used_git: usedGit,
      career_goals: selectedGoals,
      learning_style: learningPreference,
      time_availability_mins: Number(availability),
      experience_hackathons: hackathons,
      experience_deployed: deployed,
      experience_apis: apis,
      experience_worked_ai: workedAi,
      interest_areas: selectedInterests,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/profile/onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.uid}`,
        },
        body: JSON.stringify(finalPayload),
      });

      if (res.ok) {
        // Fetch fresh profile data to render dynamic summary on success screen
        const freshProfile = await fetch(`${API_BASE_URL}/api/v1/profile/me`, {
          headers: { Authorization: `Bearer ${user?.uid}` }
        });
        if (freshProfile.ok) {
          const freshData = await freshProfile.json();
          setOnboardedResult(freshData);
          setAnalysisProgress(100);
        } else {
          close();
        }
      } else {
        throw new Error("Failed to onboard profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating learning profile. Please verify your backend is running.");
      setSubmitting(false);
      setStep(9);
    }
  };

  useEffect(() => {
    if (step === 10 && !submitting && !onboardedResult) {
      triggerOnboardAPI();
    }
  }, [step]);

  // Derive qualitative tiers for assessment indicators
  const getSkillTier = (score: number) => {
    if (score <= 30) return { label: "Beginner", style: "border-slate-500/25 bg-slate-500/10 text-slate-400" };
    if (score <= 70) return { label: "Intermediate", style: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" };
    return { label: "Advanced", style: "border-[var(--secondary)] bg-[var(--secondary-soft)] text-[var(--secondary)] font-bold shadow-[var(--shadow-glow)] animate-pulse" };
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-scale-in">
      {/* Frosted premium theme-aware dialog card */}
      <div className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl relative overflow-hidden text-[var(--text-primary)]">
        
        {/* Glowing Decorative Spotlights */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--accent-glow)] rounded-full blur-[100px] pointer-events-none opacity-60"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--accent-glow)] rounded-full blur-[100px] pointer-events-none opacity-40"></div>

        {/* Step Progress indicators */}
        {step < 10 && (
          <div className="flex items-center justify-between mb-8 animate-fade-down">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
              Developer Calibration • Step {step} of 9
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-5 rounded-full transition-all duration-300 ${
                    step >= s ? "bg-[var(--accent)] shadow-[var(--shadow-glow)]" : "bg-[var(--bg-secondary)] border border-[var(--border)]"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 1: WELCOME SCREEN */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-up text-center py-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[var(--accent)] to-[var(--secondary)] flex items-center justify-center font-black text-4xl text-white mx-auto shadow-lg animate-float">
              Ω
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
                Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)]">AI Engineer OS</span>
              </h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                Become an AI Systems Engineer through building real, containerized autonomous workspaces. Calibrate your developer credentials to customize your cognitive roadmap.
              </p>
            </div>

            <button
              onClick={handleNext}
              className="btn-accent uppercase py-4 px-8 tracking-wider active:scale-98 cursor-pointer mt-4"
            >
              Start Your Journey 🚀
            </button>
          </div>
        )}

        {/* SECTION 2: BASIC INFORMATION */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Basic Credentials</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your details to generate your verified AIOS identity badge.
              </p>
            </div>

            <div className="space-y-4 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Anirudh"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl px-4 py-3 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">College / University</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl px-4 py-3 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Branch / Degree</label>
                  <input
                    type="text"
                    value={branchDegree}
                    onChange={(e) => setBranchDegree(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl px-4 py-3 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Expected Graduation Year</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    placeholder="2027"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl px-4 py-3 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="E.g. Building micro-agents and vector searches..."
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl p-4 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-400 font-bold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!fullName.trim()}
                className="flex-1 btn-accent py-3 cursor-pointer uppercase disabled:opacity-40"
              >
                Skill Calibration →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: SKILL ASSESSMENT */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Core Skills Profile</h2>
              <p className="text-xs text-slate-500 mt-1">
                Calibrate your levels in key technical domains. Expand each item to view and select specific competency topics.
              </p>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              
              {/* Python */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 transition-all duration-200">
                <div 
                  className="flex justify-between items-center cursor-pointer select-none"
                  onClick={() => toggleSkillExpand("python")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-900">Python Ecosystem</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {expandedSkills.python ? "▲ Collapse" : "▼ Expand Topics"}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] ${getSkillTier(python).style}`}>
                    {python}% — {getSkillTier(python).label}
                  </span>
                </div>
                
                <div className="mt-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="20"
                    value={python}
                    onChange={(e) => handleSliderChange("python", Number(e.target.value))}
                    className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)]"
                  />
                </div>

                {expandedSkills.python && (
                  <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2 animate-fadeIn">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Acquired Competencies:</p>
                    {SKILL_TOPICS.python.map((topic, idx) => (
                      <label key={idx} className="flex items-start gap-2.5 text-[12px] text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={pythonChecked[idx] || false}
                          onChange={() => handleCheckboxChange("python", idx)}
                          className="w-3.5 h-3.5 mt-0.5 accent-[var(--accent)] rounded border-[var(--border)] bg-white cursor-pointer"
                        />
                        <span>{topic}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Web Dev */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 transition-all duration-200">
                <div 
                  className="flex justify-between items-center cursor-pointer select-none"
                  onClick={() => toggleSkillExpand("web")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-900">Full Stack Web</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {expandedSkills.web ? "▲ Collapse" : "▼ Expand Topics"}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] ${getSkillTier(web).style}`}>
                    {web}% — {getSkillTier(web).label}
                  </span>
                </div>
                
                <div className="mt-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="20"
                    value={web}
                    onChange={(e) => handleSliderChange("web", Number(e.target.value))}
                    className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)]"
                  />
                </div>

                {expandedSkills.web && (
                  <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2 animate-fadeIn">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Acquired Competencies:</p>
                    {SKILL_TOPICS.web.map((topic, idx) => (
                      <label key={idx} className="flex items-start gap-2.5 text-[12px] text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={webChecked[idx] || false}
                          onChange={() => handleCheckboxChange("web", idx)}
                          className="w-3.5 h-3.5 mt-0.5 accent-[var(--accent)] rounded border-[var(--border)] bg-white cursor-pointer"
                        />
                        <span>{topic}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* DSA */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 transition-all duration-200">
                <div 
                  className="flex justify-between items-center cursor-pointer select-none"
                  onClick={() => toggleSkillExpand("dsa")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-900">Algorithms & Data Structures</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {expandedSkills.dsa ? "▲ Collapse" : "▼ Expand Topics"}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] ${getSkillTier(dsa).style}`}>
                    {dsa}% — {getSkillTier(dsa).label}
                  </span>
                </div>
                
                <div className="mt-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="20"
                    value={dsa}
                    onChange={(e) => handleSliderChange("dsa", Number(e.target.value))}
                    className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)]"
                  />
                </div>

                {expandedSkills.dsa && (
                  <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2 animate-fadeIn">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Acquired Competencies:</p>
                    {SKILL_TOPICS.dsa.map((topic, idx) => (
                      <label key={idx} className="flex items-start gap-2.5 text-[12px] text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={dsaChecked[idx] || false}
                          onChange={() => handleCheckboxChange("dsa", idx)}
                          className="w-3.5 h-3.5 mt-0.5 accent-[var(--accent)] rounded border-[var(--border)] bg-white cursor-pointer"
                        />
                        <span>{topic}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* ML */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 transition-all duration-200">
                <div 
                  className="flex justify-between items-center cursor-pointer select-none"
                  onClick={() => toggleSkillExpand("ml")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-900">Machine Learning Foundations</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {expandedSkills.ml ? "▲ Collapse" : "▼ Expand Topics"}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] ${getSkillTier(ml).style}`}>
                    {ml}% — {getSkillTier(ml).label}
                  </span>
                </div>
                
                <div className="mt-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="20"
                    value={ml}
                    onChange={(e) => handleSliderChange("ml", Number(e.target.value))}
                    className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)]"
                  />
                </div>

                {expandedSkills.ml && (
                  <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2 animate-fadeIn">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Acquired Competencies:</p>
                    {SKILL_TOPICS.ml.map((topic, idx) => (
                      <label key={idx} className="flex items-start gap-2.5 text-[12px] text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={mlChecked[idx] || false}
                          onChange={() => handleCheckboxChange("ml", idx)}
                          className="w-3.5 h-3.5 mt-0.5 accent-[var(--accent)] rounded border-[var(--border)] bg-white cursor-pointer"
                        />
                        <span>{topic}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-400 font-bold text-xs cursor-pointer text-slate-700"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 btn-accent py-3 cursor-pointer uppercase font-bold text-xs"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 4: SKILL EXPERIENCE QUESTIONS */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Engineering Background</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select all parameters that apply to your background to configure your initial project templates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Projects Card */}
              <button
                onClick={() => setBuiltProjects(!builtProjects)}
                className={`p-6 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                  builtProjects
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-sm"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-700"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                  PROJ
                </div>
                <div className="mt-4">
                  <h4 className="text-[13px] font-bold font-sans">I have built software projects before</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">Select if you have written programs or scripts outside of coursework.</p>
                </div>
              </button>

              {/* Git Card */}
              <button
                onClick={() => setUsedGit(!usedGit)}
                className={`p-6 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                  usedGit
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-sm"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-700"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                  GIT
                </div>
                <div className="mt-4">
                  <h4 className="text-[13px] font-bold font-sans">I have used Git & GitHub in production</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">Pre-configures team collaboration and repository sync modules.</p>
                </div>
              </button>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-400 font-bold text-xs cursor-pointer text-slate-700"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 btn-accent py-3 cursor-pointer uppercase font-bold text-xs"
              >
                Configure Career Goals →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 5: CAREER GOALS */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Career Directions</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your target career paths to dynamically configure your learning syllabus.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {[
                { title: "AI Engineer" },
                { title: "ML Engineer" },
                { title: "GenAI Engineer" },
                { title: "Software Engineer" },
                { title: "Placement Preparation" },
                { title: "Freelancer" },
                { title: "Startup Founder" },
                { title: "Hackathon Builder" },
              ].map((goal) => {
                const isSelected = selectedGoals.includes(goal.title);
                return (
                  <button
                    key={goal.title}
                    onClick={() => toggleGoal(goal.title)}
                    className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 h-20 ${
                      isSelected
                        ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] font-bold shadow-sm"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-600"
                    }`}
                  >
                    <span className="text-[12px] font-sans font-bold leading-tight">{goal.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-400 font-bold text-xs cursor-pointer text-slate-700"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={selectedGoals.length === 0}
                className="flex-1 btn-accent py-3 cursor-pointer uppercase disabled:opacity-40 font-bold text-xs"
              >
                Availability Setup →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 6: TIME AVAILABILITY */}
        {step === 6 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Commitment Level</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your daily time allocation to adjust the speed and density of your training roadmap.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: "30 Mins / Day", value: 30, desc: "Sprint (micro sessions)" },
                { title: "1 Hr / Day", value: 60, desc: "Standard (steady, balanced pace)" },
                { title: "2 Hrs / Day", value: 120, desc: "Aggressive (intensive study)" },
                { title: "4+ Hrs / Day", value: 240, desc: "Immersion (bootcamp mode)" },
                { title: "Weekends Only", value: 90, desc: "Weekend Focus (extended sessions)" },
              ].map((time) => {
                const isSelected = availability === time.value;
                return (
                  <button
                    key={time.title}
                    onClick={() => setAvailability(time.value)}
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                      isSelected
                        ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-sm"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-700"
                    }`}
                  >
                    <div>
                      <h4 className="text-[13px] font-bold font-sans">{time.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">{time.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-400 font-bold text-xs cursor-pointer text-slate-700"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 btn-accent py-3 cursor-pointer uppercase font-bold text-xs"
              >
                Select Study Format →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 7: LEARNING STYLE */}
        {step === 7 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Preferred Learning Format</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select how you study best to adapt your learning resources.
              </p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {[
                { type: "video", title: "Video Tutorials & Lectures", desc: "Watch video tutorials and experts coding directly.", label: "VIDEO" },
                { type: "project-based", title: "Project-Based Builds", desc: "Construct actual microservices and API gateways from scratch.", label: "PROJ" },
                { type: "hands-on", title: "Interactive Coding Sandbox", desc: "Execute code cells directly in real-time online workspaces.", label: "CODE" },
                { type: "reading", title: "Technical Docs & Case Manuals", desc: "Review structural specifications and architectural models.", label: "DOCS" },
                { type: "quizzes", title: "Knowledge Check Quizzes", desc: "Validate concepts through multichoice assessments.", label: "QUIZ" },
              ].map((style) => {
                const isSelected = learningPreference === style.type;
                return (
                  <button
                    key={style.type}
                    onClick={() => setLearningPreference(style.type)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-sm"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-700"
                    }`}
                  >
                    <span className="text-[11px] font-bold p-2 w-12 text-center rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">{style.label}</span>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold leading-tight font-sans">{style.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{style.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] mr-2 flex-shrink-0"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-400 font-bold text-xs cursor-pointer text-slate-700"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 btn-accent py-3 cursor-pointer uppercase font-bold text-xs"
              >
                API & Deploy Background →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 8: EXPERIENCE LEVEL */}
        {step === 8 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Deployment & Integration Experience</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your experience with cloud services and integration patterns.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Hackathons */}
              <button
                onClick={() => setHackathons(!hackathons)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                  hackathons
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-sm"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-700"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">HACK</div>
                <div>
                  <h4 className="text-xs font-bold font-sans">Hackathons</h4>
                  <p className="text-[9px] text-slate-400 mt-1">Participated in team building hackathons.</p>
                </div>
              </button>

              {/* Deployed */}
              <button
                onClick={() => setDeployed(!deployed)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                  deployed
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-sm"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-700"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">DEPL</div>
                <div>
                  <h4 className="text-xs font-bold font-sans">Online Deployments</h4>
                  <p className="text-[9px] text-slate-400 mt-1">Deployed web applications or services online.</p>
                </div>
              </button>

              {/* APIs */}
              <button
                onClick={() => setApis(!apis)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                  apis
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-sm"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-700"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">API</div>
                <div>
                  <h4 className="text-xs font-bold font-sans">Used External APIs</h4>
                  <p className="text-[9px] text-slate-400 mt-1">Worked with Stripe, Firebase, or other web APIs.</p>
                </div>
              </button>

              {/* AI Systems */}
              <button
                onClick={() => setWorkedAi(!workedAi)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                  workedAi
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-sm"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-700"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">AI</div>
                <div>
                  <h4 className="text-xs font-bold font-sans">Worked with AI</h4>
                  <p className="text-[9px] text-slate-400 mt-1">Integrated prompt chains or custom LLM frameworks.</p>
                </div>
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-400 font-bold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 btn-accent py-3 cursor-pointer uppercase"
              >
                Select Engineering Interests →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 9: INTEREST AREAS */}
        {step === 9 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Engineering Focus Interests</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your engineering domains of interest to customize project modules.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                "AI Agents",
                "Computer Vision",
                "NLP",
                "RAG Systems",
                "AI SaaS",
                "Cybersecurity AI",
                "Automation",
                "MLOps",
              ].map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`p-4 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                      isSelected
                        ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] shadow-sm"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-600"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-400 font-bold text-xs cursor-pointer text-slate-700"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 btn-accent py-3 cursor-pointer uppercase font-bold text-xs"
              >
                Save and Complete Assessment
              </button>
            </div>
          </div>
        )}

        {/* SECTION 10: AI CALIBRATION LOADING SCREEN & SUCCESS REPORT */}
        {step === 10 && (
          <div className="py-6 text-center space-y-8 animate-fade-up">
            
            {!onboardedResult ? (
              // Stage 1: Calibration Loader
              <div className="space-y-8">
                {/* Immersive pulsing loading sphere */}
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-[var(--accent)] opacity-20 animate-ping"></div>
                  <div className="absolute inset-4 rounded-full border border-[var(--secondary)] opacity-20 animate-pulse"></div>
                  <div className="absolute inset-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <span className="text-[14px] font-black tracking-widest text-slate-400">AIOS</span>
                  </div>
                  <div className="absolute top-2 left-6 w-4 h-4 rounded-full bg-[var(--accent)] opacity-80 animate-pulse"></div>
                  <div className="absolute bottom-4 left-10 w-3 h-3 rounded-full bg-[var(--secondary)] opacity-60 animate-ping"></div>
                  <div className="absolute top-10 right-4 w-3.5 h-3.5 rounded-full bg-[var(--accent)] opacity-80 animate-pulse"></div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 animate-pulse">
                    Analyzing Technical Profile
                  </h3>
                  <p className="text-xs text-slate-400 font-mono tracking-wide max-w-sm mx-auto leading-relaxed h-12 flex items-center justify-center">
                    {analysisText}
                  </p>
                </div>

                {/* Glowing loader */}
                <div className="w-full max-w-md mx-auto bg-[var(--bg-secondary)] border border-[var(--border)] h-2 rounded-full overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] h-full rounded-full transition-all duration-300 shadow-[var(--shadow-glow)]"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                
                <p className="text-[10px] font-mono text-slate-500">
                  Generating custom dynamic roadmap nodes...
                </p>
              </div>
            ) : (
              // Stage 2: Calibration Success Overview
              <div className="space-y-6 animate-scale-in text-left">
                <div className="text-center space-y-2 pb-2">
                  <h3 className="text-2xl font-black text-slate-900">Profile Setup Complete</h3>
                  <p className="text-xs text-slate-500">Onboarding data synchronized with AIOS core database.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)]">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Account Information</h4>
                    <div className="space-y-1 text-xs text-slate-700">
                      <p><span className="font-semibold">Developer:</span> {onboardedResult.full_name}</p>
                      <p><span className="font-semibold">Syllabus Track:</span> {onboardedResult.career_goals.join(", ")}</p>
                      <p><span className="font-semibold">Allocation:</span> {onboardedResult.time_availability_mins} mins/day</p>
                      <p><span className="font-semibold">Preferred Style:</span> {onboardedResult.learning_style} learning</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Academics & Rewards</h4>
                    <div className="space-y-1 text-xs text-slate-700">
                      <p><span className="font-semibold">Academic Path:</span> {onboardedResult.college_name || "Self-taught"}</p>
                      <p><span className="font-semibold">Roadmap Stages:</span> {onboardedResult.roadmap?.length} tailored stages</p>
                      <p><span className="font-semibold">Intro Bonus:</span> +{onboardedResult.xp_points} XP awarded</p>
                      <p><span className="font-semibold">Daily Streak:</span> Active (Day 1)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs leading-relaxed text-emerald-800 font-semibold text-center">
                  Your customized learning roadmap, microservices sandboxes, and developer workspace are fully configured and unlocked!
                </div>

                <button
                  onClick={close}
                  className="w-full btn-accent uppercase py-4 px-6 tracking-wider font-bold text-xs active:scale-98 cursor-pointer mt-4"
                >
                  Enter Workspace
                </button>
              </div>
            )}
            
          </div>
        )}

      </div>
    </div>
  );
}
