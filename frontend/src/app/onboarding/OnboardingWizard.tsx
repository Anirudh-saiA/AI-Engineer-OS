"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface OnboardingWizardProps {
  step: number;
  data: any;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setData: React.Dispatch<React.SetStateAction<any>>;
  close: () => void;
}

export default function OnboardingWizard({
  step,
  data,
  setStep,
  setData,
  close,
}: OnboardingWizardProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [analysisText, setAnalysisText] = useState("Initializing cognitive maps...");
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
      const res = await fetch("http://localhost:8000/api/v1/profile/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.uid}`,
        },
        body: JSON.stringify(finalPayload),
      });

      if (res.ok) {
        // Fetch fresh profile data to render dynamic summary on success screen
        const freshProfile = await fetch("http://localhost:8000/api/v1/profile/me", {
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
              <h2 className="text-2xl font-extrabold tracking-tight">Core Skill Indices</h2>
              <p className="text-xs text-slate-400 mt-1">
                Calibrate your proficiency indicators. BADGES update dynamically as you drag.
              </p>
            </div>

            <div className="space-y-5 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)] max-h-[350px] overflow-y-auto">
              
              {/* Python */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold">🐍 Python Ecosystem</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] ${getSkillTier(python).style}`}>
                    {python}% — {getSkillTier(python).label}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={python}
                  onChange={(e) => setPython(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)]"
                />
              </div>

              {/* Web Dev */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold">🌐 Full Stack Web</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] ${getSkillTier(web).style}`}>
                    {web}% — {getSkillTier(web).label}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={web}
                  onChange={(e) => setWeb(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)]"
                />
              </div>

              {/* DSA */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold">📊 Algorithms & DSA</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] ${getSkillTier(dsa).style}`}>
                    {dsa}% — {getSkillTier(dsa).label}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={dsa}
                  onChange={(e) => setDsa(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)]"
                />
              </div>

              {/* ML */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold">🧠 Machine Learning Basics</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] ${getSkillTier(ml).style}`}>
                    {ml}% — {getSkillTier(ml).label}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ml}
                  onChange={(e) => setMl(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)]"
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
                className="flex-1 btn-accent py-3 cursor-pointer uppercase"
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
              <h2 className="text-2xl font-extrabold tracking-tight">Development Background</h2>
              <p className="text-xs text-slate-400 mt-1">
                Select your engineering background parameters. We use this to configure initial project templates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Projects Card */}
              <button
                onClick={() => setBuiltProjects(!builtProjects)}
                className={`p-6 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-40 ${
                  builtProjects
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)]"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400"
                }`}
              >
                <span className="text-3xl">🏗️</span>
                <div>
                  <h4 className="text-xs font-bold font-sans">I have built software projects before</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Select if you have written dynamic programs or scripts.</p>
                </div>
              </button>

              {/* Git Card */}
              <button
                onClick={() => setUsedGit(!usedGit)}
                className={`p-6 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-40 ${
                  usedGit
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)]"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400"
                }`}
              >
                <span className="text-3xl">🐙</span>
                <div>
                  <h4 className="text-xs font-bold font-sans">I have used Git & GitHub in production</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Pre-configures advanced repository sync nodes.</p>
                </div>
              </button>
            </div>

            <div className="flex gap-4 mt-6">
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
                Configure Career Goals →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 5: CAREER GOALS */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Career Directions</h2>
              <p className="text-xs text-slate-400 mt-1">
                What do you want to become? Roadmap and lessons branch dynamically based on selections.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {[
                { title: "AI Engineer", icon: "🤖" },
                { title: "ML Engineer", icon: "🧠" },
                { title: "GenAI Engineer", icon: "✨" },
                { title: "Software Engineer", icon: "💻" },
                { title: "Placement Preparation", icon: "💼" },
                { title: "Freelancer", icon: "✈️" },
                { title: "Startup Founder", icon: "🔥" },
                { title: "Hackathon Builder", icon: "🏆" },
              ].map((goal) => {
                const isSelected = selectedGoals.includes(goal.title);
                return (
                  <button
                    key={goal.title}
                    onClick={() => toggleGoal(goal.title)}
                    className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 h-28 ${
                      isSelected
                        ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)] text-[var(--accent)] font-bold"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-400"
                    }`}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="text-[10px] font-sans font-semibold leading-tight">{goal.title}</span>
                  </button>
                );
              })}
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
                disabled={selectedGoals.length === 0}
                className="flex-1 btn-accent py-3 cursor-pointer uppercase disabled:opacity-40"
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
              <h2 className="text-2xl font-extrabold tracking-tight">Time Pacing</h2>
              <p className="text-xs text-slate-400 mt-1">
                How much time can you commit daily? Directly controls roadmap pacing speed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: "30 Mins / Day", value: 30, desc: "Sprint (micro tasks, normal pace)" },
                { title: "1 Hr / Day", value: 60, desc: "Standard (steady, balanced pace)" },
                { title: "2 Hrs / Day", value: 120, desc: "Aggressive (deep learning, fast pace)" },
                { title: "4+ Hrs / Day", value: 240, desc: "Immersion (bootcamp mode, rapid paths)" },
                { title: "Weekends Only", value: 90, desc: "Compact (focused weekend pings)" },
              ].map((time) => {
                const isSelected = availability === time.value;
                return (
                  <button
                    key={time.title}
                    onClick={() => setAvailability(time.value)}
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 ${
                      isSelected
                        ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)]"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400"
                    }`}
                  >
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <h4 className="text-xs font-bold font-sans">{time.title}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 leading-tight">{time.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
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
                Select Learning Preference →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 7: LEARNING STYLE */}
        {step === 7 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Preferred Study Form</h2>
              <p className="text-xs text-slate-400 mt-1">
                How do you study best? Adapts sandbox resources dynamically.
              </p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {[
                { type: "video", title: "Video Tutorials & Lectures", desc: "Watch video tutorials and experts coding directly.", icon: "🎥" },
                { type: "project-based", title: "Project-Based Builds", desc: "Construct actual microservices and API gateways from scratch.", icon: "🏗️" },
                { type: "hands-on", title: "Interactive Coding Sandbox", desc: "Execute code cells directly in real-time online workspaces.", icon: "⌨️" },
                { type: "reading", title: "Technical Docs & Case Manuals", desc: "Review structural specifications and architectural models.", icon: "📚" },
                { type: "quizzes", title: "Knowledge Check Quizzes", desc: "Validate concepts through cyclical multichoice matrices.", icon: "🎯" },
              ].map((style) => {
                const isSelected = learningPreference === style.type;
                return (
                  <button
                    key={style.type}
                    onClick={() => setLearningPreference(style.type)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)]"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400"
                    }`}
                  >
                    <span className="text-3xl p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">{style.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold leading-tight font-sans">{style.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{style.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[var(--shadow-glow)] mr-2 flex-shrink-0"></span>
                    )}
                  </button>
                );
              })}
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
                API & Deploy Background →
              </button>
            </div>
          </div>
        )}

        {/* SECTION 8: EXPERIENCE LEVEL */}
        {step === 8 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Deploy & API Background</h2>
              <p className="text-xs text-slate-400 mt-1">
                Select other systems experience. Helps the AI calibrate your starting milestone badges.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Hackathons */}
              <button
                onClick={() => setHackathons(!hackathons)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 ${
                  hackathons
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)]"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400"
                }`}
              >
                <span className="text-2xl">🏆</span>
                <div>
                  <h4 className="text-xs font-bold font-sans">Hackathons</h4>
                  <p className="text-[9px] text-slate-400 mt-1">Participated in hackathons before.</p>
                </div>
              </button>

              {/* Deployed */}
              <button
                onClick={() => setDeployed(!deployed)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 ${
                  deployed
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)]"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400"
                }`}
              >
                <span className="text-2xl">🚀</span>
                <div>
                  <h4 className="text-xs font-bold font-sans">Online Deployments</h4>
                  <p className="text-[9px] text-slate-400 mt-1">Deployed live API clients online.</p>
                </div>
              </button>

              {/* APIs */}
              <button
                onClick={() => setApis(!apis)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 ${
                  apis
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)]"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400"
                }`}
              >
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="text-xs font-bold font-sans">Used External APIs</h4>
                  <p className="text-[9px] text-slate-400 mt-1">Worked with Stripe, Firebase, or LLM APIs.</p>
                </div>
              </button>

              {/* AI Systems */}
              <button
                onClick={() => setWorkedAi(!workedAi)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 ${
                  workedAi
                    ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)]"
                    : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400"
                }`}
              >
                <span className="text-2xl">🤖</span>
                <div>
                  <h4 className="text-xs font-bold font-sans">Worked with AI</h4>
                  <p className="text-[9px] text-slate-400 mt-1">Integrated prompt chains or ml models before.</p>
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
              <h2 className="text-2xl font-extrabold tracking-tight">Engineering Focus Interests</h2>
              <p className="text-xs text-slate-400 mt-1">
                Select your interest modules. These direct your dynamic sandbox project recommendations!
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
                        ? "bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] shadow-[var(--shadow-glow)]"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-400"
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
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-400 font-bold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 btn-accent py-3 cursor-pointer uppercase"
              >
                Compile Neural Calibration! 🧠⚡
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
                {/* Immersive pulsing cerebral sphere */}
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-[var(--accent)] opacity-20 animate-ping"></div>
                  <div className="absolute inset-4 rounded-full border border-[var(--secondary)] opacity-20 animate-pulse"></div>
                  <div className="absolute inset-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <span className="text-4xl animate-bounce">🧠</span>
                  </div>
                  <div className="absolute top-2 left-6 w-4 h-4 rounded-full bg-[var(--accent)] shadow-[var(--shadow-glow)] animate-pulse"></div>
                  <div className="absolute bottom-4 left-10 w-3 h-3 rounded-full bg-[var(--secondary)] opacity-60 animate-ping"></div>
                  <div className="absolute top-10 right-4 w-3.5 h-3.5 rounded-full bg-[var(--accent)] opacity-80 animate-pulse"></div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-black animate-pulse">
                    AI Cognitive Calibration Active
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
                  <span className="text-5xl block animate-bounce">🏆</span>
                  <h3 className="text-2xl font-black">Calibration Successful!</h3>
                  <p className="text-xs text-slate-400">Onboarding data synced with AIOS database core.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)]">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">AI Memory Calibrated</h4>
                    <div className="space-y-1 text-xs">
                      <p>👤 **Developer**: {onboardedResult.full_name}</p>
                      <p>⚡ **Track**: {onboardedResult.career_goals.join(", ")}</p>
                      <p>⏱️ **Commitment**: {onboardedResult.time_availability_mins} mins/day</p>
                      <p>✨ **Style**: {onboardedResult.learning_style} learning</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Cognitive Maps & Rewards</h4>
                    <div className="space-y-1 text-xs">
                      <p>🧠 **Mentor Personality**: {onboardedResult.bio?.split("[AI Mentor Personality: ")?.[1]?.replace("]", "") || "Pragmatic Architect"}</p>
                      <p>📈 **Roadmap Size**: {onboardedResult.roadmap?.length} tailored stages</p>
                      <p>🎁 **Calibration Bonus**: +{onboardedResult.xp_points} XP awarded</p>
                      <p>🔥 **Daily Streak**: Active (Day 1)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--accent-soft)] border border-[var(--accent)] rounded-2xl p-4 text-xs leading-relaxed text-[var(--accent)] font-semibold text-center">
                  🚀 Your learning roadmap, microservices sandboxes, and AI mentor workspace are fully configured and unlocked!
                </div>

                <button
                  onClick={close}
                  className="w-full btn-accent uppercase py-4 px-6 tracking-wider active:scale-98 cursor-pointer mt-4"
                >
                  Enter Workspace 🌌
                </button>
              </div>
            )}
            
          </div>
        )}

      </div>
    </div>
  );
}
