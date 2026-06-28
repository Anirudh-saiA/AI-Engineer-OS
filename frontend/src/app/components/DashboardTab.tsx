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
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              Daily Plan
            </h3>
            <p className="text-[13px] font-medium text-slate-400 mt-1">
              Complete your daily tasks to stay on track and earn XP.
            </p>
          </div>

          {/* Progress summary badge */}
          {(() => {
            const total = dailyTasks.length;
            const completed = dailyTasks.filter((t) => t.completed).length;
            return (
              <div className="text-[13px] font-medium text-slate-400">
                Completed: {completed} / {total}
              </div>
            );
          })()}
        </div>

        {/* Planner Checklist List */}
        {plannerLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-orange-100 border-t-orange-500 animate-spin"></div>
            <p className="text-[13px] text-slate-400">Loading today's tasks...</p>
          </div>
        ) : (!dailyTasks || dailyTasks.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-[13px] text-slate-400">Your tasks are being prepared...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 animate-fadeIn">
            {dailyTasks.map((task) => {
              let badgeBg = "bg-green-50";
              let badgeText = "Basics";
              let badgeColor = "text-green-600";
              let icon = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
              
              if (task.category === "dsa") {
                badgeBg = "bg-blue-50";
                badgeText = "DSA";
                badgeColor = "text-blue-600";
                icon = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
              } else if (task.category === "coding") {
                badgeBg = "bg-purple-50";
                badgeText = "Coding";
                badgeColor = "text-purple-600";
                icon = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;
              } else if (task.category === "revision") {
                badgeBg = "bg-amber-50";
                badgeText = "Revision";
                badgeColor = "text-amber-600";
                icon = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
              }

              return (
                <button
                  key={task.id}
                  onClick={() => handleToggleDailyTask(task.id)}
                  className={`bg-white rounded-2xl p-5 text-left border cursor-pointer transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between gap-4 h-[160px] ${
                    task.completed ? "border-green-400 shadow-sm" : "border-slate-200 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="space-y-3 w-full">
                    {/* Header category badge + icon */}
                    <div className="flex items-center justify-between w-full">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${badgeBg} ${badgeColor}`}>
                        {badgeText}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${badgeBg} ${badgeColor}`}>
                        {icon}
                      </div>
                    </div>

                    <p className={`text-[13px] font-medium leading-snug line-clamp-3 ${task.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {task.task_text}
                    </p>
                  </div>

                  <div className="flex items-center justify-between w-full mt-auto">
                    <span className="font-bold text-[13px] text-orange-500">+20 XP</span>
                    <div className="flex items-center gap-1.5 text-slate-300 text-[12px] font-medium">
                      {task.completed ? (
                        <>
                          <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                          <span className="text-green-500">Done</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
                          <span>Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════ STREAK CONSISTENCY COACH ═══════ */}
      <div className="relative mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 relative z-10">
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              Consistency Tracker
            </h3>
            <p className="text-[13px] font-medium text-slate-400 mt-1">
              Track your daily progress and consistency.
            </p>
          </div>

          {/* Streak Stats Badge */}
          <div className="flex items-center gap-6">
            <div className="text-right flex items-center gap-2">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Current streak</p>
                <p className="text-xl font-black text-slate-900 leading-none mt-1">
                  {profileData?.streak_count || 1} <span className="text-[13px] font-bold text-slate-500 font-sans">Day</span>
                </p>
              </div>
              <span className="text-2xl ml-1">🔥</span>
            </div>
            <div className="h-10 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Personal best</p>
                <p className="text-xl font-black text-slate-900 leading-none mt-1">
                  {profileData?.longest_streak || 1} <span className="text-[13px] font-bold text-slate-500 font-sans">Days</span>
                </p>
              </div>
              <span className="text-2xl ml-1">🏆</span>
            </div>
          </div>
        </div>

        {/* 7-Day Consistency Row (Mon-Sun / Last 7 Days) */}
        <div className="relative z-10">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            7-DAY CONSISTENCY TRACKER
          </h4>
          <div className="grid grid-cols-7 gap-2 sm:gap-4">
            {getLast7Days().map((day) => {
              const isToday = day.isToday;
              const isCompleted = day.isCompleted;

              if (isToday) {
                return (
                  <div key={day.dateStr} className="flex flex-col items-center justify-center p-4 rounded-xl border border-[#120f2b] bg-[#120f2b] text-white shadow-md transition-all duration-300">
                    <span className="text-[13px] font-medium text-slate-300 mb-2">{day.label}</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-orange-500 bg-white/10 mb-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C12 2 9 6 9 10C9 13 11.5 15 11.5 15C11.5 15 11 13.5 12 12C12 12 15 14.5 15 17C15 19.5 13 21 12 21C9 21 7 19 7 16C7 13.5 8 11.5 8 11.5C8 11.5 5 14.5 5 18C5 21.5 8 24 12 24C16 24 19 21 19 17C19 12 15 8 12 2Z"/></svg>
                    </div>
                    <span className="text-[14px] font-black">{day.dateStr.slice(8, 10)}</span>
                  </div>
                );
              }

              if (isCompleted) {
                return (
                  <div key={day.dateStr} className="flex flex-col items-center justify-center p-4 rounded-xl border border-green-100 bg-green-50/30 text-green-600 transition-all duration-300">
                    <span className="text-[13px] font-medium mb-2">{day.label}</span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white bg-green-500 mb-3 mt-1 shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-[14px] font-black">{day.dateStr.slice(8, 10)}</span>
                  </div>
                );
              }

              return (
                <div key={day.dateStr} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-white text-slate-400 transition-all duration-300">
                  <span className="text-[13px] font-medium mb-2">{day.label}</span>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-200 mb-3 mt-1">
                  </div>
                  <span className="text-[14px] font-black">{day.dateStr.slice(8, 10)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Badges & Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 relative z-10">
          {[
            { title: "Habit Builder", days: 3, xp: 150, icon: "🔥", color: "bg-orange-500", text: "text-orange-500" },
            { title: "Consistency King", days: 7, xp: 180, icon: "👑", color: "bg-blue-500", text: "text-blue-500" },
            { title: "Unstoppable", days: 14, xp: 300, icon: "⚡", color: "bg-purple-500", text: "text-purple-500" }
          ].map((milestone) => {
            const current = profileData?.streak_count || 1;
            const pct = Math.min(100, Math.round((current / milestone.days) * 100));
            const completed = current >= milestone.days;
            return (
              <div key={milestone.title} className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <span className="text-xl mt-1">{milestone.icon}</span>
                    <div>
                      <h5 className="text-[14px] font-black text-slate-900">{milestone.title}</h5>
                      <p className="text-[12px] font-medium text-slate-400">{milestone.days}-Day Streak</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-orange-500 bg-amber-50">
                    +{milestone.xp} XP
                  </span>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center text-[12px] font-medium text-slate-400">
                    <span>Progress</span>
                    <span className={milestone.text}>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${milestone.color}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <button className={`text-[12px] font-bold mt-2 text-left w-fit ${milestone.text}`}>
                  View details &gt;
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
