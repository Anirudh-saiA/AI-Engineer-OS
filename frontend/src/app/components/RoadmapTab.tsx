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
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Curriculum Roadmap
              </h3>
              <p className="text-xs font-mono font-bold mt-0.5 text-[var(--text-muted)]">
                Select, explore, and track specialized learning paths
              </p>
            </div>
          </div>

          {/* Track Selector Tab Buttons */}
          <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto py-1">
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
                      <span className="w-6 h-6 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[10px] font-mono font-bold text-[var(--text-muted)]">
                        {nodeIdx + 1}
                      </span>
                      <h4 className="text-xs font-mono font-black uppercase tracking-wider text-[var(--text-primary)]">{node.title}</h4>
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
                              <h5 className="text-[11px] font-bold text-[var(--text-primary)] truncate">{sub.title}</h5>
                              <p className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5 truncate">{sub.description}</p>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-md animate-fadeIn p-4">
                  <div className="glass-card max-w-lg w-full rounded-3xl p-6 md:p-8 border border-[var(--accent)] text-left space-y-6 relative overflow-hidden shadow-2xl animate-scale-in bg-[var(--bg-card)]">
                    <div className="absolute top-[-30%] left-[-20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[var(--accent-soft)] to-transparent blur-[80px] pointer-events-none"></div>

                    <div className="flex justify-between items-start gap-4 pb-4 border-b border-[var(--border)] relative z-10">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider block">Integrated Sandbox Blueprint Checklist</span>
                        <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] mt-0.5">{activeDetailSubNode.title}</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-normal">{activeDetailSubNode.description}</p>
                      </div>
                      <button
                        onClick={() => setActiveDetailSubNode(null)}
                        className="w-8 h-8 rounded-xl border border-[var(--border)] hover:border-slate-500 flex items-center justify-center font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-all flex-shrink-0"
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
                        className="btn-accent w-full py-4 rounded-2xl font-black text-xs uppercase cursor-pointer transition-all active:scale-95 bg-orange-400 hover:bg-orange-500 text-white border-none"
                      >
                        Launch Sandbox Practice Session
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
      <div className="rounded-[24px] p-6 md:p-8 relative overflow-hidden shadow-sm border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 mb-6 border-b border-[var(--border)] relative z-10">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
                Upcoming Career Paths
              </h3>
              <p className="text-xs font-semibold mt-0.5 text-[var(--text-muted)]">
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
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm overflow-hidden relative cursor-not-allowed group min-w-[240px] flex-1 max-w-[32%]">
              <span className="font-bold text-sm text-[var(--text-primary)] z-10 pl-2">{course}</span>
              <svg className="w-5 h-5 text-[var(--text-muted)] z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center relative z-10">
          <span className="inline-block px-4 py-2 rounded-full border border-dotted border-[var(--border)] bg-[var(--bg-card)] text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            COMING SOON
          </span>
        </div>
      </div>

    </div>
  );
}
