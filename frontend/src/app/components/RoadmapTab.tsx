import React, { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  Lock, 
  CheckCircle, 
  Play, 
  BookOpen, 
  Award, 
  Compass, 
  Clock, 
  Flame, 
  Terminal, 
  Eye, 
  Info, 
  X,
  FileText,
  HelpCircle,
  Code
} from "lucide-react";
import { AI_ENGINEER_ROADMAP, RoadmapNode, LearningResource } from "../data/roadmapData";

interface RoadmapTabProps {
  profileData: any;
  roadmap: any[];
  selectedRoadmapTrack: string;
  setSelectedRoadmapTrack: (track: string) => void;
  staticRoadmaps: Record<string, any>;
  activeDetailSubNode: any | null;
  setActiveDetailSubNode: (node: any | null) => void;
  checkedTasks: Record<string, boolean>;
  toggleChecklistTask: (taskId: string) => void;
  addLog: (text: string, type: "system" | "success" | "config" | "info" | "error") => void;
  user: any;
  API_BASE_URL: string;
  fetchProfile: () => void;
  logActivity?: (activityType: string, title: string, durationMins?: number) => Promise<void>;
}

export default function RoadmapTab({
  profileData,
  checkedTasks,
  toggleChecklistTask,
  addLog,
  user,
  API_BASE_URL,
  fetchProfile,
  logActivity,
}: RoadmapTabProps) {
  // Navigation tabs: "tree" or "visual"
  const [viewTab, setViewTab] = useState<"tree" | "visual">("tree");
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const [durationFilter, setDurationFilter] = useState<string>("All");

  // Onboarding / Started State
  const [hasStarted, setHasStarted] = useState(() => {
    // If there is already some completion in local storage or completed tasks list, we are started
    const started = localStorage.getItem("aios-roadmap-started") === "true" || Object.keys(checkedTasks).length > 0;
    return started;
  });

  // Folder Expansion State (Map of node ID -> boolean)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    // Default expand the root and first child
    return {
      "ai-engineer": true,
      "intro": true
    };
  });

  // Selected Detail Node State (drawer)
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);

  // Simple Confetti effect triggered on milestones
  const [confetti, setConfetti] = useState<{ active: boolean; x: number; y: number } | null>(null);

  // Flashcard Flip State
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  // Helper: toggle expand state
  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper: check completion status of any node
  const isNodeCompleted = (node: RoadmapNode): boolean => {
    if (!node.children || node.children.length === 0) {
      return !!checkedTasks[node.id];
    }
    // For parent nodes, they are completed if all their direct leaf children are completed
    const leafChildren = getLeafNodes(node);
    if (leafChildren.length === 0) return false;
    return leafChildren.every(child => !!checkedTasks[child.id]);
  };

  // Helper: check if a node is locked (progressive unlock logic)
  const isNodeLocked = (node: RoadmapNode): boolean => {
    if (!hasStarted) return false; // Don't lock before start so they can explore
    if (node.id === "intro" || node.parentId === "intro" || node.id === "ai-engineer") return false;

    // A node is unlocked if the previous sibling or parent sibling is completed
    const flatList = getFlatNodeList(AI_ENGINEER_ROADMAP);
    const nodeIdx = flatList.findIndex(n => n.id === node.id);
    if (nodeIdx <= 0) return false;

    // Check if the immediately preceding high-level group or node is completed
    // To make it simple: unlock if at least 1 previous node is completed
    const previousNode = flatList[nodeIdx - 1];
    return !isNodeCompleted(previousNode);
  };

  // Recursive flat list generator to find previous nodes
  const getFlatNodeList = (node: RoadmapNode): RoadmapNode[] => {
    const list: RoadmapNode[] = [];
    if (node.id !== "ai-engineer") {
      list.push(node);
    }
    if (node.children) {
      node.children.forEach(child => {
        list.push(...getFlatNodeList(child));
      });
    }
    return list;
  };

  // Recursive leaf node extractor
  const getLeafNodes = (node: RoadmapNode): RoadmapNode[] => {
    const leaves: RoadmapNode[] = [];
    const recurse = (n: RoadmapNode) => {
      if (!n.children || n.children.length === 0) {
        leaves.push(n);
      } else {
        n.children.forEach(recurse);
      }
    };
    recurse(node);
    return leaves;
  };

  // calculate overall progress % of root
  const overallStats = useMemo(() => {
    const allLeafs = getLeafNodes(AI_ENGINEER_ROADMAP);
    const completedCount = allLeafs.filter(l => !!checkedTasks[l.id]).length;
    const totalCount = allLeafs.length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return { completedCount, totalCount, percent };
  }, [checkedTasks]);

  // Filter & Search Logic
  const filteredTree = useMemo(() => {
    const matchesSearch = (node: RoadmapNode): boolean => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        node.title.toLowerCase().includes(q) ||
        (node.description?.toLowerCase().includes(q) ?? false) ||
        (node.skillsLearned?.some(s => s.toLowerCase().includes(q)) ?? false)
      );
    };

    const matchesFilters = (node: RoadmapNode): boolean => {
      if (difficultyFilter !== "All" && node.difficulty !== difficultyFilter) return false;
      return true;
    };

    // Recursively filter tree nodes
    const filterNode = (node: RoadmapNode): RoadmapNode | null => {
      const selfMatches = matchesSearch(node) && matchesFilters(node);
      
      if (!node.children || node.children.length === 0) {
        return selfMatches ? node : null;
      }

      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter((child): child is RoadmapNode => child !== null);

      if (filteredChildren.length > 0 || selfMatches) {
        return {
          ...node,
          children: filteredChildren
        };
      }
      return null;
    };

    return filterNode(AI_ENGINEER_ROADMAP);
  }, [searchQuery, difficultyFilter]);

  const handleStartRoadmap = () => {
    setHasStarted(true);
    localStorage.setItem("aios-roadmap-started", "true");
    addLog("[SYSTEM] AI Engineer Curriculum started! Progressive path unlocked.", "success");
  };

  const handleToggleTaskNode = async (node: RoadmapNode) => {
    const wasChecked = !!checkedTasks[node.id];
    toggleChecklistTask(node.id);
    
    if (!wasChecked) {
      // Trigger Confetti explosion
      setConfetti({ active: true, x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setTimeout(() => setConfetti(null), 3000);
      addLog(`[SUCCESS] Completed topic: "${node.title}"! Earned +${node.xp || 50} XP.`, "success");

      // Log activity to heatmap
      if (logActivity) {
        logActivity('course', `Course Module: ${node.title}`, 45);
      }

      // Sync backend stage completion
      try {
        await fetch(`${API_BASE_URL}/api/v1/profile/roadmap/${node.id}/complete`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${user.uid}`
          }
        });
        fetchProfile();
      } catch (err) {
        console.error("Failed to complete stage on backend:", err);
      }
    }
  };

  // Text-based flow representation builder
  const textFlowRepresentation = useMemo(() => {
    const buildTextTree = (node: RoadmapNode, prefix = ""): string => {
      let lines = `${prefix}├── ${node.title}\n`;
      if (node.children) {
        node.children.forEach((child, idx) => {
          lines += buildTextTree(child, `${prefix}│   `);
        });
      }
      return lines;
    };
    return buildTextTree(AI_ENGINEER_ROADMAP);
  }, []);

  return (
    <div className="space-y-6 relative">
      
      {/* Confetti Explosion Canvas */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
          {Array.from({ length: 40 }).map((_, i) => {
            const randomX = Math.random() * 200 - 100;
            const randomY = Math.random() * -300 - 100;
            const randomRot = Math.random() * 360;
            const delay = Math.random() * 0.2;
            const color = ['#F97316', '#F59E0B', '#EF4444', '#10B981', '#3B82F6'][i % 5];
            return (
              <div
                key={i}
                className="absolute w-2 h-4 rounded-sm animate-bounce"
                style={{
                  backgroundColor: color,
                  transform: `translate3d(${randomX}px, ${randomY}px, 0) rotate(${randomRot}deg)`,
                  transition: `all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s`,
                  opacity: 0,
                  animation: 'fadeOut 1.5s forwards'
                }}
              />
            );
          })}
        </div>
      )}

      {/* Header Info Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-black text-[var(--text-primary)]">AI Engineer Curriculum Canvas</h2>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
            Data-driven learning paths mapped directly from the AI engineering blueprints.
          </p>
        </div>

        <div className="flex items-center gap-6 self-stretch md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-[var(--border)]">
          {/* Progress bar */}
          <div className="flex-1 md:w-48 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-[var(--text-secondary)]">
              <span>Path Progress</span>
              <span className="text-orange-500">{overallStats.percent}%</span>
            </div>
            <div className="w-full bg-[var(--bg-secondary)] h-2.5 rounded-full overflow-hidden border border-[var(--border)]">
              <div 
                className="h-full bg-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${overallStats.percent}%` }}
              />
            </div>
          </div>
          
          <div className="text-center font-mono bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-2.5 rounded-xl">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">XP Pool</span>
            <span className="text-sm font-black text-[var(--text-primary)]">
              {overallStats.completedCount * 100} / {overallStats.totalCount * 100} XP
            </span>
          </div>
        </div>
      </div>

      {/* Main Dual-View Workspace */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm min-h-[500px] flex flex-col gap-6">
        
        {/* Navigation Tabs and Filters Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          
          {/* Tabs switch */}
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl w-fit border border-[var(--border)]">
            <button
              onClick={() => setViewTab("tree")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewTab === "tree" 
                  ? "bg-[var(--bg-card)] border border-[var(--border)] text-orange-500 shadow-sm" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Tree View</span>
            </button>
            <button
              onClick={() => setViewTab("visual")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewTab === "visual" 
                  ? "bg-[var(--bg-card)] border border-[var(--border)] text-orange-500 shadow-sm" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Visual Roadmap</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topics, tools, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-xs w-60 focus:outline-none focus:border-orange-400 transition-all font-medium text-[var(--text-primary)]"
              />
            </div>

            {/* Filter Dropdown Difficulty */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <option value="All">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── CASE: NOT STARTED / EMBARK STATE ─── */}
        {!hasStarted && (
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-12 space-y-5 animate-fade-up">
            <div className="w-20 h-20 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm">
              <Compass className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">Ready to Start AI Engineering?</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Embark on a dynamic data-driven learning curriculum. Unlock assignments, practice tests, and sandbox exercises path-by-path.
              </p>
            </div>
            <button
              onClick={handleStartRoadmap}
              className="px-8 py-3 bg-orange-400 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all transform active:scale-95 shadow-md shadow-orange-100 cursor-pointer"
            >
              Start Roadmap Path
            </button>
          </div>
        )}

        {/* ─── CASE: STARTED ROADMAP ACTIVE WORKSPACES ─── */}
        {hasStarted && (
          <div className="flex-1">
            
            {/* VIEW A: TREE VIEW MODE */}
            {viewTab === "tree" && (
              <div className="space-y-4 animate-fadeIn">
                
                {/* Flow indicator toggle bar */}
                <div className="flex justify-between items-center text-xs font-mono font-bold text-[var(--text-muted)] border-b border-[var(--border)] pb-2 mb-4">
                  <span>Hierarchical Folders</span>
                  <button 
                    onClick={() => {
                      // Expand or collapse everything
                      const allIds = getFlatNodeList(AI_ENGINEER_ROADMAP).map(n => n.id);
                      const isAnyCollapsed = allIds.some(id => !expandedNodes[id]);
                      const nextState: Record<string, boolean> = { "ai-engineer": true };
                      allIds.forEach(id => {
                        nextState[id] = isAnyCollapsed;
                      });
                      setExpandedNodes(nextState);
                    }}
                    className="hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Toggle Folding Expand
                  </button>
                </div>

                <div className="pl-2 space-y-1">
                  {filteredTree ? (
                    renderTreeNode(filteredTree, 0)
                  ) : (
                    <div className="text-center py-10 text-xs text-[var(--text-muted)]">
                      No roadmap topics match your query.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW B: VISUAL ROADMAP MODE */}
            {viewTab === "visual" && (
              <div className="space-y-8 py-4 animate-fadeIn">
                
                {/* Simple Horizontal/Vertical linked node timeline rendering */}
                <div className="flex flex-col gap-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-[var(--border)]">
                  {AI_ENGINEER_ROADMAP.children?.map((node, index) => {
                    const isCompleted = isNodeCompleted(node);
                    const isLocked = isNodeLocked(node);
                    
                    return (
                      <div key={node.id} className="relative pl-12 flex items-start gap-4 group">
                        
                        {/* Circle node indicator */}
                        <button
                          onClick={() => !isLocked && setSelectedNode(node)}
                          className={`absolute left-0 w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all cursor-pointer ${
                            isLocked 
                              ? "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)]" 
                              : isCompleted 
                                ? "bg-green-50 border-green-500 text-green-600 shadow-sm" 
                                : "bg-orange-400 border-orange-500 text-white shadow-sm ring-4 ring-orange-100"
                          }`}
                        >
                          {isLocked ? <Lock className="w-3.5 h-3.5" /> : (index + 1)}
                        </button>

                        {/* Node summary block card */}
                        <div 
                          className={`flex-1 p-5 rounded-2xl border transition-all ${
                            isLocked 
                              ? "bg-[var(--bg-card)] border-[var(--border)] opacity-60 filter blur-[0.5px]" 
                              : "bg-[#FFFCF7] border-orange-300 hover:border-orange-400 shadow-xs hover:shadow-md cursor-pointer"
                          }`}
                          onClick={() => !isLocked && setSelectedNode(node)}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-[var(--text-primary)] text-sm">{node.title}</h4>
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  node.difficulty === "Beginner" 
                                    ? "bg-green-50 text-green-600 border-green-200" 
                                    : node.difficulty === "Intermediate"
                                      ? "bg-orange-50 text-orange-600 border-orange-200"
                                      : "bg-red-50 text-red-600 border-red-200"
                                }`}>
                                  {node.difficulty}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">{node.description}</p>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--text-muted)] whitespace-nowrap">
                              {node.estimatedDuration}
                            </span>
                          </div>

                          {/* Render sub child items in timeline */}
                          {node.children && node.children.length > 0 && !isLocked && (
                            <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap gap-2">
                              {node.children.map(child => {
                                const childCompleted = isNodeCompleted(child);
                                return (
                                  <button
                                    key={child.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedNode(child);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                      childCompleted 
                                        ? "bg-green-50/50 border-green-200 text-green-700" 
                                        : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-orange-400"
                                    }`}
                                  >
                                    <div className={`w-2 h-2 rounded-full ${childCompleted ? "bg-green-500" : "bg-orange-400 animate-pulse"}`} />
                                    <span>{child.title}</span>
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
          </div>
        )}
      </div>

      {/* ─── SIDEBAR DETAIL OVERLAY DRAWER ─── */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
          
          {/* Sliding container drawer */}
          <div className="w-full max-w-lg bg-[#FFFCF7] h-full shadow-2xl p-8 border-l border-[var(--border)] flex flex-col justify-between animate-slide-in-right relative overflow-y-auto">
            
            {/* Header info */}
            <div>
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-[var(--border)]">
                <div>
                  <span className="text-[9px] font-mono font-bold text-orange-500 uppercase tracking-widest block">Topic Details Syllabus</span>
                  <h3 className="text-lg font-black text-gray-900 mt-1">{selectedNode.title}</h3>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{selectedNode.description}</p>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    setFlashcardFlipped(false);
                  }}
                  className="w-8 h-8 rounded-xl border border-[var(--border)] hover:border-gray-400 flex items-center justify-center font-bold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic resources syllabus */}
              <div className="mt-6 space-y-6">
                
                {/* Meta details specs */}
                <div className="grid grid-cols-3 gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] p-4 rounded-2xl">
                  <div className="text-center border-r border-[var(--border)]">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Duration</span>
                    <span className="text-xs font-black text-gray-800">{selectedNode.estimatedDuration || "1 hour"}</span>
                  </div>
                  <div className="text-center border-r border-[var(--border)]">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Difficulty</span>
                    <span className="text-xs font-black text-gray-800">{selectedNode.difficulty || "Beginner"}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">XP Award</span>
                    <span className="text-xs font-black text-orange-500">+{selectedNode.xp || 50} XP</span>
                  </div>
                </div>

                {/* Video Lesson / Article list */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Curriculum Study Materials (Click to study)</h4>
                  <div className="space-y-2">
                    {selectedNode.resources && selectedNode.resources.length > 0 ? (
                      selectedNode.resources.map((res, i) => (
                        <button 
                          key={i} 
                          onClick={() => {
                            if (logActivity) {
                              logActivity(res.type || 'video', res.title, res.type === 'video' ? 15 : 10);
                            }
                            if (res.url) {
                              window.open(res.url, '_blank');
                            }
                          }}
                          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-xs cursor-pointer text-left w-full font-normal"
                        >
                          <div className="flex items-center gap-2">
                            {res.type === 'video' ? <Play className="w-4.5 h-4.5 text-red-500" /> : <FileText className="w-4.5 h-4.5 text-blue-500" />}
                            <span className="font-semibold text-gray-700 truncate max-w-[240px]">{res.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-400">+{res.xp} XP</span>
                        </button>
                      ))
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            if (logActivity) {
                              logActivity('video', `Deep-dive core tutorial on ${selectedNode.title}`, 15);
                            }
                          }}
                          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-xs cursor-pointer text-left w-full font-normal"
                        >
                          <div className="flex items-center gap-2">
                            <Play className="w-4.5 h-4.5 text-red-500" />
                            <span className="font-semibold text-gray-700">Video: Deep-dive core tutorial</span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-400">+50 XP</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (logActivity) {
                              logActivity('article', `Advanced integration mechanics on ${selectedNode.title}`, 10);
                            }
                          }}
                          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-xs cursor-pointer text-left w-full font-normal"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4.5 h-4.5 text-blue-500" />
                            <span className="font-semibold text-gray-700">Article: Advanced integration mechanics</span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-400">+30 XP</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* interactive flashcard widget */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Knowledge Recall Check</h4>
                  <div 
                    onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                    className="border border-orange-200 rounded-2xl p-5 bg-orange-50/50 hover:bg-orange-50/80 cursor-pointer min-h-[100px] flex flex-col justify-between transition-all select-none"
                  >
                    <div>
                      <span className="text-[8px] font-bold text-orange-400 uppercase tracking-wider block mb-1">
                        {flashcardFlipped ? "Answer Explanation" : "Recall Card (Click to flip)"}
                      </span>
                      <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                        {flashcardFlipped 
                          ? `This topic focuses on structuring variables, parameters, and environments to get maximum output performance without compiling from scratch.`
                          : `What is the core target metric optimized in the "${selectedNode.title}" curriculum segment?`}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-orange-400 mt-2 text-right">
                      {flashcardFlipped ? "Flip back" : "Show answer"}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Complete Actions */}
            <div className="pt-6 border-t border-[var(--border)] mt-8 space-y-4">
              <button
                onClick={() => handleToggleTaskNode(selectedNode)}
                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2 border ${
                  checkedTasks[selectedNode.id]
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-orange-400 hover:bg-orange-500 text-white border-none shadow-sm"
                }`}
              >
                {checkedTasks[selectedNode.id] ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed Topic</span>
                  </>
                ) : (
                  <span>Mark Topic Completed (+{(selectedNode.xp || 50)} XP)</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );

  // Helper recursive renderer for Tree View
  function renderTreeNode(node: RoadmapNode, depth: number) {
    const isExpanded = !!expandedNodes[node.id];
    const isCompleted = isNodeCompleted(node);
    const isLocked = isNodeLocked(node);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none animate-fadeIn">
        
        {/* Row block */}
        <div 
          className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
            isLocked 
              ? "opacity-50" 
              : "hover:bg-[var(--bg-secondary)] cursor-pointer"
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (isLocked) return;
            if (hasChildren) {
              toggleExpand(node.id);
            } else {
              setSelectedNode(node);
            }
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Folder Expand/Collapse Arrow */}
            {hasChildren ? (
              <span className="text-[var(--text-muted)]">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
            ) : (
              <span className="w-3.5 h-3.5 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
              </span>
            )}

            {/* Check/Lock Icon */}
            {isLocked ? (
              <Lock className="w-3.5 h-3.5 text-gray-400" />
            ) : isCompleted ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-orange-400 flex-shrink-0" />
            )}

            <span className={`font-semibold truncate text-[var(--text-primary)] ${isCompleted ? "line-through text-[var(--text-muted)]" : ""}`}>
              {node.title}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono flex-shrink-0">
            {node.estimatedDuration && <span>{node.estimatedDuration}</span>}
            {node.difficulty && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] uppercase text-[8px] font-bold">
                {node.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--border)]">
            {node.children!.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}

      </div>
    );
  }
}
