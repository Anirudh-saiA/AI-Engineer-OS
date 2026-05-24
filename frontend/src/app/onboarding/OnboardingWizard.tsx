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
  const [analysisText, setAnalysisText] = useState("Initializing neural analyzer...");
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // local state for forms
  const [fullName, setFullName] = useState(data.full_name || user?.displayName || "");
  const [collegeName, setCollegeName] = useState(data.college_name || "");
  const [branchDegree, setBranchDegree] = useState(data.branch_degree || "");
  const [graduationYear, setGraduationYear] = useState<number>(data.graduation_year || 2027);
  const [bio, setBio] = useState(data.bio || "Passionate software engineer building next-gen systems.");
  const [githubLink, setGithubLink] = useState(data.github_link || "");
  const [linkedinLink, setLinkedinLink] = useState(data.linkedin_link || "");

  // local state for skill levels (0 - 100)
  const [python, setPython] = useState<number>(data.python_level || 30);
  const [javascript, setJavascript] = useState<number>(data.javascript_level || 30);
  const [dsa, setDsa] = useState<number>(data.dsa_level || 20);
  const [ml, setMl] = useState<number>(data.ml_level || 10);
  const [dl, setDl] = useState<number>(data.dl_level || 10);
  const [genai, setGenai] = useState<number>(data.genai_level || 10);
  const [web, setWeb] = useState<number>(data.web_level || 25);
  const [backend, setBackend] = useState<number>(data.backend_level || 20);
  const [devops, setDevops] = useState<number>(data.devops_level || 10);
  const [agents, setAgents] = useState<number>(data.agents_level || 5);
  const [rag, setRag] = useState<number>(data.rag_level || 5);

  // local state for career goals (multi-select)
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.career_goals || ["AI Engineer"]);

  // local state for availability (mins per day)
  const [availability, setAvailability] = useState<number>(data.time_availability_mins || 60);

  // local state for learning preference
  const [learningPreference, setLearningPreference] = useState<string>(data.learning_style || "project-based");

  // Cycle through analyze canvas texts
  useEffect(() => {
    if (step === 6) {
      const texts = [
        "Connecting semantic vectors...",
        "Evaluating core coding indicators...",
        "Structuring custom learning target pipelines...",
        "Calibrating Qdrant indexing profiles...",
        "Generating optimized learning roadmaps...",
        "Deploying custom cognitive nodes...",
        "Finalizing profile data layers..."
      ];
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < texts.length) {
          setAnalysisText(texts[index]);
          setAnalysisProgress((prev) => Math.min(prev + 14, 100));
          index++;
        }
      }, 700);

      return () => clearInterval(interval);
    }
  }, [step]);

  const handleNext = () => {
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
      javascript_level: javascript,
      dsa_level: dsa,
      ml_level: ml,
      dl_level: dl,
      genai_level: genai,
      web_level: web,
      backend_level: backend,
      devops_level: devops,
      agents_level: agents,
      rag_level: rag,
      career_goals: selectedGoals,
      time_availability_mins: availability,
      learning_style: learningPreference,
    }));
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
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
      javascript_level: Number(javascript),
      dsa_level: Number(dsa),
      ml_level: Number(ml),
      dl_level: Number(dl),
      genai_level: Number(genai),
      web_level: Number(web),
      backend_level: Number(backend),
      devops_level: Number(devops),
      agents_level: Number(agents),
      rag_level: Number(rag),
      career_goals: selectedGoals,
      learning_style: learningPreference,
      time_availability_mins: Number(availability),
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
        setTimeout(() => {
          setSubmitting(false);
          close();
        }, 1200);
      } else {
        throw new Error("Failed to onboard profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating learning profile. Please verify your backend is running.");
      setSubmitting(false);
      setStep(5);
    }
  };

  useEffect(() => {
    if (step === 6 && !submitting) {
      triggerOnboardAPI();
    }
  }, [step]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-scale-in">
      {/* Frosted premium theme-aware dialog card */}
      <div className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl relative overflow-hidden text-[var(--text-primary)]">
        
        {/* Glowing Decorative Background Spotlights */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--accent-glow)] rounded-full blur-[100px] pointer-events-none opacity-60"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--accent-glow)] rounded-full blur-[100px] pointer-events-none opacity-40"></div>

        {/* Step Progress indicators */}
        {step < 6 && (
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
              Developer Calibration • Stage {step} of 5
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    step >= s ? "bg-[var(--accent)] shadow-[var(--shadow-glow)]" : "bg-[var(--bg-secondary)] border border-[var(--border)]"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 1: WELCOME SCREEN */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--accent)] to-[var(--secondary)] flex items-center justify-center font-black text-3xl text-white mx-auto shadow-md animate-float">
                Ω
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                Calibrate Your <span className="text-[var(--accent)]">AI Engineer</span> Identity
              </h2>
              <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                Welcome to AI-Engineer-OS. Personalize your cognitive systems profile to build customized developer tracks.
              </p>
            </div>

            <div className="space-y-4 mt-6 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)]">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide border-b border-[var(--border)] pb-2">
                Developer Profile Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Anirudh"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">College / University</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Branch / Degree</label>
                  <input
                    type="text"
                    value={branchDegree}
                    onChange={(e) => setBranchDegree(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Graduation Year</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    placeholder="e.g. 2027"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-400 uppercase">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Tell us about your learning journey..."
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">GitHub Profile URL</label>
                  <input
                    type="text"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl px-4 py-2.5 text-xs font-mono text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={linkedinLink}
                    onChange={(e) => setLinkedinLink(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none rounded-xl px-4 py-2.5 text-xs font-mono text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={!fullName.trim()}
              className="w-full py-4 px-6 mt-6 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase"
            >
              Start Calibration
              <span>🚀</span>
            </button>
          </div>
        )}

        {/* SCREEN 2: SKILL ASSESSMENT */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-xl font-bold">Rate Your Active Developer Skills</h2>
              <p className="text-xs text-slate-400 mt-1">
                Drag the sliders to score your baseline proficiency. This builds your vector heatmap indices.
              </p>
            </div>

            <div className="space-y-5 bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)] max-h-[350px] overflow-y-auto">
              
              {/* Python */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold">🐍 Python Ecosystem</span>
                  <span className="text-[var(--accent)] font-bold">{python}%</span>
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

              {/* JS */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold">💻 JavaScript / TypeScript</span>
                  <span className="text-[var(--accent)] font-bold">{javascript}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={javascript}
                  onChange={(e) => setJavascript(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)]"
                />
              </div>

              {/* DSA */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold">📊 Algorithms & DSA Structure</span>
                  <span className="text-[var(--accent)] font-bold">{dsa}%</span>
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

              {/* Web */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold">🌐 Full Stack Architectures</span>
                  <span className="text-[var(--accent)] font-bold">{web}%</span>
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

              {/* ML */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold">🧠 Machine Learning & Data Models</span>
                  <span className="text-[var(--accent)] font-bold">{ml}%</span>
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

              {/* GenAI */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold">✨ Large Language Models & GenAI</span>
                  <span className="text-[var(--accent)] font-bold">{genai}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={genai}
                  onChange={(e) => setGenai(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)]"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent)] font-bold text-xs tracking-wide transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase"
              >
                Next Step
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: CAREER GOALS */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-xl font-bold">Select Active Learning Goals</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose the development tracks you wish to target. We use these to map your progress milestones.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "AI Engineer", icon: "🤖", desc: "Stateful agents, RAG indexing, and semantic models." },
                { title: "ML Engineer", icon: "🧠", desc: "Design neural nets and deploy inference servers." },
                { title: "Placement Prep", icon: "💼", desc: "Master algorithms, DSA structures, and system design." },
                { title: "Hackathons", icon: "🏆", desc: "Build modular fast-prototype APIs and dynamic clients." },
                { title: "Freelancing", icon: "✈️", desc: "Acquire end-to-end full stack development pipelines." },
                { title: "Startup", icon: "🔥", desc: "Scale backend containers and transaction layers." },
              ].map((goal) => {
                const isSelected = selectedGoals.includes(goal.title);
                return (
                  <button
                    key={goal.title}
                    onClick={() => toggleGoal(goal.title)}
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between h-36 ${
                      isSelected
                        ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)] text-[var(--text-primary)]"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-400"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-3xl">{goal.icon}</span>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[var(--shadow-glow)]"></span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-sans tracking-wide leading-tight text-[var(--text-primary)]">{goal.title}</h4>
                      <p className="text-[9px] text-slate-400 leading-normal mt-1.5">{goal.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent)] font-bold text-xs tracking-wide transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={selectedGoals.length === 0}
                className="flex-1 py-3 px-6 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase"
              >
                Continue
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: DAILY AVAILABILITY */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-xl font-bold">Daily Focus Commitment</h2>
              <p className="text-xs text-slate-400 mt-1">
                Calibrate your daily time commitment. This sets streak targets and unlocks badges!
              </p>
            </div>

            <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border)] text-center space-y-6">
              
              <div className="w-20 h-20 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)] flex items-center justify-center mx-auto text-4xl shadow-sm animate-bounce">
                ⏱️
              </div>

              <div className="space-y-2">
                <h3 className="text-4xl font-extrabold text-[var(--accent)]">
                  {availability >= 180 ? `${(availability / 60).toFixed(0)} Hours` : `${availability} Minutes`}
                </h3>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider">
                  {availability <= 30 && "⚡ Sprint Mode (Consistent & fast)"}
                  {availability > 30 && availability <= 60 && "🚀 Normal Developer Load"}
                  {availability > 60 && availability <= 120 && "🔥 Active Career Builder"}
                  {availability > 120 && "🪐 Full Immersion Sandbox"}
                </p>
              </div>

              <input
                type="range"
                min="30"
                max="480"
                step="30"
                value={availability}
                onChange={(e) => setAvailability(Number(e.target.value))}
                className="w-full accent-[var(--accent)] bg-[var(--bg-card)] cursor-pointer h-1.5 rounded-lg appearance-none border border-[var(--border)] mt-4"
              />

              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>30 Min (Casual)</span>
                <span>2 Hours (Committed)</span>
                <span>8 Hours (Bootcamp)</span>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent)] font-bold text-xs tracking-wide transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase"
              >
                Select Learning Preference
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: LEARNING PREFERENCES */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="text-xl font-bold">Your Learning Style</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose the educational format you engage with best. This adjusts system content modules.
              </p>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {[
                { type: "project-based", title: "Project-Based Builds", desc: "Learn by committing code, initializing schemas, and assembling full applications.", icon: "🏗️" },
                { type: "video", title: "Interactive Video Lectures", desc: "Watch experts construct modules from scratch with detailed step-by-step guidance.", icon: "🎥" },
                { type: "hands-on", title: "Hands-on Sandbox Coding", desc: "Write files directly inside the online workspace with instant console feedback loops.", icon: "⌨️" },
                { type: "reading", title: "Technical Docs & Case Studies", desc: "Review structural specifications, system designs, and code manuals.", icon: "📚" },
                { type: "quizzes", title: "Cognitive Knowledge Quizzes", desc: "Validate concepts through fast-paced multi-choice evaluation maps.", icon: "🎯" },
              ].map((style) => {
                const isSelected = learningPreference === style.type;
                return (
                  <button
                    key={style.type}
                    onClick={() => setLearningPreference(style.type)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? "bg-[var(--bg-secondary)] border-[var(--accent)] shadow-[var(--shadow-glow)] text-[var(--text-primary)]"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-slate-400 text-slate-400"
                    }`}
                  >
                    <span className="text-3xl p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold leading-tight text-[var(--text-primary)]">{style.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{style.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[var(--shadow-glow)] mr-2 flex-shrink-0"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent)] font-bold text-xs tracking-wide transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs tracking-wider transition-all border border-[var(--accent)] cursor-pointer shadow-lg flex items-center justify-center gap-2 uppercase"
              >
                Compile Roadmap!
                <span>⚡</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 6: MAGICAL AI ANALYZING CANVAS */}
        {step === 6 && (
          <div className="py-10 text-center space-y-8 animate-fade-up">
            
            {/* Immersive Pulsing Dynamic Node Canvas */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-[var(--accent)] opacity-20 animate-ping"></div>
              {/* Secondary pulsing ring */}
              <div className="absolute inset-4 rounded-full border border-[var(--secondary)] opacity-20 animate-pulse"></div>
              {/* Middle grid */}
              <div className="absolute inset-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] backdrop-blur-sm flex items-center justify-center shadow-inner">
                <span className="text-4xl animate-bounce">🧠</span>
              </div>

              {/* Pulsing floating satellite nodes */}
              <div className="absolute top-2 left-6 w-4 h-4 rounded-full bg-[var(--accent)] shadow-[var(--shadow-glow)] animate-pulse"></div>
              <div className="absolute bottom-4 left-10 w-3 h-3 rounded-full bg-[var(--secondary)] opacity-60 animate-ping"></div>
              <div className="absolute top-10 right-4 w-3.5 h-3.5 rounded-full bg-[var(--accent)] opacity-80 animate-pulse"></div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-extrabold animate-pulse">
                AI Cognitive Calibration Active
              </h3>
              <p className="text-xs text-slate-400 font-mono tracking-wide max-w-sm mx-auto leading-relaxed h-12 flex items-center justify-center">
                {analysisText}
              </p>
            </div>

            {/* Glowing progress bar */}
            <div className="w-full max-w-md mx-auto bg-[var(--bg-secondary)] border border-[var(--border)] h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] h-full rounded-full transition-all duration-300 shadow-[var(--shadow-glow)]"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
            
            <p className="text-[10px] font-mono text-slate-500">
              Generating rule-based Learning OS modules...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
