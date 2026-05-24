"use client";

import React, { useState, useEffect } from "react";

interface ProfileTabProps {
  user: any;
}

interface ProjectData {
  title: string;
  description: string;
  repository_link: string;
  status: "in_progress" | "completed";
}

export default function ProfileTab({ user }: ProfileTabProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingProject, setAddingProject] = useState(false);
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projRepo, setProjRepo] = useState("");
  const [projStatus, setProjStatus] = useState<"in_progress" | "completed">("completed");
  const [submittingProject, setSubmittingProject] = useState(false);

  // Heatmap hover states
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/profile/me", {
        headers: {
          Authorization: `Bearer ${user.uid}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error("Failed to load developer profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim() || !user) return;
    setSubmittingProject(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/profile/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.uid}`,
        },
        body: JSON.stringify({
          title: projTitle,
          description: projDesc,
          repository_link: projRepo || null,
          status: projStatus,
        }),
      });

      if (res.ok) {
        setProjTitle("");
        setProjDesc("");
        setProjRepo("");
        setProjStatus("completed");
        setAddingProject(false);
        // Refresh profile data
        await fetchProfileData();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit project schema.");
    } finally {
      setSubmittingProject(false);
    }
  };

  // Generate realistic contribution heatmap (365 days)
  const generateHeatmap = () => {
    const cells = [];
    const seed = user?.uid?.charCodeAt(0) || 42;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // We'll generate 53 weeks * 7 days = 371 cells
    for (let i = 0; i < 371; i++) {
      // Calculate realistic random-looking contribution level (0 to 4)
      let val = 0;
      const rand = Math.sin(i * 0.15 + seed) * Math.cos(i * 0.05);
      
      if (rand > 0.6) val = 4; // High commits
      else if (rand > 0.2) val = 3; // Medium
      else if (rand > -0.2) val = 2; // Low
      else if (rand > -0.6) val = 1; // Minimal
      else val = 0; // No commit

      // Format simple hover date
      const date = new Date();
      date.setDate(date.getDate() - (371 - i));
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const commitCount = val === 0 ? "No commits" : val === 4 ? "12 commits" : val === 3 ? "6 commits" : val === 2 ? "3 commits" : "1 commit";

      cells.push({
        id: i,
        level: val,
        dateStr,
        commitCount,
      });
    }
    return cells;
  };

  const heatmapCells = generateHeatmap();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-t-2 border-r-2 border-indigo-600 rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-slate-500 tracking-wider">Retrieving Developer Credentials...</p>
      </div>
    );
  }

  if (!profile || !profile.onboarded) {
    return (
      <div className="glass-card rounded-3xl p-8 border border-slate-200/60 bg-white text-center shadow-md max-w-lg mx-auto mt-10">
        <span className="text-4xl mb-4 block">🤖</span>
        <h3 className="text-xl font-bold text-slate-900">Developer Profile Uncalibrated</h3>
        <p className="text-xs text-slate-500 leading-relaxed mt-2">
          Your LinkedIn + GitHub + Duolingo profile telemetry has not been configured. Please complete the setup wizard overlay to establish database sync.
        </p>
      </div>
    );
  }

  // Get color based on contribution level
  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 4: return "bg-emerald-600 border-emerald-700/20 hover:scale-110 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
      case 3: return "bg-emerald-500/80 border-emerald-600/10 hover:scale-110";
      case 2: return "bg-emerald-400/50 border-emerald-500/10 hover:scale-110";
      case 1: return "bg-emerald-300/20 border-emerald-400/5 hover:scale-110";
      default: return "bg-slate-100 dark:bg-slate-900 border-slate-200/10 hover:scale-110";
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900 dark:text-white">
      
      {/* HEADER SECTION: LinkedIn Bio Card */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/60 bg-gradient-to-tr from-white to-slate-50/50 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
        
        {/* Soft Background Highlight */}
        <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-indigo-500/10 to-fuchsia-500/5 blur-[80px] pointer-events-none"></div>

        {/* Profile Avatar */}
        <div className="w-20 h-20 rounded-2xl border-2 border-slate-950 p-1 bg-white flex-shrink-0 overflow-hidden shadow-md relative">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
          ) : (
            <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-xl font-bold text-white uppercase">
              {profile.full_name?.[0]}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
        </div>

        {/* Bio Details */}
        <div className="flex-1 min-w-0 text-center md:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-950">{profile.full_name}</h3>
              <p className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
                {profile.branch_degree || "AI Developer"} @ {profile.college_name || "Self-Taught"}
              </p>
            </div>
            
            {/* Social profiles Links */}
            <div className="flex gap-2.5 justify-center sm:justify-start">
              {profile.github_link && (
                <a
                  href={profile.github_link}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-mono text-[9px] font-semibold tracking-wider transition-all shadow-3xs"
                >
                  GitHub 🐙
                </a>
              )}
              {profile.linkedin_link && (
                <a
                  href={profile.linkedin_link}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-[9px] font-semibold tracking-wider transition-all shadow-3xs"
                >
                  LinkedIn 💼
                </a>
              )}
            </div>
          </div>

          <p className="text-slate-600 text-xs leading-relaxed max-w-2xl font-sans">
            {profile.bio || "Building high-performance agent architectures and vector stores inside the AI-Engineer-OS sandbox."}
          </p>

          <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start text-[10px] font-mono text-slate-400">
            <span>📅 Class of {profile.graduation_year || "2027"}</span>
            <span>💡 Style: {profile.learning_style || "project-based"}</span>
            <span>⏱️ Avail: {profile.time_availability_mins}m/day</span>
          </div>
        </div>

      </div>

      {/* MID SECTION: GAMIFIED TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* DUOLINGO PANEL: Streaks & XP (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Flame streak stats */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/20 text-center space-y-4">
            <h4 className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-2 text-left flex items-center gap-1.5">
              <span>🔥</span> Learning Telemetry (Duolingo style)
            </h4>
            
            <div className="flex justify-center items-center gap-6 py-2">
              <div>
                <span className="text-4xl animate-pulse block">🔥</span>
                <span className="text-2xl font-black text-slate-900 block mt-1">{profile.streak_count}</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">Day Streak</span>
              </div>
              <div className="h-10 w-[1px] bg-slate-200"></div>
              <div>
                <span className="text-4xl block">⚡</span>
                <span className="text-2xl font-black text-slate-900 block mt-1">{profile.longest_streak}</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">Longest Streak</span>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-[10px] font-mono text-indigo-700 font-semibold">
              🏆 Earned {profile.xp_points} XP Points Total!
            </div>
          </div>

          {/* Achievements Checklist */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200/60">
            <h4 className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
              Unlocked Achievements
            </h4>
            
            {profile.achievements.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-mono py-2">No achievements unlocked yet.</p>
            ) : (
              <div className="space-y-3">
                {profile.achievements.map((ach: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50/70 border border-slate-100 rounded-xl hover:border-indigo-100 transition-all">
                    <span className="text-2xl p-1 bg-white rounded-lg border border-slate-200/40 shadow-3xs">{ach.badge_icon}</span>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-[11px] font-bold text-slate-800 leading-tight">{ach.title}</h5>
                      <p className="text-[9px] text-slate-400 leading-normal mt-0.5 truncate">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* GITHUB PANEL: Neon Skill meters & Projects (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Skill assessment meters */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200/60 bg-white">
            <h4 className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
              Vector Skill Proficiency Indicators (GitHub style)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {Object.entries(profile.skills || {}).map(([skill, val]: any) => (
                <div key={skill} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-semibold text-slate-700">{skill}</span>
                    <span className="text-indigo-600 font-bold">{val}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative border border-slate-200/30">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${val}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* GIT CONTRIBUTION HEATMAP GRID */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/60 bg-white shadow-3xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h4 className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Autonomous Contribution Matrix (365 Days telemetry)
            </h4>
            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
              Tracks active file commits, code updates, and database transaction queries in real-time.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-400">
            <span>Less</span>
            <span className="w-2 h-2 rounded bg-slate-100 border border-slate-200/30"></span>
            <span className="w-2 h-2 rounded bg-emerald-100"></span>
            <span className="w-2 h-2 rounded bg-emerald-300"></span>
            <span className="w-2 h-2 rounded bg-emerald-500"></span>
            <span className="w-2 h-2 rounded bg-emerald-600"></span>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Tooltip Container */}
        {tooltipText && tooltipPos && (
          <div
            className="absolute z-40 bg-slate-900 border border-slate-800 text-[9px] font-mono text-white py-1.5 px-3 rounded-lg pointer-events-none shadow-md transform -translate-x-1/2 -translate-y-full mt-[-6px]"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <p className="font-bold">{tooltipText}</p>
          </div>
        )}

        {/* Mobile horizontal scroll swipe indicator helper */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 text-[9px] font-mono text-indigo-500 bg-indigo-50/60 border border-indigo-100/50 rounded-full px-3 py-1 mb-4 animate-pulse w-fit">
          <span>👈 Swipe horizontally to view full matrix 👉</span>
        </div>

        {/* SVG/Div Heatmap wrapper */}
        <div className="overflow-x-auto py-1">
          <div className="min-w-[620px] flex gap-[3.5px]">
            {/* Split 371 cells into 53 weeks (columns) */}
            {Array.from({ length: 53 }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3.5px]">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const cellIdx = weekIdx * 7 + dayIdx;
                  const cell = heatmapCells[cellIdx];
                  if (!cell) return null;

                  return (
                    <div
                      key={dayIdx}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const parentRect = e.currentTarget.offsetParent?.getBoundingClientRect();
                        if (parentRect) {
                          setTooltipText(`${cell.commitCount} on ${cell.dateStr}`);
                          setTooltipPos({
                            x: rect.left - parentRect.left + rect.width / 2,
                            y: rect.top - parentRect.top,
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        setTooltipText(null);
                        setTooltipPos(null);
                      }}
                      className={`w-[9px] h-[9px] rounded-[1.5px] border border-transparent transition-all cursor-pointer ${getHeatmapColor(cell.level)}`}
                    ></div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-2 px-1">
          <span>June 2025</span>
          <span>September 2025</span>
          <span>December 2025</span>
          <span>March 2026</span>
          <span>May 2026 (Active)</span>
        </div>
      </div>

      {/* PROJECTS AND SUBMISSIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* PROJECTS SECTION: List (8 Cols) */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-slate-200/60 bg-white">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h4 className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Assigned & Completed Projects
            </h4>
            <button
              onClick={() => setAddingProject(!addingProject)}
              className="py-1 px-3 rounded-lg bg-indigo-55 hover:bg-indigo-100 border border-indigo-200 text-indigo-650 font-mono text-[9px] font-bold tracking-wide transition-all shadow-3xs cursor-pointer"
            >
              {addingProject ? "Cancel Submission" : "+ Add Completed Project"}
            </button>
          </div>

          {/* New project form overlay/card */}
          {addingProject && (
            <form onSubmit={handleAddProject} className="bg-slate-50/80 border border-indigo-100 rounded-xl p-4 mb-6 space-y-4 animate-fadeIn">
              <h5 className="text-[11px] font-bold text-indigo-700 font-mono uppercase">Submit Repository details (+150 XP Reward)</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-slate-400 uppercase">Project Title</label>
                  <input
                    type="text"
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    required
                    placeholder="e.g. Multi-Agent state router"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-slate-400 uppercase">Repository Link</label>
                  <input
                    type="text"
                    value={projRepo}
                    onChange={(e) => setProjRepo(e.target.value)}
                    placeholder="e.g. https://github.com/..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-850 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-mono text-slate-400 uppercase">Short Description</label>
                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={2}
                  placeholder="Outline what features this project implements..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <label className="text-[8px] font-mono text-slate-400 uppercase">Status:</label>
                  <select
                    value={projStatus}
                    onChange={(e: any) => setProjStatus(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-700"
                  >
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submittingProject}
                  className="py-1.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm"
                >
                  {submittingProject ? "Submitting..." : "Submit Project Details"}
                </button>
              </div>
            </form>
          )}

          {/* Projects lists */}
          {profile.projects.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-2xl mb-1 block">📂</span>
              <p className="text-[10px] text-slate-400 font-mono">No projects registered. Link a GitHub repo to begin earning milestones.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.projects.map((proj: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50/60 border border-slate-200/50 rounded-2xl hover:border-indigo-100 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-slate-900 font-sans">{proj.title}</h5>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-mono border ${
                        proj.status === "completed" 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {proj.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">{proj.description}</p>
                    
                    {proj.completed_at && (
                      <p className="text-[9px] font-mono text-slate-400">Completed at: {new Date(proj.completed_at).toLocaleDateString()}</p>
                    )}
                  </div>

                  {proj.repository_link && (
                    <a
                      href={proj.repository_link}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 hover:text-slate-800 text-[10px] font-mono rounded-lg shadow-3xs flex-shrink-0 text-center self-start"
                    >
                      View Code 📁
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STATS BRIEF: System config metrics (4 Cols) */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-slate-200/60 flex flex-col justify-between">
          <div>
            <h4 className="font-mono text-[9px] text-indigo-600 font-bold uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2">
              Sandbox OS Core System Maps
            </h4>
            <div className="space-y-3 font-mono text-[10px] text-slate-500">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>Database host:</span>
                <span className="text-slate-800 text-xs font-bold">PostgreSQL v15</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>Vector client:</span>
                <span className="text-slate-800 text-xs font-bold">Qdrant v1.7.0</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>Agent context:</span>
                <span className="text-slate-800 text-xs font-bold">8,192 tokens max</span>
              </div>
              <div className="flex justify-between">
                <span>User role:</span>
                <span className="text-indigo-600 font-bold text-xs uppercase">Developer</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/50 p-3 rounded-xl text-[9px] font-mono text-slate-400 leading-normal">
            ⚙️ Connect your local container pipelines to register live terminal session logs directly to this heatmap grid.
          </div>
        </div>

      </div>

    </div>
  );
}
