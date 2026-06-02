import React from "react";

interface RoadmapSubNode {
  id: string;
  title: string;
  description: string;
  checklist: string[];
}

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  subNodes: RoadmapSubNode[];
}

interface RoadmapTrack {
  title: string;
  icon: string;
  accent: string;
  description: string;
  nodes: RoadmapNode[];
}

interface DashboardTabProps {
  dailyTasks: any[];
  plannerLoading: boolean;
  handleToggleDailyTask: (taskId: number) => void;
  profileData: any;
  getLast7Days: () => any[];
  roadmap: any[];
  selectedRoadmapTrack: string;
  setSelectedRoadmapTrack: (track: string) => void;
  staticRoadmaps: Record<string, RoadmapTrack>;
  activeDetailSubNode: RoadmapSubNode | null;
  setActiveDetailSubNode: (node: RoadmapSubNode | null) => void;
  checkedTasks: Record<string, boolean>;
  toggleChecklistTask: (taskId: string) => void;
  logs: Array<{ text: string; type: string }>;
  setLogs: React.Dispatch<React.SetStateAction<Array<{ text: string; type: "system" | "success" | "config" | "info" | "error" }>>>;
  addLog: (text: string, type: "system" | "success" | "config" | "info" | "error") => void;
  fetchStatus: () => void;
  fastapiOnline: boolean | null;
  activeModel: string;
  user: any;
  API_BASE_URL: string;
  fetchProfile: () => void;
  setShowBreatherModal: (show: boolean) => void;
}

