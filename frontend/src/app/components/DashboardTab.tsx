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

    </div>
  );
}
