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
        "Structuring custom placement target DSA pipelines...",
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
    // Save current step data to global state
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      {/* Sleek cyber card layout */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-slate-150">
        
        {/* Futuristic Glowing Highlights */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Step Progress indicators */}
        {step < 6 && (
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
              System Calibration • Stage {step} of 5
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    step >= s ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-slate-800"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 1: WELCOME SCREEN */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white mx-auto shadow-lg animate-pulse">
                Ω
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                Become an AI Engineer <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-indigo-400">
                  Through Real AI Systems
                </span>
              </h2>
              <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                Welcome to AI-Engineer-OS. Calibrate your developer credentials and system skills to build a customized, gamified roadmapping experience.
              </p>
            </div>

            <div className="space-y-4 mt-6 bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide border-b border-slate-800 pb-2">
                Developer Credentials (synced to profiles)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">College / University</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Branch / Degree</label>
                  <input
                    type="text"
                    value={branchDegree}
                    onChange={(e) => setBranchDegree(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Graduation Year</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    placeholder="e.g. 2027"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-400 uppercase">Professional Bio Summary</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Tell us about your learning journey..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-xs text-white"
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
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-white font-mono text-indigo-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={linkedinLink}
                    onChange={(e) => setLinkedinLink(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-white font-mono text-indigo-300"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={!fullName.trim()}
              className="w-full py-3.5 px-6 mt-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              Start Your AI Journey
              <span>🚀</span>
            </button>
          </div>
        )}

        {/* SCREEN 2: SKILL ASSESSMENT */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white">Rate Your Software Skills</h2>
              <p className="text-xs text-slate-400 mt-1">
                Drag the indicators to score your active experience level. These calibrate your starting vector metrics.
              </p>
            </div>

            <div className="space-y-5 bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80 max-h-[350px] overflow-y-auto">
              
              {/* Skill 1: Python */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="font-bold text-white">🐍 Python Ecosystem</span>
                  <span className="text-indigo-400 font-bold">{python}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={python}
                  onChange={(e) => setPython(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 cursor-pointer h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* Skill 2: JavaScript */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="font-bold text-white">💻 JavaScript / TypeScript</span>
                  <span className="text-indigo-400 font-bold">{javascript}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={javascript}
                  onChange={(e) => setJavascript(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 cursor-pointer h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* Skill 3: DSA */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="font-bold text-white">📊 Data Structures & Algorithms (DSA)</span>
                  <span className="text-indigo-400 font-bold">{dsa}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={dsa}
                  onChange={(e) => setDsa(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 cursor-pointer h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* Skill 4: Web Dev */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="font-bold text-white">🌐 Full-Stack Web Development</span>
                  <span className="text-indigo-400 font-bold">{web}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={web}
                  onChange={(e) => setWeb(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 cursor-pointer h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* Skill 5: Machine Learning */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="font-bold text-white">🤖 Machine Learning basics</span>
                  <span className="text-indigo-400 font-bold">{ml}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ml}
                  onChange={(e) => setMl(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 cursor-pointer h-1.5 rounded-lg appearance-none"
                />
              </div>

              {/* Skill 6: GenAI */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="font-bold text-white">✨ Generative AI & Large Language Models</span>
                  <span className="text-indigo-400 font-bold">{genai}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={genai}
                  onChange={(e) => setGenai(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 cursor-pointer h-1.5 rounded-lg appearance-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs tracking-wide transition-all border border-slate-750 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-all border border-indigo-600 cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                Configure Career Goals
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: CAREER GOALS */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white">Select Your Learning Track</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose one or more professional directions. We use this to inject personalized milestones into your active roadmap.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "AI Engineer", icon: "🤖", desc: "Build stateful multi-agent services & RAG models" },
                { title: "ML Engineer", icon: "🧠", desc: "Train Neural Networks and design analytics engines" },
                { title: "Placement Prep", icon: "💼", desc: "Master DSA, system designs, and database logs" },
                { title: "Hackathons", icon: "🏆", desc: "Fast prototype production web clients & API schemas" },
                { title: "Freelancing", icon: "✈️", desc: "Acquire full stack skills to handle projects independently" },
                { title: "Startup", icon: "🔥", desc: "Develop hyper-scalable backend systems & microservices" },
              ].map((goal) => {
                const isSelected = selectedGoals.includes(goal.title);
                return (
                  <button
                    key={goal.title}
                    onClick={() => toggleGoal(goal.title)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between h-32 ${
                      isSelected
                        ? "bg-slate-800/80 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] text-white"
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-2xl">{goal.icon}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-sans tracking-wide leading-tight">{goal.title}</h4>
                      <p className="text-[9px] text-slate-400 leading-normal mt-1">{goal.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs tracking-wide transition-all border border-slate-750 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={selectedGoals.length === 0}
                className="flex-1 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-all border border-indigo-600 cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
              >
                Set Daily Availability
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: DAILY AVAILABILITY */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white">Daily Learning Commitment</h2>
              <p className="text-xs text-slate-400 mt-1">
                Calibrate the daily time constraints. This guides progress roadmaps and sets consistent Duolingo streaks thresholds!
              </p>
            </div>

            <div className="bg-slate-950/40 p-8 rounded-2xl border border-slate-800/80 text-center space-y-6">
              
              <div className="w-20 h-20 rounded-full bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mx-auto text-3xl shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-bounce">
                ⏱️
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold text-white">
                  {availability >= 180 ? `${(availability / 60).toFixed(0)} Hours` : `${availability} Minutes`}
                </h3>
                <p className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
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
                className="w-full accent-indigo-500 bg-slate-800 cursor-pointer h-1.5 rounded-lg appearance-none mt-4"
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
                className="py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs tracking-wide transition-all border border-slate-750 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide transition-all border border-indigo-600 cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                Select Learning Preference
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: LEARNING PREFERENCES */}
        {step === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white">Your Learning Style</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose the educational format you engage with best. This adjusts system content modules.
              </p>
            </div>

            <div className="space-y-3">
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
                        ? "bg-slate-800/80 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)] text-white"
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-350"
                    }`}
                  >
                    <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-800">{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold leading-tight font-sans">{style.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{style.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] mr-2 flex-shrink-0"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                className="py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs tracking-wide transition-all border border-slate-750 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide transition-all border border-indigo-600 cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                Compile My Learning Roadmap!
                <span>⚡</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 6: MAGICAL AI ANALYZING CANVAS */}
        {step === 6 && (
          <div className="py-10 text-center space-y-8 animate-fadeIn">
            
            {/* Immersive Pulsing Node Canvas */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping"></div>
              {/* Secondary pulsing ring */}
              <div className="absolute inset-4 rounded-full border border-fuchsia-500/20 animate-pulse"></div>
              {/* Middle grid */}
              <div className="absolute inset-10 rounded-full bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <span className="text-4xl animate-bounce">🧠</span>
              </div>

              {/* Pulsing floating satellite nodes */}
              <div className="absolute top-2 left-6 w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)] animate-pulse"></div>
              <div className="absolute bottom-4 left-10 w-3 h-3 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,1)] animate-ping"></div>
              <div className="absolute top-10 right-4 w-3.5 h-3.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)] animate-pulse"></div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-white animate-pulse">
                AI Cognitive Calibration Active
              </h3>
              <p className="text-xs text-slate-400 font-mono tracking-wide max-w-sm mx-auto leading-relaxed h-12 flex items-center justify-center">
                {analysisText}
              </p>
            </div>

            {/* Glowing progress bar */}
            <div className="w-full max-w-md mx-auto bg-slate-950 border border-slate-800/60 h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
            
            <p className="text-[10px] font-mono text-slate-500">
              Generating rule-based postgres milestones... please wait.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