export default function DashboardTab({
  dailyTasks,
  plannerLoading,
  handleToggleDailyTask,
  profileData,
  getLast7Days,
  roadmap,
  selectedRoadmapTrack,
  setSelectedRoadmapTrack,
  staticRoadmaps,
  activeDetailSubNode,
  setActiveDetailSubNode,
  checkedTasks,
  toggleChecklistTask,
  logs,
  setLogs,
  addLog,
  fetchStatus,
  fastapiOnline,
  activeModel,
  user,
  API_BASE_URL,
  fetchProfile,
  setShowBreatherModal,
}: DashboardTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Stat Card 1 */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between shadow-sm border border-[var(--border)] hover:border-[var(--accent)] transition-all">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">FastAPI Gateway</p>
            <h3 className="text-xl font-black mt-1">Uvicorn</h3>
            <p className="text-[9px] font-mono mt-1 font-bold" style={{ color: fastapiOnline ? "var(--success)" : "var(--error)" }}>
              {fastapiOnline ? "● Healthy" : "○ Locked"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
            ⚡
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between shadow-sm border border-[var(--border)] transition-all">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Postgres DB</p>
            <h3 className="text-xl font-black mt-1">Port 5434</h3>
            <p className="text-[9px] font-mono mt-1 font-bold text-[var(--success)]">● Pool Active</p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
            🐘
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between shadow-sm border border-[var(--border)] transition-all">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Qdrant Vector</p>
            <h3 className="text-xl font-black mt-1">Port 6333</h3>
            <p className="text-[9px] font-mono mt-1 font-bold text-[var(--accent-text)]">● Cosine online</p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
            🎯
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between shadow-sm border border-[var(--border)] transition-all">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Workspace</p>
            <h3 className="text-xl font-black mt-1">AI-OS</h3>
            <p className="text-[9px] font-mono mt-1 font-bold text-[var(--accent-text)]">Branch: main</p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
            📂
          </div>
        </div>
      </div>

      {/* ═══════ TODAY'S PLAN (PERSONAL AI COACH) CHECKLIST ═══════ */}
      <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-md border border-[var(--border)]">
        <div className="absolute top-[-25%] left-[-15%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[var(--accent-soft)] to-transparent blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)] relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-float">📅</span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Today's Plan (AI Coach Scheduler)
              </h3>
              <p className="text-xs font-mono font-bold mt-0.5 text-slate-400">
                Custom dynamic checklists generated based on roadmap & weak topics. +20 XP per task!
              </p>
            </div>
          </div>

          {/* Progress summary badge */}
          {(() => {
            const total = dailyTasks.length;
            const completed = dailyTasks.filter((t) => t.completed).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div className="flex items-center gap-3 font-mono text-[10px] font-bold">
                <span className="text-slate-400">Completed: {completed} / {total}</span>
                <span className="px-3 py-1 rounded-full text-white bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]">
                  {pct}% Achieved
                </span>
              </div>
            );
          })()}
        </div>

        {/* Progress Slider Bar */}
        {(() => {
          const total = dailyTasks.length;
          const completed = dailyTasks.filter((t) => t.completed).length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return (
            <div className="w-full bg-[var(--bg-secondary)] h-2 rounded-full mt-4 overflow-hidden border border-[var(--border)] relative z-10">
              <div className="h-full rounded-full transition-all duration-500 bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]"
                style={{ width: `${pct}%` }} />
            </div>
          );
        })()}

        {/* Planner Checklist List */}
        {plannerLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 relative z-10 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-soft)] border-t-[var(--accent)] animate-spin"></div>
            <p className="font-mono text-[10px] text-slate-400">AI Coach generating today's tasks...</p>
          </div>
        ) : (!dailyTasks || dailyTasks.length === 0) ? (
          <div className="text-center py-8 relative z-10">
            <span className="text-2xl mb-1 block">🏆</span>
            <p className="text-[10px] font-mono text-slate-400">Your AI coach is compiling your calendar goals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10 animate-fadeIn">
            {dailyTasks.map((task) => {
              let badgeBg = "rgba(245,158,11,0.08)";
              let badgeText = "Study 📚";
              let badgeColor = "var(--warning)";
              
              if (task.category === "dsa") {
                badgeBg = "rgba(34,197,94,0.08)";
                badgeText = "DSA 🧠";
                badgeColor = "var(--success)";
              } else if (task.category === "coding") {
                badgeBg = "rgba(168,85,247,0.08)";
                badgeText = "Coding 💻";
                badgeColor = "#a855f7";
              } else if (task.category === "revision") {
                badgeBg = "rgba(239,68,68,0.08)";
                badgeText = "Revision 🔄";
                badgeColor = "#ef4444";
              }

              return (
                <button
                  key={task.id}
                  onClick={() => handleToggleDailyTask(task.id)}
                  className="glass-card rounded-2xl p-5 text-left border cursor-pointer transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between gap-4 h-full relative border-[var(--border)]"
                  style={{
                    borderColor: task.completed ? "var(--success)" : "var(--border)",
                    background: task.completed ? "rgba(34,197,94,0.02)" : "var(--bg-card)",
                    boxShadow: task.completed ? "0 0 10px rgba(34,197,94,0.04)" : "var(--shadow-sm)"
                  }}
                >
                  <div className="space-y-3 w-full">
                    {/* Header category badge + checkbox */}
                    <div className="flex items-center justify-between w-full">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono border"
                        style={{ background: badgeBg, color: badgeColor, borderColor: `${badgeColor}25` }}>
                        {badgeText}
                      </span>
                      <div className="w-5 h-5 rounded-md border flex items-center justify-center font-bold text-[10px] flex-shrink-0 transition-all duration-300"
                        style={{
                          borderColor: task.completed ? "var(--success)" : "var(--border)",
                          background: task.completed ? "var(--success)" : "transparent",
                          color: task.completed ? "white" : "transparent"
                        }}>
                        ✓
                      </div>
                    </div>

                    <p className="text-[11px] font-semibold leading-relaxed break-words"
                      style={{
                        color: task.completed ? "var(--text-muted)" : "var(--text-primary)",
                        textDecoration: task.completed ? "line-through" : "none"
                      }}>
                      {task.task_text}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-2 border-t border-[var(--border)] mt-auto w-full">
                    <span>Status: {task.completed ? "Done" : "Pending"}</span>
                    <span className="font-bold text-[var(--accent)]">+20 XP</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════ STREAK CONSISTENCY COACH ═══════ */}
      <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-md border border-[var(--border)]">
        <div className="absolute top-[-25%] right-[-15%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[rgba(249,115,22,0.15)] to-transparent blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)] relative z-10">
          <div className="flex items-center gap-4">
            {/* Massive pulsing flame counter with warm radial backglow */}
            <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0 bg-orange-500/10 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-red-500/20 animate-pulse"></div>
              <span className="text-3xl sm:text-4xl animate-bounce relative z-10" style={{ animationDuration: '2s' }}>🔥</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Streak Consistency Coach
              </h3>
              <p className="text-xs font-mono font-bold mt-0.5 text-slate-400">
                Build coding habits daily. Track your active check-ins, roadmap completions, and learning focus sessions.
              </p>
            </div>
          </div>

          {/* Streak Stats Badge */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Current Streak</p>
              <p className="text-xl sm:text-2xl font-black text-orange-500 font-mono tracking-tight animate-fade-in">
                {profileData?.streak_count || 1} { (profileData?.streak_count || 1) === 1 ? "Day" : "Days" }
              </p>
            </div>
            <div className="h-8 w-[1px] bg-[var(--border)]"></div>
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Personal Best</p>
              <p className="text-xl sm:text-2xl font-black text-amber-500 font-mono tracking-tight">
                {profileData?.longest_streak || 1} { (profileData?.longest_streak || 1) === 1 ? "Day" : "Days" }
              </p>
            </div>
          </div>
        </div>

        {/* 7-Day Consistency Row (Mon-Sun / Last 7 Days) */}
        <div className="mt-6 relative z-10">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <span>📆</span> 7-Day Consistency Tracker
          </h4>
          <div className="grid grid-cols-7 gap-2 sm:gap-4 bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border)]">
            {getLast7Days().map((day) => {
              return (
                <div key={day.dateStr} className={`flex flex-col items-center p-2.5 rounded-xl border transition-all duration-300 ${
                  day.isCompleted
                    ? "bg-orange-500/5 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.06)]"
                    : day.isToday
                      ? "bg-[var(--bg-card)] border-[var(--accent)]"
                      : "bg-[var(--bg-card)] border-[var(--border)]"
                }`}>
                  <span className="text-[10px] font-mono font-bold text-slate-400 mb-1">
                    {day.label}
                  </span>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                    day.isCompleted
                      ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse"
                      : "bg-[var(--bg-secondary)] text-slate-600 border border-[var(--border)]"
                  }`}>
                    {day.isCompleted ? "🔥" : "💤"}
                  </div>
                  <span className="text-[8px] font-mono font-semibold text-slate-500 mt-1">
                    {day.isToday ? "Today" : day.dateStr.slice(8, 10)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Badges & Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 relative z-10">
          {[
            { title: "Habit Builder", days: 3, xp: 50, icon: "🌱", color: "#10b981", bg: "rgba(16,185,129,0.05)" },
            { title: "Consistency King", days: 7, xp: 150, icon: "👑", color: "#f59e0b", bg: "rgba(245,158,11,0.05)" },
            { title: "AI Unstoppable", days: 14, xp: 300, icon: "🚀", color: "#ec4899", bg: "rgba(236,72,153,0.05)" }
          ].map((milestone) => {
            const current = profileData?.streak_count || 1;
            const pct = Math.min(100, Math.round((current / milestone.days) * 100));
            const completed = current >= milestone.days;
            return (
              <div key={milestone.title} className="glass-card rounded-2xl p-4 border flex flex-col justify-between gap-3 border-[var(--border)]"
                style={{
                  background: milestone.bg,
                  borderColor: completed ? milestone.color : "var(--border)",
                  boxShadow: completed ? `0 0 12px ${milestone.color}15` : "none"
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: completed ? milestone.color : "var(--bg-secondary)", color: completed ? "white" : "slate-400" }}>
                    {milestone.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-black">{milestone.title}</h5>
                    <p className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">{milestone.days}-Day Streak • +{milestone.xp} XP</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500">
                    <span>{completed ? "Unlocked! 🎉" : "Progress"}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden border border-[var(--border)]">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: completed ? milestone.color : "var(--accent)" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════ COGNITIVE ROADMAP CANVASES & INTERACTIVE BLUEPRINTS ═══════ */}
      <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-md border border-[var(--border)]">
        <div className="absolute top-[-25%] right-[-15%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[var(--accent-soft)] to-transparent blur-[100px] pointer-events-none"></div>

        {/* Canvas Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 mb-6 border-b border-[var(--border)] relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-float">🗺️</span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Cognitive Roadmap Hub
              </h3>
              <p className="text-xs font-mono font-bold mt-0.5 text-slate-400">
                Select, explore, and check off specialized learning trails
              </p>
            </div>
          </div>

          {/* Track Selector Tab Buttons */}
          <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto py-1">
            {roadmap && roadmap.length > 0 && (
              <button
                onClick={() => setSelectedRoadmapTrack("calibrated")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 border ${
                  selectedRoadmapTrack === "calibrated"
                    ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-text)] shadow-[var(--shadow-glow)]"
                    : "bg-[var(--bg-secondary)] border-[var(--border)] hover:border-slate-400 text-slate-400"
                }`}
                style={{ fontSize: "12px" }}
              >
                🎯 Calibrated Path
              </button>
            )}
            {Object.entries(staticRoadmaps).map(([key, value]) => {
              const isSelected = selectedRoadmapTrack === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedRoadmapTrack(key)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 border ${
                    isSelected
                      ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-text)] shadow-[var(--shadow-glow)]"
                      : "bg-[var(--bg-secondary)] border-[var(--border)] hover:border-slate-400 text-slate-400"
                  }`}
                  style={{ fontSize: "12px" }}
                >
                  <span>{value.icon}</span>
                  <span>{value.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Canvas Main Area */}
        <div className="relative z-10">
          {/* CASE A: CALIBRATED ROADMAP TIMELINE */}
          {selectedRoadmapTrack === "calibrated" && roadmap && roadmap.length > 0 && (
            <div className="space-y-8 animate-fadeIn">
              {/* Gamified Mastery Summary Banner */}
              {(() => {
                const totalRoadmapTasks = roadmap.reduce((acc, curr) => acc + (curr.tasks?.length || 0), 0);
                const completedRoadmapTasks = profileData?.completed_tasks?.length || 0;
                const overallPercent = totalRoadmapTasks > 0 ? Math.round((completedRoadmapTasks / totalRoadmapTasks) * 100) : 0;

                return (
                  <div className="glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-[var(--border)] bg-[var(--bg-sidebar)]">
                    <div className="absolute top-[-40%] left-[-10%] w-[250px] h-[250px] bg-gradient-to-tr from-[var(--accent-soft)] to-transparent blur-[70px] pointer-events-none"></div>
                    
                    {/* Info / Progress Text */}
                    <div className="flex-1 space-y-2 z-10 w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl animate-float">🔥</span>
                        <div>
                          <h4 className="text-sm font-black tracking-tight">
                            Personalized Mastery Roadmap Progress
                          </h4>
                          <p className="text-[10px] font-mono text-[var(--accent-text)] font-bold uppercase mt-0.5">
                            ⚡ Streak: {profileData?.streak_count || 1} Days • 👑 XP: {profileData?.xp_points || 100} XP
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                          <span>Objectives Mastered: {completedRoadmapTasks} / {totalRoadmapTasks}</span>
                          <span className="text-[var(--accent-text)]">{overallPercent}%</span>
                        </div>
                        <div className="w-full bg-[var(--bg-secondary)] h-2.5 rounded-full overflow-hidden border border-[var(--border)] relative">
                          <div 
                            className="h-full rounded-full transition-all duration-700 bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]"
                            style={{ width: `${overallPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Badge/Status icon */}
                    <div className="z-10 flex-shrink-0 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 w-full md:w-auto md:min-w-[140px] text-center shadow-sm">
                      <div>
                        <span className="text-3xl block">🏆</span>
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider block mt-1 text-slate-400">
                          {overallPercent === 100 ? "AI Architect" : "OS Initiate"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Roadmap Node Timeline */}
              <div className="relative pl-9 sm:pl-12 space-y-8 before:absolute before:left-[16px] sm:before:left-[20px] before:top-2 before:bottom-2 before:w-[3px] before:bg-[var(--border)]">
                {roadmap.map((node, index) => {
                  const isActive = node.status === "active";
                  const isCompleted = node.status === "completed";
                  const isLocked = node.status === "locked";

                  let circleBg = "var(--bg-card)";
                  let circleBorder = "var(--border)";
                  let circleTextColor = "var(--text-muted)";
                  let cardBorder = "var(--border)";
                  let cardGlow = "none";

                  if (isActive) {
                    circleBg = "var(--accent)";
                    circleBorder = "var(--accent)";
                    circleTextColor = "var(--text-inverse)";
                    cardBorder = "var(--accent)";
                    cardGlow = "0 0 16px var(--accent-glow)";
                  } else if (isCompleted) {
                    circleBg = "var(--success)";
                    circleBorder = "var(--success)";
                    circleTextColor = "var(--text-inverse)";
                  }

                  // Extract tasks and compute weekly progress
                  const nodeTasks = node.tasks || [];
                  const completedWeeklyTasks = nodeTasks.filter((task: string) => 
                    profileData?.completed_tasks?.includes(`${node.node_id}:${task}`)
                  ).length;
                  const weeklyPercent = nodeTasks.length > 0 ? Math.round((completedWeeklyTasks / nodeTasks.length) * 100) : 0;

                  return (
                    <div key={node.node_id} className="relative flex flex-col gap-2 transition-all hover:translate-x-1 duration-200">
                      {/* Step Circle Indicator */}
                      <div 
                        className={`absolute left-[-32px] sm:left-[-38px] w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full flex items-center justify-center font-black text-xs border-2 z-15 transition-all duration-300 ${
                          isActive ? "animate-pulse" : ""
                        }`}
                        style={{
                          background: circleBg,
                          borderColor: circleBorder,
                          color: circleTextColor,
                          boxShadow: isActive ? "0 0 10px var(--accent)" : "none"
                        }}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>

                      {/* Stage Card */}
                      <div className="flex-1 glass-card rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-5 transition-all duration-300 border border-[var(--border)]"
                        style={{
                          borderColor: cardBorder,
                          boxShadow: cardGlow
                        }}
                      >
                        {/* Card header: stage details */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="text-base font-extrabold" style={{ color: isActive ? "var(--accent-text)" : "var(--text-primary)" }}>
                                Week {index + 1}: {node.title}
                              </h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                                isActive 
                                  ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]" 
                                  : isCompleted 
                                    ? "bg-green-500/10 text-green-500 border-green-500/25" 
                                    : "bg-gray-500/10 text-gray-500 border-gray-500/25"
                              }`}>
                                {node.status}
                              </span>
                            </div>
                            <p className="text-xs font-medium leading-relaxed text-[var(--text-secondary)]">
                              {node.description}
                            </p>
                          </div>

                          {/* Stage-level progress metrics */}
                          {nodeTasks.length > 0 && !isLocked && (
                            <div className="flex flex-col items-stretch md:items-end w-full md:w-auto min-w-[120px] space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                                <span>Stage Check: {completedWeeklyTasks} / {nodeTasks.length}</span>
                                <span style={{ color: weeklyPercent === 100 ? "var(--success)" : "var(--accent-text)" }}>{weeklyPercent}%</span>
                              </div>
                              <div className="w-full md:w-32 bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden border border-[var(--border)] relative">
                                <div 
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${weeklyPercent}%`,
                                    background: weeklyPercent === 100 ? "var(--success)" : "var(--accent)"
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {isLocked && (
                            <div className="flex items-center gap-1.5 text-xs font-mono font-black text-[var(--text-muted)]">
                              <span>Locked Stage</span>
                              <span>🔒</span>
                            </div>
                          )}
                        </div>

                        {/* Actionable Subtask Checkboxes (Notion / Duolingo Style) */}
                        {nodeTasks.length > 0 && !isLocked && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-up">
                            {nodeTasks.map((task: string, i: number) => {
                              const isChecked = !!profileData?.completed_tasks?.includes(`${node.node_id}:${task}`);
                              return (
                                <button
                                  key={i}
                                  onClick={async () => {
                                    addLog(`[SYSTEM] Syncing task checklist item: "${task}"...`, "system");
                                    try {
                                      const res = await fetch(`${API_BASE_URL}/api/v1/profile/roadmap/task/toggle`, {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                          "Authorization": `Bearer ${user.uid}`
                                        },
                                        body: JSON.stringify({
                                          node_id: node.node_id,
                                          task_text: task,
                                          completed: !isChecked
                                        })
                                      });
                                      if (res.ok) {
                                        await res.json();
                                        addLog(`[SUCCESS] Task Checklist updated. XP and milestones recalculated!`, "success");
                                        fetchProfile();
                                      } else {
                                        throw new Error(`HTTP ${res.status}`);
                                      }
                                    } catch {
                                      addLog(`[ERROR] Connection failed. Sandbox telemetry updates suspended.`, "error");
                                    }
                                  }}
                                  className="flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:bg-[var(--bg-secondary)] border-[var(--border)]"
                                  style={{
                                    borderColor: isChecked ? "var(--success)" : "var(--border)",
                                    background: isChecked ? "rgba(34,197,94,0.02)" : "var(--bg-card)"
                                  }}
                                >
                                  <div className="w-5 h-5 rounded-md border flex items-center justify-center font-bold text-[10px] flex-shrink-0 transition-all duration-300"
                                    style={{
                                      borderColor: isChecked ? "var(--success)" : "var(--border)",
                                      background: isChecked ? "var(--success)" : "transparent",
                                      color: isChecked ? "white" : "transparent"
                                    }}>
                                    ✓
                                  </div>
                                  <span className="text-[11px] font-semibold leading-snug break-words flex-1"
                                    style={{ 
                                      color: isChecked ? "var(--text-muted)" : "var(--text-primary)",
                                      textDecoration: isChecked ? "line-through" : "none"
                                    }}>
                                    {task}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CASE B: STANDARD DETAILED BRANCHING MAPS */}
          {selectedRoadmapTrack !== "calibrated" && staticRoadmaps[selectedRoadmapTrack] && (
            <div className="space-y-12 py-4">
              {/* Track Details Card */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="text-base font-extrabold flex items-center gap-2">
                    <span>{staticRoadmaps[selectedRoadmapTrack].icon}</span>
                    <span>Integrated {staticRoadmaps[selectedRoadmapTrack].title} Curriculum Blueprint</span>
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
                    {staticRoadmaps[selectedRoadmapTrack].description} Click any sub-node card to open its detailed checklist.
                  </p>
                </div>
                
                {/* Track overall checklist progress */}
                {(() => {
                  const track = staticRoadmaps[selectedRoadmapTrack];
                  let totalTasks = 0;
                  let completedTasks = 0;
                  track.nodes.forEach((node) => {
                    node.subNodes.forEach((sub) => {
                      totalTasks += sub.checklist.length;
                      sub.checklist.forEach((task) => {
                        if (checkedTasks[`${sub.id}-${task}`]) {
                          completedTasks++;
                        }
                      });
                    });
                  });

                  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                  return (
                    <div className="flex items-center gap-2.5 font-mono text-[10px] font-bold self-stretch md:self-auto bg-[var(--bg-card)] border border-[var(--border)] px-4 py-2 rounded-xl">
                      <span>Curriculum: {completedTasks} / {totalTasks}</span>
                      <span className="text-[var(--accent)]">{pct}% Complete</span>
                    </div>
                  );
                })()}
              </div>

              {/* Blueprint Nodes Timeline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {staticRoadmaps[selectedRoadmapTrack].nodes.map((node, nodeIdx) => (
                  <div key={node.id} className="glass-card rounded-2xl p-6 border border-[var(--border)] space-y-4 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--border)]">
                      <span className="w-6 h-6 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">
                        {nodeIdx + 1}
                      </span>
                      <h4 className="text-xs font-mono font-black uppercase tracking-wider text-slate-200">{node.title}</h4>
                    </div>

                    <div className="space-y-2.5">
                      {node.subNodes.map((sub) => {
                        const total = sub.checklist.length;
                        const completed = sub.checklist.filter((t) => checkedTasks[`${sub.id}-${t}`]).length;
                        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                        const isActiveDetail = activeDetailSubNode?.id === sub.id;

                        return (
                          <div
                            key={sub.id}
                            onClick={() => setActiveDetailSubNode(sub)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:bg-[var(--bg-secondary)] flex justify-between items-center gap-4 ${
                              isActiveDetail 
                                ? "border-[var(--accent)] bg-[var(--accent-soft)]" 
                                : "border-[var(--border)] bg-[var(--bg-card)]"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <h5 className="text-[11px] font-bold text-slate-200 truncate">{sub.title}</h5>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">{sub.description}</p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[9px] font-mono font-bold text-slate-400">{completed}/{total}</span>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: pct === 100 ? "var(--success)" : pct > 0 ? "var(--accent)" : "transparent", border: pct === 0 ? "1px solid var(--border)" : "none" }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sub-node Checklist Viewer Drawer/Modal */}
              {activeDetailSubNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn p-4">
                  <div className="glass-card max-w-lg w-full rounded-3xl p-6 md:p-8 border border-[var(--accent)] text-left space-y-6 relative overflow-hidden shadow-2xl animate-scale-in"
                    style={{ background: "#121218" }}>
                    <div className="absolute top-[-30%] left-[-20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[var(--accent-soft)] to-transparent blur-[80px] pointer-events-none"></div>

                    <div className="flex justify-between items-start gap-4 pb-4 border-b border-[var(--border)] relative z-10">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider block">Integrated Sandbox Blueprint Checklist</span>
                        <h3 className="text-base sm:text-lg font-black text-white mt-0.5">{activeDetailSubNode.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 leading-normal">{activeDetailSubNode.description}</p>
                      </div>
                      <button
                        onClick={() => setActiveDetailSubNode(null)}
                        className="w-8 h-8 rounded-xl border border-[var(--border)] hover:border-slate-500 flex items-center justify-center font-bold text-slate-400 hover:text-white cursor-pointer transition-all flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Actionable Milestone Checklist</h4>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {activeDetailSubNode.checklist.map((task, i) => {
                          const taskId = `${activeDetailSubNode.id}-${task}`;
                          const isChecked = !!checkedTasks[taskId];

                          return (
                            <button
                              key={i}
                              onClick={() => toggleChecklistTask(taskId)}
                              className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:bg-[var(--bg-secondary)] border-[var(--border)]"
                              style={{
                                borderColor: isChecked ? "var(--success)" : "var(--border)",
                                background: isChecked ? "rgba(34,197,94,0.02)" : "var(--bg-card)"
                              }}
                            >
                              <div className="w-5 h-5 rounded-md border flex items-center justify-center font-bold text-xs"
                                style={{
                                  borderColor: isChecked ? "var(--success)" : "var(--border)",
                                  background: isChecked ? "var(--success)" : "transparent",
                                  color: isChecked ? "white" : "transparent"
                                }}>
                                ✓
                              </div>
                              <span className="text-xs font-semibold leading-snug"
                                style={{ 
                                  color: isChecked ? "var(--text-muted)" : "var(--text-primary)",
                                  textDecoration: isChecked ? "line-through" : "none"
                                }}>
                                {task}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Exercises */}
                    <div className="pt-6 border-t border-[var(--border)] mt-8 space-y-4 relative z-10">
                      <div className="bg-[var(--accent-soft)] border border-[var(--accent)] rounded-2xl p-4 text-[10px] sm:text-xs font-mono leading-relaxed text-[var(--accent-text)] font-semibold">
                        💡 Setup and verify this curriculum segment inside your AIOS sandboxed docker containers directly from the Agent Terminal tab!
                      </div>
                      
                      <button
                        onClick={() => {
                          setActiveDetailSubNode(null);
                          addLog(`[SYSTEM] Practice Exercise Loaded: Active study session spawned for blueprint node "${activeDetailSubNode.title}"`, "info");
                        }}
                        className="btn-accent w-full py-4 rounded-2xl font-black text-xs uppercase cursor-pointer transition-all active:scale-95"
                      >
                        Launch Sandbox Practice Session 🪐
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Console + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Console Terminal */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 flex flex-col min-h-[400px] border border-[var(--border)]">
          <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex items-center justify-center bg-[var(--accent-soft)]">
                <span className="w-1.5 h-1.5 rounded-full animate-ping bg-[var(--accent)]"></span>
              </span>
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">Cognitive OS Console</h3>
            </div>
            <button 
              onClick={() => setLogs([])}
              className="text-[10px] font-mono cursor-pointer transition-colors text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 rounded-xl p-4 font-mono text-[12px] leading-7 overflow-y-auto space-y-1 max-h-[300px] bg-[var(--bg-code)] text-[var(--text-code)] border border-white/5">
            {logs.map((log, idx) => {
              let color = "#a1a1aa";
              if (log.type === "system") color = "#818cf8";
              else if (log.type === "success") color = "#4ade80";
              else if (log.type === "config") color = "#22d3ee";
              else if (log.type === "error") color = "#f87171";
              else if (log.type === "info") color = "#fbbf24";
              return (
                <div key={idx} style={{ color }} className="font-semibold">
                  {log.text}
                </div>
              );
            })}
            <div className="pt-2 flex items-center gap-1 border-t border-white/5 text-slate-200">
              <span className="font-bold text-[var(--accent)]">$</span>
              <span className="animate-cursor-blink">
                aios-agent --active
              </span>
            </div>
          </div>
        </div>

        {/* Developer Tools + Module Maps */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-6 border border-[var(--border)]">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-4 pb-2 border-b border-[var(--border)] text-[var(--accent-text)]">
              Developer Tools
            </h3>
            <div className="space-y-3">
              <button 
                onClick={fetchStatus}
                className="btn-accent w-full py-2.5 px-4 rounded-xl text-xs cursor-pointer"
              >
                Sync API Gateway Status
              </button>
              <button 
                onClick={() => {
                  addLog("[SYSTEM] Instantiating Sandboxed Docker Container...", "system");
                  setTimeout(() => addLog("[SUCCESS] Sandbox online at localhost:9001 (Ubuntu 22.04)", "success"), 1000);
                }}
                className="btn-outline w-full py-2.5 px-4 rounded-xl text-xs cursor-pointer"
              >
                Launch Sandbox Container
              </button>
              <button 
                onClick={() => {
                  addLog("[SYSTEM] Running standard test execution suite...", "system");
                  setTimeout(() => addLog("[SUCCESS] Complete check passed. 0 errors, 12 warnings.", "success"), 800);
                }}
                className="btn-outline w-full py-2.5 px-4 rounded-xl text-xs cursor-pointer"
              >
                Run Test Suites
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-[var(--border)]">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-4 pb-2 border-b border-[var(--border)] text-slate-400">
              Module Maps
            </h3>
            <ul className="space-y-3 font-mono text-[11px]">
              <li className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                <span className="font-bold text-[var(--accent-text)]">/frontend</span>
                <span className="font-semibold text-[var(--text-secondary)]">Next.js v16</span>
              </li>
              <li className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                <span className="font-bold text-[var(--accent-text)]">/backend</span>
                <span className="font-semibold text-[var(--text-secondary)]">FastAPI v0.110</span>
              </li>
              <li className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                <span className="font-bold text-[var(--accent-text)]">/rag-system</span>
                <span className="font-semibold text-[var(--text-secondary)]">LlamaIndex/Qdrant</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
