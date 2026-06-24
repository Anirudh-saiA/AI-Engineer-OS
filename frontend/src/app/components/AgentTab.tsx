import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../config";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  citations?: string[];
  beginner_explanation?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: string;
}

interface AgentTabProps {
  chatSessions: ChatSession[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  startNewChat: () => void;
  deleteChatSession: (id: string, e: React.MouseEvent) => void;
  messages: Message[];
  chatInput: string;
  setChatInput: (input: string) => void;
  handleSendMessage: (customCmd?: string) => void;
  agentThinking: boolean;
  agentThinkingStep: number;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  parseMarkdownToReact: (text: string) => React.ReactNode;
  user: any;
  addLog: (text: string, type: "system" | "success" | "config" | "info" | "error") => void;
}

interface WorkflowTask {
  agent_id: string;
  task_description: string;
  status: string;
  completed_at: string | null;
  output: string | null;
}

interface Workflow {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  duration_seconds: number | null;
  summary: string | null;
  tasks: WorkflowTask[];
}

interface WorkflowLog {
  id: number;
  agent_id: string | null;
  message: string;
  log_level: string;
  timestamp: string;
}

export default function AgentTab({
  chatSessions,
  activeSessionId,
  setActiveSessionId,
  startNewChat,
  deleteChatSession,
  messages,
  chatInput,
  setChatInput,
  handleSendMessage,
  agentThinking,
  agentThinkingStep,
  chatEndRef,
  parseMarkdownToReact,
  user,
  addLog,
}: AgentTabProps) {
  // Navigation tabs: orchestrator (multi-agent) or chat (single-agent mentor chat)
  const [subTab, setSubTab] = useState<"orchestrator" | "chat">("orchestrator");

  // Multi-Agent states
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [workflowInput, setWorkflowInput] = useState("");
  const [submittingWorkflow, setSubmittingWorkflow] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<WorkflowLog[]>([]);
  const [selectedOutputTab, setSelectedOutputTab] = useState<string>("planner");

  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch workflow history
  const fetchWorkflowHistory = async (autoSelectFirst = false) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/agents/history`, {
        headers: {
          "Authorization": `Bearer ${user.uid}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
        if (autoSelectFirst && data.length > 0) {
          setSelectedWorkflowId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch workflow history", err);
    }
  };

