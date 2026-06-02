import React from "react";

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-190px)] animate-fadeIn">
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
                  <h5 className="text-xs font-bold truncate" style={{ color: isActive ? "var(--accent-text)" : "var(--text-primary)" }}>
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
      <div className="lg:col-span-6 glass-card rounded-3xl flex flex-col overflow-hidden h-full border border-[var(--border)]">
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
                  {msg.sender === "user" ? (user.displayName?.[0] || "U") : "Ω"}
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
                
                {/* Bouncing Brackets loader */}
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

        {/* Chat Input & Categorized prompt cards */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-sidebar)]">
          {/* Floating Prompt Library Cards Grid */}
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

          {/* Custom Perplexity-style input box */}
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            className="flex items-center gap-3 bg-[var(--bg-input)] rounded-2xl px-4 py-3 border shadow-inner focus-within:ring-2 focus-within:ring-[var(--accent-soft)] transition-all border-[var(--border)]"
          >
            <label htmlFor="chat-message-input" className="sr-only">Ask the AI agent</label>
            <input 
              id="chat-message-input"
              name="chatMessage"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask the AI agent to write schemas, check sandbox files..."
              className="flex-1 text-[13px] outline-none bg-transparent"
              style={{ color: "var(--text-primary)" }}
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
        <div className="glass-card rounded-2xl p-5 border border-[var(--border)]">
          <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-3 pb-1 border-b border-[var(--border)] text-slate-400">
            Cognitive Topology
          </h4>
          <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
            Currently routing through **Antigravity v0.1** custom developer setup. Synced with local monorepo schemas and SQLite/PostgreSQL telemetry databases.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-[var(--border)]">
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
}
