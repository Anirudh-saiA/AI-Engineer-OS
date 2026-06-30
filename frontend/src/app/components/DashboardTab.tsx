import React from "react";
import { 
  Flame, 
  Trophy, 
  Map, 
  CheckSquare, 
  ArrowRight, 
  Activity, 
  Bell, 
  Play, 
  Terminal, 
  Search, 
  Settings, 
  Clock, 
  CheckCircle2, 
  Server, 
  UserCheck 
} from "lucide-react";

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
  setActiveTab,
}: DashboardTabProps) {

  // ── 1. Weekly Consistency Calendar (GitHub Style) Data Generation ──
  const getContributionData = () => {
    const data = [];
    const today = new Date();
    
    // Generate 16 weeks = 112 days
    const startDate = new Date();
    startDate.setDate(today.getDate() - 111);
    
    // Align with Sunday start to match grid rows
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);
    
    for (let i = 0; i < 112; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dateVal = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateVal}`;
      
      const hasActivity = profileData?.active_days?.includes(dateStr) || false;
      
      data.push({
        dateStr,
        hasActivity,
        dayOfWeek: currentDate.getDay(),
        month: currentDate.toLocaleString('default', { month: 'short' }),
        dayOfMonth: currentDate.getDate()
      });
    }
    return data;
  };

  const contributionData = getContributionData();
  const weeks: Array<typeof contributionData> = [];
  for (let w = 0; w < 16; w++) {
    weeks.push(contributionData.slice(w * 7, (w + 1) * 7));
  }

  // Find month labels to render above columns
  const monthLabels: Array<{ text: string; colSpan: number }> = [];
  let currentMonth = "";
  let currentMonthSpan = 0;

  weeks.forEach((week, wIdx) => {
    const firstDayOfWeek = week[0];
    if (firstDayOfWeek.month !== currentMonth) {
      if (currentMonth !== "") {
        monthLabels.push({ text: currentMonth, colSpan: currentMonthSpan });
      }
      currentMonth = firstDayOfWeek.month;
      currentMonthSpan = 1;
    } else {
      currentMonthSpan++;
    }
    if (wIdx === weeks.length - 1) {
      monthLabels.push({ text: currentMonth, colSpan: currentMonthSpan });
    }
  });

  // ── 2. Module Progress Calculation ──
  const getModuleProgress = (nodeId: string) => {
    const track = staticRoadmaps["ai_engineer"];
    const node = track?.nodes.find(n => n.id === nodeId);
    if (!node) return 0;
    
    let total = 0;
    let completed = 0;
    
    node.subNodes.forEach(sub => {
      const tasks = sub.checklist || [];
      total += tasks.length;
      tasks.forEach(task => {
        const taskId = `${sub.id}:${task}`;
        if (profileData?.completed_tasks?.includes(taskId)) {
          completed++;
        }
      });
    });
    
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // ── 3. Active Learning Roadmap Node & Upcoming Tasks Extraction ──
  const activeNode = roadmap?.find(node => node.status === "active") || roadmap?.[0] || null;
  
  const getUpcomingTasks = () => {
    const upcoming: Array<{ id: string; title: string; category: string }> = [];
    
    // Prioritize uncompleted tasks from active node
    if (activeNode && activeNode.tasks) {
      activeNode.tasks.forEach((task: string) => {
        const taskId = `${activeNode.node_id}:${task}`;
        const isDone = profileData?.completed_tasks?.includes(taskId);
        if (!isDone) {
          upcoming.push({
            id: taskId,
            title: task,
            category: activeNode.title || "Active Module"
          });
        }
      });
    }
    
    // Fill remaining up to 4 tasks from static curriculum
    if (upcoming.length < 4) {
      const track = staticRoadmaps["ai_engineer"];
      if (track) {
        track.nodes.forEach(node => {
          node.subNodes.forEach(sub => {
            sub.checklist.forEach(task => {
              const taskId = `${sub.id}:${task}`;
              const isDone = profileData?.completed_tasks?.includes(taskId);
              
              const alreadyAdded = upcoming.some(u => u.id === taskId);
              if (!isDone && !alreadyAdded && upcoming.length < 4) {
                upcoming.push({
                  id: taskId,
                  title: task,
                  category: sub.title
                });
              }
            });
          });
        });
      }
    }
    
    return upcoming.slice(0, 4);
  };

  const upcomingTasks = getUpcomingTasks();

  // Progress variables for active node
  const totalActiveTasks = activeNode?.tasks?.length || 0;
  const completedActiveTasks = activeNode?.tasks?.filter((task: string) => 
    profileData?.completed_tasks?.includes(`${activeNode.node_id}:${task}`)
  ).length || 0;
  const activePercent = totalActiveTasks > 0 ? Math.round((completedActiveTasks / totalActiveTasks) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* ═══════ OVERVIEW CARDS (4 KPI CARDS) ═══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Current Streak */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Current Streak
            </p>
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {profileData?.streak_count || 1} <span className="text-xs font-medium text-gray-500">days</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Best Streak */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Best Streak
            </p>
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {profileData?.longest_streak || 1} <span className="text-xs font-medium text-gray-500">days</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Active Roadmaps */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Active Roadmap
            </p>
            <p className="text-base font-bold text-gray-900 leading-tight truncate max-w-[150px]">
              {roadmap && roadmap.length > 0 ? staticRoadmaps[selectedRoadmapTrack]?.title || "AI Engineer" : "AI Engineer"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Map className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Completed Tasks */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Completed Tasks
            </p>
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {profileData?.completed_tasks?.length || 0} <span className="text-xs font-medium text-gray-500">tasks</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ═══════ MAIN CONTENT (2-COLUMN LAYOUT) ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN: WORKSPACE DATA ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Block 1: Weekly Consistency Calendar */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Activity className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Consistency Tracker</h3>
            </div>
            
            {/* Calendar grid container */}
            <div className="space-y-2">
              {/* Month labels header */}
              <div className="flex text-[10px] text-gray-400 font-mono pl-6 select-none">
                {monthLabels.map((lbl, idx) => (
                  <span 
                    key={idx} 
                    style={{ width: `${lbl.colSpan * 17}px` }} 
                    className="inline-block truncate pr-1"
                  >
                    {lbl.text}
                  </span>
                ))}
              </div>

              {/* Grid content with row labels */}
              <div className="flex items-start gap-2">
                {/* Row labels */}
                <div className="grid grid-rows-7 gap-[3px] text-[9px] text-gray-400 font-mono text-right w-4 pt-1 select-none">
                  <span>S</span>
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                </div>
                
                {/* 16 columns (weeks) */}
                <div className="flex gap-[3px] overflow-x-auto pb-1 flex-1">
                  {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="grid grid-rows-7 gap-[3px] flex-shrink-0">
                      {week.map((day) => (
                        <div
                          key={day.dateStr}
                          title={`${day.dateStr}: ${day.hasActivity ? "Developer sessions logged" : "No active builds"}`}
                          className={`w-3.5 h-3.5 rounded-sm border border-transparent transition-all duration-150 ${
                            day.hasActivity 
                              ? "bg-blue-600 border-blue-700 shadow-xs" 
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend footer */}
              <div className="flex items-center justify-end gap-1.5 text-[10px] text-gray-400 font-mono pt-2">
                <span>Less</span>
                <div className="w-3 h-3 bg-gray-100 rounded-sm" />
                <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Block 2: Current Learning Roadmap Node */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Map className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Current Learning Module</h3>
            </div>

            {activeNode ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {activeNode.title || "Mastery Path"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {activeNode.description}
                  </p>
                </div>

                <div className="space-y-1.5 bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                    <span>Module Progress</span>
                    <span className="text-blue-600 font-bold">{activePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${activePercent}%` }}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (setActiveTab) {
                      setActiveTab("roadmaps");
                    } else {
                      setSelectedRoadmapTrack(selectedRoadmapTrack);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <span>Continue Curriculum</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400">No active roadmap nodes found. Please initialize a path.</p>
              </div>
            )}
          </div>

          {/* Block 3: Learning Progress (Module Percentages) */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Activity className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Curriculum Progress</h3>
            </div>

            <div className="space-y-4">
              {[
                { id: "ai-pre-trained", label: "Using Pre-Trained Models" },
                { id: "ai-embeddings-vector", label: "Embeddings & Vector Databases" },
                { id: "ai-rag-systems", label: "Retrieval-Augmented Generation" },
                { id: "ai-agents-cyclical", label: "Cognitive AI Agents" }
              ].map(module => {
                const pct = getModuleProgress(module.id);
                return (
                  <div key={module.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-gray-600">{module.label}</span>
                      <span className="font-mono text-gray-400">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block 4: Upcoming Tasks */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Tasks</h3>
            </div>

            {upcomingTasks.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {upcomingTasks.map((task, idx) => (
                  <div key={task.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-4">
                      <p className="font-medium text-gray-700 truncate">{task.title}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{task.category}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded border border-gray-200 text-[10px] font-medium text-gray-400 bg-gray-50 flex-shrink-0">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400">All curriculum objectives completed!</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: QUICK INTERACTIONS & FEEDS ── */}
        <div className="space-y-6">

          {/* Quick Actions Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Activity className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab && setActiveTab("roadmaps")}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-gray-500" />
                  <span>Resume Curriculum</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button 
                onClick={() => setActiveTab && setActiveTab("debugger")}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-gray-500" />
                  <span>AI Debugger Stack</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button 
                onClick={() => setActiveTab && setActiveTab("vector")}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-gray-500" />
                  <span>Query Vector Index</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button 
                onClick={() => setActiveTab && setActiveTab("settings")}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-gray-500" />
                  <span>System Configuration</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Recent Activity Timeline Logs */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Activity className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Recent Build Activity</h3>
            </div>

            {logs && logs.length > 0 ? (
              <div className="relative pl-4 space-y-4 before:absolute before:left-[5px] before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-gray-200">
                {logs.slice(-5).reverse().map((log, idx) => {
                  let dotColor = "bg-gray-400 border-gray-200";
                  if (log.type === "success") dotColor = "bg-emerald-500 border-emerald-100";
                  else if (log.type === "error") dotColor = "bg-red-500 border-red-100";
                  else if (log.type === "config") dotColor = "bg-blue-500 border-blue-100";
                  else if (log.type === "system") dotColor = "bg-amber-500 border-amber-100";

                  // Extract timestamp or readable content
                  const textContent = log.text.replace(/^\[[A-Z]+\]\s*/, "");
                  
                  return (
                    <div key={idx} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className={`absolute left-[-15px] top-1.5 w-2 h-2 rounded-full border ${dotColor}`} />
                      <p className="font-mono text-[10px] text-gray-400 leading-none">BUILD EVENT</p>
                      <p className="text-gray-700 font-medium leading-normal mt-1 break-words">{textContent}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No recent activity logged.</p>
            )}
          </div>

          {/* System Notifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Bell className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">System Notifications</h3>
            </div>

            <div className="space-y-3.5">
              {/* Notification 1 */}
              <div className="flex items-start gap-2.5 text-xs">
                <Server className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 leading-tight">API Gateway Online</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">FastAPI development stack actively listening on port 8000.</p>
                </div>
              </div>

              {/* Notification 2 */}
              <div className="flex items-start gap-2.5 text-xs">
                <UserCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 leading-tight">Developer Identity Verified</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Firebase security credentials parsed. User session active.</p>
                </div>
              </div>

              {/* Notification 3 */}
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 leading-tight">Curriculum Sync Success</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Active curriculum nodes mapped. Track is set to ai_engineer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