  // Fetch logs & status for a specific workflow
  const fetchWorkflowDetails = async (wfId: string) => {
    if (!user) return;
    try {
      // 1. Get logs
      const logsRes = await fetch(`${API_BASE_URL}/api/v1/agents/workflow/${wfId}/logs`, {
        headers: {
          "Authorization": `Bearer ${user.uid}`,
        },
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setTerminalLogs(logsData);
      }

      // 2. Refresh workflows to get updated status and task outputs
      const listRes = await fetch(`${API_BASE_URL}/api/v1/agents/history`, {
        headers: {
          "Authorization": `Bearer ${user.uid}`,
        },
      });
      if (listRes.ok) {
        const listData: Workflow[] = await listRes.json();
        setWorkflows(listData);
        const updated = listData.find((w) => w.id === wfId);
        if (updated) {
          setSelectedWorkflow(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch details for workflow " + wfId, err);
    }
  };

  // Handle workflow trigger
  const handleTriggerWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowInput.trim() || !user) return;

    setSubmittingWorkflow(true);
    addLog(`[AGENT] Starting cooperative multi-agent workflow for: "${workflowInput}"`, "info");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/agents/workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.uid}`,
        },
        body: JSON.stringify({
          user_request: workflowInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorkflowInput("");
        setSelectedWorkflowId(data.workflow_id);
        addLog(`[SUCCESS] LangGraph workflow successfully queued with ID: ${data.workflow_id}`, "success");
        fetchWorkflowHistory();
      } else {
        const errData = await res.json();
        addLog(`[ERROR] Failed to start workflow: ${errData.detail || "Unknown error"}`, "error");
      }
    } catch (err) {
      addLog(`[ERROR] Connection error while triggering workflow: ${err}`, "error");
    } finally {
      setSubmittingWorkflow(false);
    }
  };

  // Handle initial list load
  useEffect(() => {
    if (user && subTab === "orchestrator") {
      fetchWorkflowHistory(true);
    }
  }, [user, subTab]);

  // Handle workflow selection change
  useEffect(() => {
    if (selectedWorkflowId) {
      const found = workflows.find((w) => w.id === selectedWorkflowId);
      if (found) {
        setSelectedWorkflow(found);
      }
      fetchWorkflowDetails(selectedWorkflowId);
    } else {
      setSelectedWorkflow(null);
      setTerminalLogs([]);
    }
  }, [selectedWorkflowId, workflows]);

  // Polling setup for active workflows
  useEffect(() => {
    // Clear any previous interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (selectedWorkflowId && selectedWorkflow?.status === "running") {
      pollIntervalRef.current = setInterval(() => {
        fetchWorkflowDetails(selectedWorkflowId);
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedWorkflowId, selectedWorkflow?.status]);

  // Auto scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Helper helper to get task output by agent type
  const getAgentOutput = (agentId: string) => {
    if (!selectedWorkflow) return null;
    const task = selectedWorkflow.tasks.find((t) => t.agent_id === agentId);
    return task?.output || null;
  };

  // Helper to determine status badge classes
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 border-green-500 text-green-400";
      case "failed":
        return "bg-red-500/10 border-red-500 text-red-400";
      case "running":
        return "bg-amber-500/10 border-amber-500 text-amber-400 animate-pulse";
      default:
        return "bg-slate-500/10 border-slate-500 text-slate-400";
    }
  };

  // Helper to get agent status from the active task details
  const getAgentStatus = (agentId: string) => {
    if (!selectedWorkflow) return "idle";
    const task = selectedWorkflow.tasks.find((t) => t.agent_id === agentId);
    return task?.status || "idle";
  };

  // Render logic for dashboard orchestrator subtab
  const renderOrchestrator = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)] overflow-hidden animate-fadeIn">
        
        {/* Sub-Column 1: History Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
          <div className="glass-card rounded-2xl p-4 border border-[var(--border)] bg-[var(--bg-card)] flex flex-col gap-3">
            <h4 className="text-xs font-black tracking-tight uppercase text-slate-400">Launch Collaborative Flow</h4>
            <form onSubmit={handleTriggerWorkflow} className="flex flex-col gap-2">
              <textarea
                value={workflowInput}
                onChange={(e) => setWorkflowInput(e.target.value)}
                placeholder="Describe project goal (e.g., Build a FastAPI vector search RAG microservice)..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
              <button
                type="submit"
                disabled={submittingWorkflow || !workflowInput.trim()}
                className={`btn-accent py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[var(--shadow-glow)] ${
                  (submittingWorkflow || !workflowInput.trim()) && "opacity-50 cursor-not-allowed"
                }`}
              >
                {submittingWorkflow ? (
                  <>
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full" />
                    Deploying...
                  </>
                ) : (
                  <>🚀 Deploy Agent Team</>
                )}
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Run History</span>
              <button
                onClick={() => fetchWorkflowHistory(false)}
                className="text-[10px] font-bold text-[var(--accent)] hover:underline cursor-pointer"
                title="Refresh history list"
              >
                🔄 Refresh
              </button>
            </div>

            {workflows.length === 0 ? (
              <div className="text-center p-4 border border-dashed border-[var(--border)] rounded-xl text-slate-500 text-xs">
                No workflow runs found.
              </div>
            ) : (
              workflows.map((wf) => {
                const isActive = wf.id === selectedWorkflowId;
                return (
                  <div
                    key={wf.id}
                    onClick={() => setSelectedWorkflowId(wf.id)}
                    className="p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-2 hover:translate-x-1 border-[var(--border)]"
                    style={{
                      borderColor: isActive ? "var(--accent)" : "var(--border)",
                      background: isActive ? "var(--accent-soft)" : "var(--bg-card)",
                      boxShadow: isActive ? "0 0 10px rgba(255,107,53,0.05)" : "var(--shadow-sm)"
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-bold truncate flex-1" style={{ color: isActive ? "var(--accent-text)" : "var(--text-primary)" }}>
                        {wf.name}
                      </h5>
                      <span className={`text-[8px] font-mono font-black border uppercase px-1.5 py-0.5 rounded ${getStatusBadge(wf.status)}`}>
                        {wf.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span>{new Date(wf.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {wf.duration_seconds && <span>⏱️ {wf.duration_seconds}s</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sub-Column 2: Stepper, Active Agents, Telemetry logs, & Outputs Preview */}
        <div className="lg:col-span-9 flex flex-col gap-5 h-full overflow-y-auto pr-1 pb-4 custom-scrollbar">
          {selectedWorkflow ? (
            <>
              {/* Active Workflow Header */}
              <div className="glass-card rounded-2xl p-4 border border-[var(--border)] bg-[var(--bg-card)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    {selectedWorkflow.name}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1">
                    Workflow UUID: {selectedWorkflow.id} | Initiated: {new Date(selectedWorkflow.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {selectedWorkflow.duration_seconds && (
                    <span className="text-xs font-mono bg-slate-800 border border-[var(--border)] px-3 py-1 rounded-xl text-slate-300">
                      ⏱️ Duration: {selectedWorkflow.duration_seconds}s
                    </span>
                  )}
                  <span className={`text-[10px] font-mono font-black border uppercase px-3 py-1.5 rounded-full ${getStatusBadge(selectedWorkflow.status)}`}>
                    {selectedWorkflow.status}
                  </span>
                </div>
              </div>

              {/* Horizontal Stepper Progress Map */}
              <div className="glass-card rounded-2xl p-5 border border-[var(--border)] bg-[var(--bg-card)] flex flex-col gap-4">
                <h4 className="text-xs font-black tracking-tight uppercase text-slate-400">LangGraph Active State Pipeline</h4>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2 select-none">
                  {[
                    { id: "planner", label: "Planner", icon: "📋" },
                    { id: "research", label: "Research", icon: "🔍" },
                    { id: "coder", label: "Coder", icon: "💻" },
                    { id: "reviewer", label: "Reviewer", icon: "🔬" },
                    { id: "documentation", label: "Documentation", icon: "📝" }
                  ].map((node, index) => {
                    const status = getAgentStatus(node.id);
                    let nodeColor = "border-slate-800 text-slate-500 bg-slate-900/50";
                    let glow = "";

                    if (status === "completed") {
                      nodeColor = "border-green-500 text-green-400 bg-green-950/20";
                    } else if (status === "running") {
                      nodeColor = "border-amber-500 text-amber-400 bg-amber-950/20 animate-pulse";
                      glow = "shadow-[0_0_15px_rgba(245,158,11,0.15)]";
                    } else if (status === "failed") {
                      nodeColor = "border-red-500 text-red-400 bg-red-950/20";
                    }

                    return (
                      <React.Fragment key={node.id}>
                        {/* Stepper Node Card */}
                        <div className={`flex flex-col items-center gap-2 p-3 rounded-xl border w-full md:w-32 transition-all ${nodeColor} ${glow}`}>
                          <span className="text-xl">{node.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider">{node.label}</span>
                          <span className="text-[8px] font-mono font-bold uppercase opacity-85">{status}</span>
                        </div>

                        {/* Connection arrow between nodes */}
                        {index < 4 && (
                          <div className="hidden md:flex items-center text-slate-600 font-bold text-lg select-none">
                            {node.id === "reviewer" && selectedWorkflow.tasks.find(t => t.agent_id === "reviewer")?.status === "completed" && (
                              <div className="flex flex-col items-center relative">
                                <span className="text-[8px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/20 px-1 py-0.5 rounded -top-5 absolute whitespace-nowrap">
                                  Loop Retry
                                </span>
                                <span className="text-slate-500">➔</span>
                              </div>
                            ) || "➔"}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Active Agent Status Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { id: "planner", role: "Planner", desc: "Outlines technical goals and task checklists." },
                  { id: "research", role: "Researcher", desc: "Searches knowledge bases and audits guidelines." },
                  { id: "coder", role: "Coder", desc: "Implements logic schemas & code instructions." },
                  { id: "reviewer", role: "Reviewer", desc: "Inspects code quality and reviews constraints." },
                  { id: "documentation", role: "Documenter", desc: "Drafts user manual README setup guides." }
                ].map((agent) => {
                  const status = getAgentStatus(agent.id);
                  let badgeColor = "bg-slate-900 border-slate-800 text-slate-500";
                  if (status === "completed") badgeColor = "bg-green-500/10 border-green-500/30 text-green-400";
                  if (status === "running") badgeColor = "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse";
                  if (status === "failed") badgeColor = "bg-red-500/10 border-red-500/30 text-red-400";

                  return (
                    <div key={agent.id} className="glass-card p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] flex flex-col gap-2">
                      <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-300">{agent.role}</span>
                        <span className={`text-[8px] font-mono font-bold px-1 py-0.5 border rounded uppercase ${badgeColor}`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-[9.5px] leading-relaxed text-slate-400">{agent.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Live Terminal Telemetry Console */}
              <div className="glass-card rounded-2xl border border-[var(--border)] bg-[#0d0d11] overflow-hidden flex flex-col h-60">
                <div className="bg-[#14141a] px-4 py-2 border-b border-[var(--border)] flex items-center justify-between select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    <span className="text-[10px] font-mono font-bold text-slate-400 ml-2">agents-telemetry-cli.log</span>
                  </div>
                  {selectedWorkflow.status === "running" && (
                    <span className="text-[9px] font-mono font-bold text-amber-500 animate-pulse flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                      STREAMING LIVE
                    </span>
                  )}
                </div>

                <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-1.5 custom-scrollbar text-[#a6accd] select-text">
                  {terminalLogs.length === 0 ? (
                    <div className="text-slate-600 italic">Console initialized. Awaiting agent execution logs...</div>
                  ) : (
                    terminalLogs.map((log) => {
                      let levelColor = "text-green-400";
                      if (log.log_level === "error") levelColor = "text-red-400 font-bold";
                      if (log.log_level === "warning") levelColor = "text-yellow-400 font-bold";
                      if (log.log_level === "debug") levelColor = "text-purple-400";

                      return (
                        <div key={log.id} className="leading-relaxed hover:bg-white/5 px-1 rounded transition-colors">
                          <span className="text-slate-600 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
                          <span className="text-[var(--accent)] font-bold">[{log.agent_id || "system"}]</span>{" "}
                          <span className={`${levelColor} uppercase text-[9px] font-bold`}>[{log.log_level}]</span>{" "}
                          <span>{log.message}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              {/* Agent Outputs Explorer Preview */}
              <div className="glass-card rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden flex flex-col min-h-[400px]">
                <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-4 flex items-center gap-1.5 overflow-x-auto select-none custom-scrollbar">
                  {[
                    { id: "planner", label: "📋 Plan checklist" },
                    { id: "research", label: "🔍 Research notes" },
                    { id: "coder", label: "💻 Code output" },
                    { id: "reviewer", label: "🔬 QA review" },
                    { id: "documentation", label: "📝 Documentation" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedOutputTab(tab.id)}
                      className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                        selectedOutputTab === tab.id
                          ? "border-[var(--accent)] text-[var(--accent-text)]"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 p-5 text-[12.5px] leading-relaxed custom-scrollbar overflow-y-auto">
                  {getAgentOutput(selectedOutputTab) ? (
                    <div className="font-sans space-y-3 prose prose-invert select-text max-w-none">
                      {selectedOutputTab === "coder" ? (
                        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[#0d0d11]">
                          <div className="bg-[#14141a] px-4 py-2 border-b border-[var(--border)] flex justify-between items-center select-none">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">output.py / output.js</span>
                            <button
                              onClick={() => {
                                const out = getAgentOutput("coder");
                                if (out) {
                                  // strip backticks if markdown output
                                  const rawCode = out.replace(/```[a-z]*\n?/gi, "");
                                  navigator.clipboard.writeText(rawCode);
                                  addLog("[SUCCESS] Copied generated agent code to clipboard.", "success");
                                }
                              }}
                              className="text-[10px] font-bold text-[var(--accent)] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              📋 Copy Code
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-[11px] leading-5 text-[#a6accd] font-semibold bg-transparent">
                            <code>{getAgentOutput("coder")}</code>
                          </pre>
                        </div>
                      ) : (
                        parseMarkdownToReact(getAgentOutput(selectedOutputTab) || "")
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-12 text-slate-500 text-xs italic">
                      No output generated by this agent yet. Status is currently:{" "}
                      <span className="font-bold uppercase font-mono">{getAgentStatus(selectedOutputTab)}</span>.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-320px)] border border-dashed border-[var(--border)] rounded-3xl p-12 text-center bg-[var(--bg-card)]">
              <span className="text-6xl animate-float">🚀</span>
              <h3 className="text-sm font-black text-[var(--text-primary)] mt-4">LangGraph Multi-Agent Workspace</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                No active runs selected. Describe a software design objective or select a run from the history sidebar to stream live telemetry, visualize retries, and export manuals.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render logic for Mentor Chat subtab (original functionality)
  const renderMentorChat = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)] overflow-hidden animate-fadeIn">
        {/* Column 1: Chat History Sessions Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
          <button
            onClick={startNewChat}
            className="btn-accent w-full py-3.5 px-4 rounded-2xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[var(--shadow-glow)]"
          >
            <span>➕</span> New Conversation
          </button>

          {/* Sessions scroll list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {chatSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    addLog(`[SYSTEM] Switched active chat session context to "${session.title}"`, "info");
                  }}
                  className="group p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 relative hover:translate-x-1 border-[var(--border)]"
                  style={{
                    borderColor: isActive ? "var(--accent)" : "var(--border)",
                    background: isActive ? "var(--accent-soft)" : "var(--bg-card)",
                    boxShadow: isActive ? "0 0 10px rgba(255,107,53,0.05)" : "var(--shadow-sm)"
                  }}
                >
                  {isActive && (
                    <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-[var(--accent)]" />
                  )}
                  <div className="min-w-0 flex-1 pl-1">
                    <h5 className="text-xs font-bold truncate text-[var(--text-primary)]">
                      {session.title}
                    </h5>
                    <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                      {session.messages.length} messages
                    </span>
                  </div>

                  <button
                    onClick={(e) => deleteChatSession(session.id, e)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] cursor-pointer opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-500"
                    style={{ color: "var(--text-muted)" }}
                    title="Delete Session"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Central Chat Workspace */}
        <div className="lg:col-span-6 glass-card rounded-3xl flex flex-col overflow-hidden h-full border border-[var(--border)] bg-[var(--bg-card)]">
          {/* Chat Area Header */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <div>
                <h4 className="text-xs font-black tracking-tight">AI Mentor Console</h4>
                <span className="text-[9px] font-mono text-slate-400">Context bounds active</span>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]">
              ⚡ Gemini 3.5 Flash
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 custom-scrollbar bg-[var(--bg-input)]/10">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                <span className="text-5xl animate-float">🤖</span>
                <div>
                  <h3 className="text-sm font-black">AI-OS Cognitive Architect Workspace</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Select a quick shortcut prompt card below or type your instruction to design system databases and sandbox docker APIs.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-3.5 max-w-[90%] ${
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[10px] shadow-sm flex-shrink-0"
                    style={msg.sender === "user" 
                      ? { background: "var(--accent)", color: "white" }
                      : { background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent)" }
                    }>
                    {msg.sender === "user" ? (user?.displayName?.[0] || "U") : "Ω"}
                  </div>

                  {/* Bubble Card */}
                  <div className="group relative flex flex-col gap-1">
                    <div className={`rounded-2xl p-4 text-[12.5px] leading-relaxed shadow-sm transition-all duration-200 border ${
                      msg.sender === "user" 
                        ? "rounded-tr-none" 
                        : "rounded-tl-none"
                    }`}
                    style={msg.sender === "user"
                      ? { background: "var(--accent)", color: "white", borderColor: "var(--accent)" }
                      : { background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }
                    }>
                      {msg.sender === "user" ? (
                        <div className="whitespace-pre-line font-sans font-semibold">{msg.text}</div>
                      ) : (
                        <div className="font-sans space-y-1.5">{parseMarkdownToReact(msg.text)}</div>
                      )}
                      
                      <div className="flex justify-between items-center text-[8px] font-mono mt-2.5 opacity-60">
                        <span>{msg.timestamp}</span>
                        {msg.sender === "assistant" && msg.text && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.text);
                              addLog("[SUCCESS] Copied AI Mentor response to clipboard.", "success");
                            }}
                            className="py-0.5 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
                            title="Copy Message Text"
                          >
                            📋 Copy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* AI Thinking Multi-Stage Loader */}
            {agentThinking && (
              <div className="flex items-start gap-3.5 max-w-[85%] mr-auto animate-pulse">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent)]">
                  Ω
                </div>
                <div className="rounded-2xl rounded-tl-none p-4 text-[11px] font-mono tracking-wider flex items-center gap-2.5 border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 font-bold text-[var(--accent)] animate-bounce font-mono">
                    <span>[</span>
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)] inline-block animate-ping" />
                    <span>]</span>
                  </span>
                  
                  <span className="font-semibold">
                    {agentThinkingStep === 0 && "🔍 Analyzing monorepo framework index..."}
                    {agentThinkingStep === 1 && "🚀 Ingesting vector search indexes..."}
                    {agentThinkingStep === 2 && "💡 Formulating optimal coding templates..."}
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input & Prompt Cards */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-sidebar)]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {[
                { title: "Boilerplate", text: "⚡ FastAPI Relational Code", cmd: "/code Build FastAPI database schemas with transaction borders" },
                { title: "Database", text: "🐘 Verify SQL Migrations", cmd: "/db Trigger postgres check queries and health" },
                { title: "Semantic RAG", text: "🎯 Cosine Search Qdrant", cmd: "/rag Cosine similarity points search indices" },
                { title: "Blueprints", text: "💡 Project Architect ideas", cmd: "/idea Suggest 3 personalized advanced project ideas" },
                { title: "Report", text: "📊 Skill Mastery stats", cmd: "/summary Retrieve active skill levels, XP logs, and streaks" },
                { title: "Sandbox", text: "🐛 Resilient Lock Debug", cmd: "/debug Correct transaction locks in SQLite/PostgreSQL completions" },
              ].map((chip, i) => (
                <button 
                  key={i}
                  onClick={() => handleSendMessage(chip.cmd)}
                  className="p-2.5 rounded-xl text-left border hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-all cursor-pointer flex flex-col justify-between gap-1 group bg-[var(--bg-card)] border-[var(--border)]"
                >
                  <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-500 group-hover:text-[var(--accent)]">{chip.title}</span>
                  <span className="text-[10px] font-semibold text-slate-300 truncate">{chip.text}</span>
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
              className="flex items-center gap-3 bg-[var(--bg-input)] rounded-2xl px-4 py-3 border shadow-inner focus-within:ring-2 focus-within:ring-[var(--accent-soft)] transition-all border-[var(--border)]"
            >
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask the AI mentor to write schemas, check sandbox files..."
                className="flex-1 text-[13px] outline-none bg-transparent text-[var(--text-primary)]"
              />
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-slate-500 border border-[var(--border)] rounded px-1.5 py-0.5 select-none hidden xs:inline">
                  8,192 tokens
                </span>
                <button type="submit" 
                  className="w-8 h-8 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)] text-white hover:scale-105 transition-all flex items-center justify-center font-bold text-xs select-none shadow-[var(--shadow-glow)] cursor-pointer"
                >
                  ➔
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Column 3: Chat Sidebar (Workspace Context) */}
        <div className="lg:col-span-3 flex flex-col gap-5 h-full overflow-y-auto pr-1">
          <div className="glass-card rounded-2xl p-5 border border-[var(--border)] bg-[var(--bg-card)]">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-3 pb-1 border-b border-[var(--border)] text-slate-400">
              Cognitive Topology
            </h4>
            <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
              Currently routing through **Antigravity v0.1** custom developer setup. Synced with local monorepo schemas and SQLite/PostgreSQL telemetry databases.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-[var(--border)] bg-[var(--bg-card)]">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-3 pb-1 border-b border-[var(--border)] text-slate-400">
              Cognitive CLI Slash Tags
            </h4>
            <ul className="space-y-3 font-mono text-[10px]">
              {[
                { cmd: "/code [prompt]", desc: "Generates code structures" },
                { cmd: "/db [query]", desc: "Triggers PostgreSQL diagnostic queries" },
                { cmd: "/rag [concept]", desc: "Searches vector databases indices" },
                { cmd: "/idea [track]", desc: "Compiles personalized project blueprints" },
                { cmd: "/summary [profile]", desc: "Audits active XP logs & streaks" },
                { cmd: "/debug [code]", desc: "Audits transaction rollback exceptions" },
              ].map((item, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="font-bold text-[var(--accent-text)]">{item.cmd}</span>
                  <span className="text-slate-500">{item.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Subtab Navigation Bar */}
      <div className="flex border-b border-[var(--border)] select-none">
        <button
          onClick={() => setSubTab("orchestrator")}
          className={`pb-3 px-6 font-bold text-xs tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            subTab === "orchestrator"
              ? "border-[var(--accent)] text-[var(--accent-text)]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          🕵️ Multi-Agent Orchestrator
        </button>
        <button
          onClick={() => setSubTab("chat")}
          className={`pb-3 px-6 font-bold text-xs tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            subTab === "chat"
              ? "border-[var(--accent)] text-[var(--accent-text)]"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          💬 AI Mentor Chat
        </button>
      </div>

      {/* Rendering Active Tab */}
      {subTab === "orchestrator" ? renderOrchestrator() : renderMentorChat()}
    </div>
  );
}
