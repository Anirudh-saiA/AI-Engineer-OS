import React from "react";
import ActivityHeatmap from "./ActivityHeatmap";
import { Map, ArrowRight, Sparkles, BookOpen, ChevronRight } from "lucide-react";

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
  setActiveTab?: (tab: any) => void;
}

const AVAILABLE_TRACKS = [
  {
    id: "ai_engineer",
    label: "AI Engineer",
    description: "Master embeddings, RAG pipelines, vector databases, and cognitive AI agents.",
    icon: "🤖",
    color: "from-blue-600 to-indigo-600",
    lightColor: "bg-blue-50 border-blue-100 text-blue-700",
  },
  {
    id: "data_analyst",
    label: "Data Analyst",
    description: "Learn SQL, Python data analysis, dashboards, and business intelligence tools.",
    icon: "📊",
    color: "from-violet-600 to-purple-600",
    lightColor: "bg-violet-50 border-violet-100 text-violet-700",
  },
  {
    id: "backend_engineer",
    label: "Backend Engineer",
    description: "Build APIs, microservices, databases, and scalable server-side systems.",
    icon: "⚙️",
    color: "from-emerald-600 to-teal-600",
    lightColor: "bg-emerald-50 border-emerald-100 text-emerald-700",
  },
];

export default function DashboardTab({
  profileData,
  roadmap,
  selectedRoadmapTrack,
  setSelectedRoadmapTrack,
  staticRoadmaps,
  setActiveTab,
}: DashboardTabProps) {

  const hasStarted = roadmap && roadmap.length > 0;

  // Active node from roadmap
  const activeNode = roadmap?.find((node: any) => node.status === "active") || roadmap?.[0] || null;

  // Progress calculation
  const totalActiveTasks = activeNode?.tasks?.length || 0;
  const completedActiveTasks = activeNode?.tasks?.filter((task: string) =>
    profileData?.completed_tasks?.includes(`${activeNode.node_id}:${task}`)
  ).length || 0;
  const activePercent = totalActiveTasks > 0 ? Math.round((completedActiveTasks / totalActiveTasks) * 100) : 0;

  const currentTrack = AVAILABLE_TRACKS.find(t => t.id === selectedRoadmapTrack) || AVAILABLE_TRACKS[0];
  const completedTasks = profileData?.completed_tasks?.length || 0;

  return (
    <div className="space-y-8">

      {hasStarted ? (
        /* ─── USER HAS STARTED A ROADMAP: Show Continue Card ─── */
        <div>
          {/* Header greeting */}
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900">
              Welcome back{profileData?.name ? `, ${profileData.name.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">Pick up where you left off on your learning journey.</p>
          </div>

          {/* Continue Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-lg shadow-blue-200 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold bg-white/20 text-white/90 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {currentTrack.icon} {currentTrack.label} Track
                    </span>
                  </div>
                  <h2 className="text-2xl font-black leading-tight">
                    {activeNode?.title || "Continue your path"}
                  </h2>
                  <p className="text-blue-100 text-sm mt-2 leading-relaxed max-w-lg">
                    {activeNode?.description || "Keep going — you're making great progress."}
                  </p>
                </div>
                <div className="hidden md:flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl">
                    {currentTrack.icon}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-blue-100 font-medium">Module Progress</span>
                  <span className="font-black text-white text-lg">{activePercent}%</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${activePercent}%` }}
                  />
                </div>
                <p className="text-blue-200 text-xs mt-2">
                  {completedActiveTasks} of {totalActiveTasks} tasks completed
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setActiveTab && setActiveTab("roadmaps")}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Continue Learning</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab && setActiveTab("roadmaps")}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors cursor-pointer border border-white/20"
                >
                  <Map className="w-4 h-4" />
                  <span>View Full Roadmap</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs text-center">
              <p className="text-2xl font-black text-gray-900">{profileData?.streak_count || 0}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Day Streak 🔥</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs text-center">
              <p className="text-2xl font-black text-gray-900">{completedTasks}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Tasks Done ✅</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs text-center col-span-2 sm:col-span-1">
              <p className="text-2xl font-black text-gray-900">{profileData?.longest_streak || 0}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Best Streak 🏆</p>
            </div>
          </div>
        </div>

      ) : (
        /* ─── USER HAS NOT STARTED: Show Roadmap Selection ─── */
        <div>
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-200">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Choose Your Learning Path</h1>
            <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
              Select a roadmap to begin your structured AI engineering journey. You can switch tracks at any time.
            </p>
          </div>

          {/* Roadmap selection cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {AVAILABLE_TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => {
                  setSelectedRoadmapTrack(track.id);
                  setActiveTab && setActiveTab("roadmaps");
                }}
                className="group bg-white border border-gray-200 hover:border-blue-300 rounded-2xl p-6 text-left shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${track.color} flex items-center justify-center text-2xl shadow-sm`}>
                    {track.icon}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{track.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{track.description}</p>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${track.lightColor}`}>
                    <BookOpen className="w-3 h-3" />
                    Start Roadmap
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ BOTTOM: ACTIVITY HEATMAP ═══════ */}
      <ActivityHeatmap profileData={profileData} />
    </div>
  );
}
