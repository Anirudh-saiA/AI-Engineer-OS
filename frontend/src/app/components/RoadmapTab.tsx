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

interface RoadmapTabProps {
  profileData: any;
  roadmap: any[];
  selectedRoadmapTrack: string;
  setSelectedRoadmapTrack: (track: string) => void;
  staticRoadmaps: Record<string, RoadmapTrack>;
  activeDetailSubNode: RoadmapSubNode | null;
  setActiveDetailSubNode: (node: RoadmapSubNode | null) => void;
  checkedTasks: Record<string, boolean>;
  toggleChecklistTask: (taskId: string) => void;
  addLog: (text: string, type: "system" | "success" | "config" | "info" | "error") => void;
  user: any;
  API_BASE_URL: string;
  fetchProfile: () => void;
}

export default function RoadmapTab({
  profileData,
  roadmap,
  selectedRoadmapTrack,
  setSelectedRoadmapTrack,
  staticRoadmaps,
  activeDetailSubNode,
  setActiveDetailSubNode,
  checkedTasks,
  toggleChecklistTask,
  addLog,
  user,
  API_BASE_URL,
  fetchProfile,
}: RoadmapTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
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

      {/* ═══════ UPCOMING COURSES ═══════ */}
      <div className="rounded-[24px] p-6 md:p-8 relative overflow-hidden shadow-sm border border-gray-100 bg-[#fbfbfb]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 mb-6 border-b border-gray-200 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-float">🚀</span>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-[#111827]">
                Upcoming Career Paths
              </h3>
              <p className="text-xs font-semibold mt-0.5 text-[#94a3b8]">
                Register interest for specialized bootcamps
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
          {[
            "AI Engineer",
            "AI and Data Scientist",
            "Data Engineer",
            "Data Analyst",
            "MLOps"
          ].map((course, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#111827] shadow-sm overflow-hidden relative cursor-not-allowed group min-w-[240px] flex-1 max-w-[32%]">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#1e293b]"></div>
              <span className="font-bold text-sm text-white z-10 pl-6">{course}</span>
              <svg className="w-5 h-5 text-slate-500 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center relative z-10">
          <span className="inline-block px-4 py-2 rounded-full border border-dotted border-slate-300 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-500">
            COMING SOON
          </span>
        </div>
      </div>

    </div>
  );
}
