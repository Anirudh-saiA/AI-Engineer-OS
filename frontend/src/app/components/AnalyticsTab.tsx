"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

interface AnalyticsTabProps {
  user: any;
  onProjectAdded?: () => void;
}

interface AnalyticsData {
  projects_started: number;
  projects_completed: number;
  completion_rate: number;
  favorite_category: string;
  hours_spent: number;
  success_rate: number;
  skills_gained: string[];
}

export default function AnalyticsTab({ user, onProjectAdded }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"completed" | "in_progress">("completed");
  const [category, setCategory] = useState("RAG Systems");
  const [customCategory, setCustomCategory] = useState("");
  const [hoursSpent, setHoursSpent] = useState<number>(0);
  const [skillsText, setSkillsText] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAnalyticsAndProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch Analytics
      const analyticsRes = await fetch(`${API_BASE_URL}/api/v1/profile/analytics`, {
        headers: {
          Authorization: `Bearer ${user.uid}`,
        },
      });
      let analyticsData: AnalyticsData = {
        projects_started: 0,
        projects_completed: 0,
        completion_rate: 0,
        favorite_category: "General",
        hours_spent: 0,
        success_rate: 0,
        skills_gained: [],
      };
      if (analyticsRes.ok) {
        analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      // Fetch Profile to get detailed projects
      const meRes = await fetch(`${API_BASE_URL}/api/v1/profile/me`, {
        headers: {
          Authorization: `Bearer ${user.uid}`,
        },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        setProjects(meData.projects || []);
      }
    } catch (err) {
      console.error("Failed to fetch analytics or project logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsAndProjects();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setSubmitting(true);
    setMessage(null);

    const finalCategory = category === "Other" ? (customCategory.trim() || "General") : category;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/profile/project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.uid}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          repository_link: repoLink.trim() || null,
          status,
          category: finalCategory,
          hours_spent: Number(hoursSpent) || 0,
          skills: skillsText.trim() || null,
        }),
      });

      if (res.ok) {
        setTitle("");
        setRepoLink("");
        setDescription("");
        setStatus("completed");
        setCategory("RAG Systems");
        setCustomCategory("");
        setHoursSpent(0);
        setSkillsText("");
        setMessage({ type: "success", text: "🚀 Project telemetry committed and 150 XP awarded!" });
        
        // Refresh local dashboard data
        await fetchAnalyticsAndProjects();
        if (onProjectAdded) {
          onProjectAdded();
        }
      } else {
        const errData = await res.json();
        setMessage({ type: "error", text: errData.detail || "Failed to commit project telemetry." });
      }
    } catch (err) {
      console.error("Project submission error:", err);
      setMessage({ type: "error", text: "Network boundary error. Failed to post repository." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-scale-in">
        <div className="w-12 h-12 border-4 border-[var(--accent-soft)] border-t-[var(--accent)] rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-slate-400 tracking-wider">Syncing Workspace Telemetry & Commit Registers...</p>
      </div>
    );
  }

  // Pre-compiled list of categories for user selection
  const categoriesList = [
    "RAG Systems",
    "AI Agents",
    "Web Development",
    "Backend Development",
    "Machine Learning",
    "Deep Learning",
    "Data Structures & Algorithms",
    "DevOps / MLOps",
    "Other",
  ];

  // Calculate category metrics for the bars
  const categoryCounts: { [key: string]: number } = {};
  projects.forEach((p) => {
    const cat = p.category || "General";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryData = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const maxCategoryCount = Math.max(...categoryData.map((d) => d.count), 1);

  // Generate path data for a beautiful responsive area chart representing "Hours Invested vs Projects Timeline"
  const generateChartPath = () => {
    if (projects.length === 0) return { linePath: "", areaPath: "" };
    
    // Sort projects chronologically (or simulate points based on indexes)
    const sorted = [...projects].reverse();
    const width = 500;
    const height = 150;
    const padding = 15;
    const pointsCount = sorted.length;
    
    if (pointsCount === 1) {
      const y = height - padding - ((sorted[0].hours_spent || 10) / 100) * (height - 2 * padding);
      return {
        linePath: `M ${padding} ${y} L ${width - padding} ${y}`,
        areaPath: `M ${padding} ${y} L ${width - padding} ${y} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`,
        points: [{ x: padding, y, val: sorted[0].hours_spent || 10, label: sorted[0].title }]
      };
    }

    const points = sorted.map((p, idx) => {
      const x = padding + (idx / (pointsCount - 1)) * (width - 2 * padding);
      const hoursVal = p.hours_spent || 10;
      // Cap at 80 hours for visual bounds
      const capVal = Math.min(hoursVal, 80);
      const y = height - padding - (capVal / 80) * (height - 2 * padding);
      return { x, y, val: hoursVal, label: p.title };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Use cubic bezier curves for smooth premium appearance
      const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY1 = points[i - 1].y;
      const cpX2 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY2 = points[i].y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    
    return { linePath, areaPath, points };
  };

  const chartData = generateChartPath();

  return (
    <div className="space-y-8 animate-fade-up">
      
      {/* HEADER TITLE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>📊</span> Project Analytics & Telemetry
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tracks and analyzes your technical learning metrics, repositories completed, and skills proficiency integrations.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--accent-soft)] border border-[var(--accent)] text-[10px] font-mono font-extrabold text-[var(--accent)] rounded-full animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
          Live Sync Active
        </div>
      </div>

      {/* SIX METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        
        {/* Started */}
        <div className="glass-card stat-card-1 rounded-2xl p-5 flex flex-col justify-between hover:scale-102 transition-all">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Started</span>
          <div className="mt-2.5">
            <span className="text-3xl font-black block tracking-tight">{analytics?.projects_started || 0}</span>
            <span className="text-[9px] text-slate-500 font-mono">Active Repositories</span>
          </div>
        </div>

        {/* Completed */}
        <div className="glass-card stat-card-2 rounded-2xl p-5 flex flex-col justify-between hover:scale-102 transition-all">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Completed</span>
          <div className="mt-2.5">
            <span className="text-3xl font-black block tracking-tight text-[var(--success)]">{analytics?.projects_completed || 0}</span>
            <span className="text-[9px] text-slate-500 font-mono">Shipped Milestones</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="glass-card stat-card-3 rounded-2xl p-5 flex flex-col justify-between hover:scale-102 transition-all">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Completion Rate</span>
          <div className="mt-2.5">
            <span className="text-3xl font-black block tracking-tight text-amber-500">{analytics?.completion_rate || 0}%</span>
            <div className="w-full bg-[var(--bg-secondary)] h-1 rounded-full overflow-hidden mt-1.5 border border-[var(--border)]">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${analytics?.completion_rate || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Hours Dedicated */}
        <div className="glass-card stat-card-4 rounded-2xl p-5 flex flex-col justify-between hover:scale-102 transition-all">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Hours Invested</span>
          <div className="mt-2.5">
            <span className="text-3xl font-black block tracking-tight text-purple-400">{analytics?.hours_spent || 0}h</span>
            <span className="text-[9px] text-slate-500 font-mono">Time Calibration</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:scale-102 transition-all border-l-4 border-rose-500">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Success Index</span>
          <div className="mt-2.5">
            <span className="text-3xl font-black block tracking-tight text-rose-400">{analytics?.success_rate || 0}%</span>
            <span className="text-[9px] text-slate-500 font-mono">Milestone Validation</span>
          </div>
        </div>

        {/* Top Domain */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:scale-102 transition-all border-l-4 border-cyan-400">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Top Domain</span>
          <div className="mt-2.5">
            <span className="text-sm font-black block truncate text-cyan-400 leading-tight uppercase font-mono mt-1">
              {analytics?.favorite_category || "General"}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-1">Primary Area</span>
          </div>
        </div>

      </div>

      {/* MIDDLE SECTION - CHARTS AND FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CHARTS CONTAINER (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Trend Area Chart Card */}
          <div className="glass-card rounded-3xl p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--border)] pb-3">
              <div>
                <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Project Commitment Velocity Timeline
                </h4>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Plots development time invested (Hours spent) per logged technical sprint.
                </p>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-2">📈</span>
                <p className="text-[10px] font-mono text-slate-400">No project logs detected.</p>
                <p className="text-[9px] text-slate-500 font-mono mt-1 max-w-sm">
                  Register a project using the submission portal to populate active timeline charts!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* SVG Area Chart */}
                <div className="w-full overflow-hidden">
                  <svg
                    viewBox="0 0 500 150"
                    width="100%"
                    height="100%"
                    className="overflow-visible"
                  >
                    <defs>
                      <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--accent)" />
                        <stop offset="100%" stopColor="var(--secondary, #fbbf24)" />
                      </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    <line x1="15" y1="15" x2="485" y2="15" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
                    <line x1="15" y1="75" x2="485" y2="75" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
                    <line x1="15" y1="135" x2="485" y2="135" stroke="var(--border)" strokeWidth="0.5" />

                    {/* Gradient Area Fill */}
                    {chartData.areaPath && (
                      <path d={chartData.areaPath} fill="url(#area-gradient)" />
                    )}

                    {/* Glowing Stroke Curve */}
                    {chartData.linePath && (
                      <path
                        d={chartData.linePath}
                        fill="none"
                        stroke="url(#line-gradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="drop-shadow-[0_2px_8px_var(--accent-glow)]"
                      />
                    )}

                    {/* Hoverable/Rendered Dot Points */}
                    {chartData.points?.map((p, idx) => (
                      <g key={idx} className="cursor-pointer group">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="5"
                          className="fill-[var(--bg-card)] stroke-[var(--accent)] stroke-2 hover:r-7 transition-all"
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="10"
                          className="fill-transparent stroke-none group-hover:fill-[var(--accent-soft)] group-hover:opacity-20 transition-all"
                        />
                        <foreignObject x={p.x - 35} y={p.y - 25} width="70" height="20" className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300">
                          <div className="bg-[var(--bg-card)] border border-[var(--accent)] text-[7px] font-mono text-[var(--accent)] px-1.5 py-0.5 rounded text-center truncate shadow-md">
                            {p.val} hrs
                          </div>
                        </foreignObject>
                      </g>
                    ))}
                  </svg>
                </div>
                
                {/* Timeline labels */}
                <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 px-2 pt-1 border-t border-[var(--border)]">
                  <span>Start of Telemetry Log</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
                    Peak Project Calibration Scale
                  </span>
                  <span>Active Sprint ({projects.length} nodes)</span>
                </div>
              </div>
            )}
          </div>

          {/* Category Share Distribution Card */}
          <div className="glass-card rounded-3xl p-8 space-y-6">
            <div>
              <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Category Distribution Matrix
              </h4>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                Displays the proportion of software projects completed in each domain track.
              </p>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[10px] font-mono text-slate-500">No category tags mapped yet.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {categoryData.map((item, idx) => {
                  const percentage = Math.round((item.count / projects.length) * 100);
                  const widthPercent = (item.count / maxCategoryCount) * 100;
                  
                  // Pick colors based on index
                  const barColors = [
                    "bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]",
                    "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
                    "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]",
                    "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]",
                    "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]",
                  ];
                  const colorClass = barColors[idx % barColors.length];

                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${colorClass.split(" ")[0]}`}></span>
                          {item.name}
                        </span>
                        <span className="text-slate-400">
                          {item.count} {item.count === 1 ? "project" : "projects"} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-[var(--bg-secondary)] h-2 rounded-full overflow-hidden relative border border-[var(--border)]">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* LOG NEW PROJECT FORM (4 Cols) */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-3xl p-6 space-y-5 border border-[var(--border)] hover:border-[var(--accent)] transition-all">
            <div className="border-b border-[var(--border)] pb-3">
              <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>📂</span> Register Dev Repository
              </h4>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                Post technical deliverables to update telemetry and award +150 XP achievements.
              </p>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl border text-[10px] font-mono font-semibold transition-all animate-scale-in ${
                  message.type === "success"
                    ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                    : "bg-red-500/10 border-red-500/35 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              {/* Project Title */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Project Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Memory router with Qdrant"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Repo Link */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">GitHub Repository Link</label>
                <input
                  type="text"
                  value={repoLink}
                  onChange={(e) => setRepoLink(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Brief Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Implement overlapping recursive sliding window tokenizers..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Status and Domain Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Domain Track</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    {categoriesList.map((catName) => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Category Write-In */}
              {category === "Other" && (
                <div className="space-y-1 animate-fade-up">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Specify Category</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Embedded Firmware"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}

              {/* Hours Invested and Skills Tags */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Hours Spent</label>
                  <input
                    type="number"
                    min="0"
                    value={hoursSpent || ""}
                    onChange={(e) => setHoursSpent(Number(e.target.value))}
                    placeholder="e.g. 15"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Skills Gained (Tags)</label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="e.g. Qdrant, Python, Docker"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-accent font-bold py-2.5 px-4 rounded-xl cursor-pointer disabled:opacity-40 disabled:pointer-events-none mt-2 font-mono flex items-center justify-center gap-2 border border-transparent active:scale-98 transition-all hover:shadow-[0_0_12px_var(--accent-glow)]"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Committing Repository...
                  </>
                ) : (
                  "Commit Project & Claim XP"
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* SKILLS INVENTORY BADGES */}
      <div className="glass-card rounded-3xl p-8 space-y-6">
        <div>
          <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Verified Skills Gained Inventory
          </h4>
          <p className="text-[9px] text-slate-500 font-mono mt-0.5">
            Dynamic library of technical skills compiled directly from your logged projects.
          </p>
        </div>

        {(!analytics?.skills_gained || analytics.skills_gained.length === 0) ? (
          <div className="py-6 text-center text-[10px] text-slate-500 font-mono">
            No technical skills compiled. Complete a project with skill tags to populate this inventory!
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {analytics.skills_gained.map((skill, index) => {
              // Generate dynamic neon borders based on index
              const colorPools = [
                "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)] hover:shadow-[0_0_10px_var(--accent-glow)]",
                "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]",
                "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:shadow-[0_0_10px_rgba(245,158,11,0.25)]",
                "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:shadow-[0_0_10px_rgba(168,85,247,0.25)]",
                "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:shadow-[0_0_10px_rgba(6,182,212,0.25)]",
              ];
              const dynamicClass = colorPools[index % colorPools.length];
              
              return (
                <span
                  key={skill}
                  className={`py-1.5 px-3.5 rounded-xl border text-[10px] font-extrabold transition-all duration-300 select-none shadow-sm cursor-default ${dynamicClass}`}
                >
                  ⚡ {skill}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* PROJECT TELEMETRY LOGS */}
      <div className="glass-card rounded-3xl p-8 space-y-6">
        <div>
          <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Commit History & Project Registers
          </h4>
          <p className="text-[9px] text-slate-500 font-mono mt-0.5">
            Audit history logs of technical milestones logged into your AI-Engineer-OS profile.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-3xl mb-1 block">📂</span>
            <p className="text-[10px] text-slate-400 font-mono">No telemetry files uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-5 bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h5 className="text-xs font-bold leading-tight truncate">{proj.title}</h5>
                    <span className="px-2 py-0.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[9px] font-semibold text-slate-300 font-mono">
                      📁 {proj.category || "General"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono border ${
                        proj.status === "completed"
                          ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/25"
                      }`}
                    >
                      {proj.status === "completed" ? "COMPLETED" : "IN PROGRESS"}
                    </span>
                    {proj.hours_spent !== undefined && proj.hours_spent > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-mono font-semibold">
                        ⏱️ {proj.hours_spent} hours
                      </span>
                    )}
                  </div>
                  
                  {proj.description && (
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans max-w-4xl">
                      {proj.description}
                    </p>
                  )}

                  {proj.skills && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.skills.split(",").map((s: string) => {
                        const cleanS = s.trim();
                        if (!cleanS) return null;
                        return (
                          <span
                            key={cleanS}
                            className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-slate-400"
                          >
                            #{cleanS}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {proj.completed_at && (
                    <p className="text-[8px] font-mono text-slate-500">
                      Commit Timestamp: {new Date(proj.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {proj.repository_link && (
                  <a
                    href={proj.repository_link}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-4 bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] text-[10px] font-mono font-bold rounded-xl shadow-sm text-center self-start sm:self-center transition-all whitespace-nowrap"
                  >
                    View Code 🐙
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
