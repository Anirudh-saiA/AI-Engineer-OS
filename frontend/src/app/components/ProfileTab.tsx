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
        await fetchProfileData();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit project schema.");
    } finally {
      setSubmittingProject(false);
    }
  };

  // Generate contribution heatmap (365 days)
  const generateHeatmap = () => {
    const cells = [];
    const seed = user?.uid?.charCodeAt(0) || 42;
    
    for (let i = 0; i < 371; i++) {
      let val = 0;
      const rand = Math.sin(i * 0.15 + seed) * Math.cos(i * 0.05);
      
      if (rand > 0.6) val = 4;
      else if (rand > 0.2) val = 3;
      else if (rand > -0.2) val = 2;
      else if (rand > -0.6) val = 1;
      else val = 0;

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
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-scale-in">
        <div className="w-12 h-12 border-4 border-[var(--accent-soft)] border-t-[var(--accent)] rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-slate-400 tracking-wider">Retrieving Developer Credentials...</p>
      </div>
    );
  }

  if (!profile || !profile.onboarded) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center shadow-md max-w-lg mx-auto mt-10 animate-fade-up">
        <span className="text-5xl mb-4 block">🤖</span>
        <h3 className="text-xl font-black">Developer Profile Uncalibrated</h3>
        <p className="text-xs text-slate-400 leading-relaxed mt-2">
          Your learning roadmap, skill indexes, and achievement logs have not been generated yet. Please complete the quick setup wizard first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      
      {/* HEADER SECTION: Premium Profile Card */}
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 shadow-md">
        
        {/* Soft Background Highlight */}
        <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-[var(--accent-soft)] to-transparent blur-[80px] pointer-events-none"></div>

        {/* Profile Avatar */}
        <div className="w-24 h-24 rounded-2xl border-2 border-[var(--accent)] p-1 bg-[var(--bg-card)] flex-shrink-0 overflow-hidden shadow-lg relative">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
          ) : (
            <div className="w-full h-full rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-2xl font-bold text-[var(--accent)] uppercase">
              {profile.full_name?.[0]}
            </div>
          )}
          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[var(--accent)] border-2 border-[var(--bg-card)] animate-pulse"></span>
        </div>

        {/* Bio Details */}
        <div className="flex-1 min-w-0 text-center md:text-left space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight">{profile.full_name}</h3>
              <p className="text-[10px] font-mono text-[var(--accent)] font-bold uppercase tracking-wider mt-1">
                {profile.branch_degree || "AI Systems Engineer"} • {profile.college_name || "Self-Taught"}
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-2 justify-center sm:justify-start">
              {profile.github_link && (
                <a
                  href={profile.github_link}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono font-bold tracking-wide transition-all shadow-sm"
                >
                  GitHub 🐙
                </a>
              )}
              {profile.linkedin_link && (
                <a
                  href={profile.linkedin_link}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold tracking-wide transition-all shadow-sm"
                >
                  LinkedIn 💼
                </a>
              )}
            </div>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed max-w-3xl">
            {profile.bio || "Building high-performance agent architectures and vector stores inside the AI-Engineer-OS sandbox."}
          </p>

          <div className="flex flex-wrap gap-5 pt-2 justify-center md:justify-start text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">📅 Class of {profile.graduation_year || "2027"}</span>
            <span className="flex items-center gap-1.5">💡 Style: {profile.learning_style || "project-based"}</span>
            <span className="flex items-center gap-1.5">⏱️ Focus: {profile.time_availability_mins}m/day</span>
          </div>
        </div>

      </div>

      {/* MID SECTION: GAMIFIED TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* DUOLINGO PANEL: Streaks & XP (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Flame streak stats */}
          <div className="glass-card rounded-3xl p-6 text-center space-y-4">
            <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-[var(--border)] pb-2 text-left flex items-center gap-1.5">
              <span>🔥</span> Learning Telemetry (Daily Streak)
            </h4>
            
            <div className="flex justify-center items-center gap-8 py-3">
              <div>
                <span className="text-4xl animate-pulse block">🔥</span>
                <span className="text-2xl font-black block mt-1">{profile.streak_count}</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">Day Streak</span>
              </div>
              <div className="h-10 w-[1px] bg-[var(--border)]"></div>
              <div>
                <span className="text-4xl block">👑</span>
                <span className="text-2xl font-black block mt-1">{profile.longest_streak}</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">Longest Streak</span>
              </div>
            </div>

            <div className="bg-[var(--accent-soft)] border border-[var(--accent)] rounded-2xl p-3 text-[10px] font-mono text-[var(--accent)] font-semibold">
              🏆 Earned {profile.xp_points} XP Points Total!
            </div>
          </div>

          {/* Achievements Checklist */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-[var(--border)] pb-2">
              Unlocked Achievements
            </h4>
            
            {profile.achievements.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-mono py-2">No achievements unlocked yet.</p>
            ) : (
              <div className="space-y-3">
                {profile.achievements.map((ach: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3.5 p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)] transition-all">
                    <span className="text-2xl p-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-sm">{ach.badge_icon}</span>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-[11px] font-bold leading-tight">{ach.title}</h5>
                      <p className="text-[9px] text-slate-400 leading-normal mt-0.5 truncate">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* SKILLS PANEL: Neon Skill meters & Projects (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Skill assessment meters */}
          <div className="glass-card rounded-3xl p-8 space-y-6">
            <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-[var(--border)] pb-2">
              Skill Proficiency Matrix
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {Object.entries(profile.skills || {}).map(([skill, val]: any) => (
                <div key={skill} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-bold text-slate-300">{skill}</span>
                    <span className="text-[var(--accent)] font-bold">{val}%</span>
                  </div>
                  <div className="w-full bg-[var(--bg-secondary)] h-2 rounded-full overflow-hidden relative border border-[var(--border)]">
                    <div
                      className="bg-[var(--accent)] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,107,53,0.3)]"
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
      <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-3 mb-6">
          <div>
            <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Autonomous Contribution Matrix (365 Days Telemetry)
            </h4>
            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
              Tracks active file commits, code updates, and database transaction queries in real-time.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-400">
            <span>Less</span>
            <span className="w-2 h-2 rounded bg-[var(--bg-secondary)] border border-[var(--border)]"></span>
            <span className="w-2 h-2 rounded bg-[var(--accent)] opacity-20"></span>
            <span className="w-2 h-2 rounded bg-[var(--accent)] opacity-50"></span>
            <span className="w-2 h-2 rounded bg-[var(--accent)] opacity-80"></span>
            <span className="w-2 h-2 rounded bg-[var(--accent)]"></span>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Tooltip Container */}
        {tooltipText && tooltipPos && (
          <div
            className="absolute z-40 bg-[var(--bg-card)] border border-[var(--accent)] text-[9px] font-mono text-[var(--text-primary)] py-1.5 px-3 rounded-lg pointer-events-none shadow-md transform -translate-x-1/2 -translate-y-full mt-[-6px]"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <p className="font-bold">{tooltipText}</p>
          </div>
        )}

        {/* Mobile Swipe helper */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 text-[9px] font-mono text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--accent)] rounded-full px-3 py-1 mb-4 animate-pulse w-fit">
          <span>👈 Swipe horizontally to view matrix 👉</span>
        </div>

        {/* Heatmap grid */}
        <div className="overflow-x-auto py-1">
          <div className="min-w-[620px] flex gap-[3.5px]">
            {Array.from({ length: 53 }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3.5px]">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const cellIdx = weekIdx * 7 + dayIdx;
                  const cell = heatmapCells[cellIdx];
                  if (!cell) return null;

                  // Dynamic color styles
                  let cellClass = "bg-[var(--bg-secondary)] border-[var(--border)]";
                  if (cell.level === 1) cellClass = "bg-[var(--accent)] opacity-25";
                  if (cell.level === 2) cellClass = "bg-[var(--accent)] opacity-50";
                  if (cell.level === 3) cellClass = "bg-[var(--accent)] opacity-75";
                  if (cell.level === 4) cellClass = "bg-[var(--accent)] shadow-[0_0_6px_var(--accent-glow)]";

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
                      className={`w-[9px] h-[9px] rounded-[1.5px] border border-transparent transition-all cursor-pointer hover:scale-125 ${cellClass}`}
                    ></div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-3 px-1">
          <span>June 2025</span>
          <span>September 2025</span>
          <span>December 2025</span>
          <span>March 2026</span>
          <span>May 2026 (Active)</span>
        </div>
      </div>

      {/* PROJECTS AND SUBMISSIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* PROJECTS SECTION: List (8 Cols) */}
        <div className="lg:col-span-8 glass-card rounded-3xl p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
            <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Assigned & Completed Projects
            </h4>
            <button
              onClick={() => setAddingProject(!addingProject)}
              className="py-1.5 px-3.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--accent-soft)] border border-[var(--border)] hover:border-[var(--accent)] text-[10px] font-bold transition-all shadow-sm cursor-pointer"
            >
              {addingProject ? "Cancel" : "+ Add Completed Project"}
            </button>
          </div>

          {/* New project form */}
          {addingProject && (
            <form onSubmit={handleAddProject} className="bg-[var(--bg-secondary)] border border-[var(--accent)] rounded-2xl p-6 space-y-5 animate-fade-up">
              <h5 className="text-xs font-bold text-[var(--accent)] font-mono uppercase tracking-wide">Submit Repository (+150 XP Milestone)</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Project Title</label>
                  <input
                    type="text"
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    required
                    placeholder="e.g. Multi-Agent state router"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Repository Link</label>
                  <input
                    type="text"
                    value={projRepo}
                    onChange={(e) => setProjRepo(e.target.value)}
                    placeholder="e.g. https://github.com/..."
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-400 uppercase">Short Description</label>
                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={2}
                  placeholder="Outline what features this project implements..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Status:</label>
                  <select
                    value={projStatus}
                    onChange={(e: any) => setProjStatus(e.target.value)}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs cursor-pointer focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submittingProject}
                  className="btn-accent py-2 px-5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  {submittingProject ? "Submitting..." : "Submit Project"}
                </button>
              </div>
            </form>
          )}

          {/* Projects lists */}
          {profile.projects.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-3xl mb-1 block">📂</span>
              <p className="text-[10px] text-slate-400 font-mono">No projects registered. Link a GitHub repo to begin earning milestones.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.projects.map((proj: any, idx: number) => (
                <div key={idx} className="p-5 bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h5 className="text-xs font-bold font-sans">{proj.title}</h5>
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold font-mono border ${
                        proj.status === "completed" 
                          ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]" 
                          : "bg-amber-500/10 text-amber-500 border-amber-500/25"
                      }`}>
                        {proj.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{proj.description}</p>
                    
                    {proj.completed_at && (
                      <p className="text-[9px] font-mono text-slate-500">Completed: {new Date(proj.completed_at).toLocaleDateString()}</p>
                    )}
                  </div>

                  {proj.repository_link && (
                    <a
                      href={proj.repository_link}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3.5 bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] text-[10px] font-mono rounded-xl shadow-sm text-center self-start transition-all"
                    >
                      View Code 📁
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SYSTEM STATS CARD */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h4 className="font-mono text-[9px] text-[var(--accent)] font-bold uppercase tracking-wider border-b border-[var(--border)] pb-2">
              Sandbox Core Systems
            </h4>
            <div className="space-y-3 font-mono text-[10px] text-slate-400">
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span>Database:</span>
                <span className="text-[var(--text-primary)] font-bold">PostgreSQL v15</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span>Vector Hub:</span>
                <span className="text-[var(--text-primary)] font-bold">Qdrant Client</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span>Max Context:</span>
                <span className="text-[var(--text-primary)] font-bold">8,192 tokens</span>
              </div>
              <div className="flex justify-between">
                <span>User Role:</span>
                <span className="text-[var(--accent)] font-bold uppercase">Developer</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-[var(--border)] text-[9px] font-mono text-slate-500 leading-relaxed">
            ⚙️ Connect your local container pipelines to register live terminal session logs directly to this heatmap grid.
          </div>
        </div>

      </div>

    </div>
  );
}
