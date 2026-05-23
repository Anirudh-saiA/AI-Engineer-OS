"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";

type Tab = "dashboard" | "agent" | "database" | "vector" | "settings";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface TelemetryRow {
  id: string;
  event: string;
  status: "success" | "warning" | "error";
  duration: number;
  timestamp: string;
}

export default function Home() {
  const { user, loading: authLoading, signInWithGoogle, signInWithGithub, signOut } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Infrastructure / Status States
  const [fastapiOnline, setFastapiOnline] = useState<boolean | null>(null);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [logs, setLogs] = useState<Array<{ text: string; type: "system" | "success" | "config" | "info" | "error" }>>([
    { text: "[SYSTEM] Initializing AI-Engineer-OS developer stack...", type: "system" },
    { text: "[SUCCESS] Git repository initialized locally. Active: user.name=\"Anirudh-saiA\"", type: "success" },
    { text: "[SUCCESS] Generated 9-tier core monorepo folder layouts.", type: "success" },
    { text: "[SUCCESS] Bootstrapped Next.js Frontend Framework.", type: "success" },
    { text: "[CONFIG] Tailwind CSS v4 and TypeScript configured in /frontend.", type: "config" },
  ]);

  // Tab 2: Cognitive Agent Chat States
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "assistant",
      text: "👋 Hello Developer! I am your AI-Engineer-OS Cognitive Agent. I can help you orchestrate container sandboxes, manage your Postgres migrations, query vector stores, or write boilerplate APIs. What are we building today?",
      timestamp: "21:11"
    }
  ]);
  const [agentThinking, setAgentThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tab 3: Database Explorer States
  const [telemetryTable, setTelemetryTable] = useState<TelemetryRow[]>([
    { id: "TX-901", event: "auth/session-authorized", status: "success", duration: 12, timestamp: "21:11:05" },
    { id: "TX-902", event: "postgres/pool-connected", status: "success", duration: 8, timestamp: "21:11:06" },
    { id: "TX-903", event: "gateway/health-query", status: "success", duration: 15, timestamp: "21:11:15" },
    { id: "TX-904", event: "vector/qdrant-ping-failure", status: "warning", duration: 120, timestamp: "21:11:22" },
  ]);
  const [dbChecking, setDbChecking] = useState(false);

  // Tab 4: Vector Embeddings States
  const [vectorQuery, setVectorQuery] = useState("");
  const [vectorResults, setVectorResults] = useState<any[]>([]);
  const [vectorSearching, setVectorSearching] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Tab 5: Settings States
  const [activeModel, setActiveModel] = useState("gemini-3.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [debugMode, setDebugMode] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("You are Antigravity, a professional agentic developer working inside the AI-Engineer-OS platform.");

  // Helper log function
  const addLog = (text: string, type: "system" | "success" | "config" | "info" | "error") => {
    setLogs((prev) => [...prev, { text, type }]);
  };

  // REST API Status Query
  const fetchStatus = async () => {
    if (!user) return;
    setFastapiOnline(null);
    addLog("[API] Querying REST API gateway status from http://localhost:8000/api/v1/system/status...", "system");
    try {
      const res = await fetch("http://localhost:8000/api/v1/system/status", {
        headers: {
          "Authorization": `Bearer ${user.uid}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBackendStatus(data);
        setFastapiOnline(true);
        addLog(`[SUCCESS] API Connection Established. Project: ${data.details.project}, Version: ${data.version}, Uptime: ${data.uptime_seconds}s`, "success");
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      setFastapiOnline(false);
      setBackendStatus(null);
      addLog(`[ERROR] Gateway Connection Failed. Ensure uvicorn dev server is running on port 8000.`, "error");
    }
  };

  // Sync auth updates
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        addLog(`[SUCCESS] Developer identity verified (Firebase): ${user.email}`, "success");
        addLog("[SYSTEM] Connection to AI-Engineer-OS API gateway unlocked.", "system");
        fetchStatus();
      } else {
        setLogs((prev) => [
          ...prev,
          { text: "[WARNING] RESTRICTED ACCESS: Developer authentication credentials required.", type: "error" }
        ]);
      }
    }
  }, [user, authLoading]);

  // Scroll Chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentThinking]);

  // Handle Mock Chat sends
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setAgentThinking(true);
    addLog(`[AGENT] Processing dialogue input: "${text.substring(0, 30)}..."`, "info");

    // Simulate Agent responses after delay
    setTimeout(() => {
      let replyText = "I've processed your query. Let me know how else I can assist you with your AI-Engineer-OS code!";
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes("code") || lowerText.includes("/code")) {
        replyText = "Here is a clean Python FastAPI connection check boilerplate:\n\n```python\nfrom fastapi import FastAPI, Depends\nfrom app.api.deps import verify_token\n\napp = FastAPI()\n\n@app.get(\"/api/check\")\ndef check(user = Depends(verify_token)):\n    return {\"status\": \"secure\", \"user_id\": user.uid}\n```\nWould you like me to commit this code to the repository?";
      } else if (lowerText.includes("database") || lowerText.includes("postgres") || lowerText.includes("/db")) {
        replyText = "I scanned the database models in `/backend/app/models/`. You have tables mapped for telemetry, workspaces, and chat indices. I can write a new SQLAlchemy schema or execute a migration. What would you like to build?";
      } else if (lowerText.includes("vector") || lowerText.includes("qdrant") || lowerText.includes("/rag")) {
        replyText = "Qdrant vector client is initialized on host port 6333. I've prepared a document ingestion pipeline. You can drag and drop your text files in the Vector tab to split them into chunks, create embeddings, and upsert them to Qdrant.";
      } else if (lowerText.includes("system") || lowerText.includes("health") || lowerText.includes("/system")) {
        replyText = `Backend Status: ${fastapiOnline ? "ONLINE (Port 8000)" : "OFFLINE"}. PostgreSQL container running on host port 5434. The infrastructure looks healthy. You can refresh status details at any time from the Main Dashboard panel.`;
      }

      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: "assistant",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setAgentThinking(false);
      addLog("[SUCCESS] Agent response compiled.", "success");
    }, 1200);
  };

  // Database Tab: Trigger a live DB ping check
  const triggerDbCheck = async () => {
    if (!user) return;
    setDbChecking(true);
    addLog("[API] Sending db-check query to backend...", "system");
    try {
      const res = await fetch("http://localhost:8000/api/v1/system/db-check", {
        headers: {
          "Authorization": `Bearer ${user.uid}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        addLog(`[SUCCESS] Database response: ${JSON.stringify(data)}`, "success");
        // Add new success row
        const newRow: TelemetryRow = {
          id: `TX-${Math.floor(100 + Math.random() * 900)}`,
          event: "postgres/live-health-check",
          status: "success",
          duration: data.query_duration_ms || 18,
          timestamp: new Date().toLocaleTimeString()
        };
        setTelemetryTable((prev) => [newRow, ...prev]);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      addLog(`[ERROR] Database check failed. Postgres may not be ready.`, "error");
      const newRow: TelemetryRow = {
        id: `TX-${Math.floor(100 + Math.random() * 900)}`,
        event: "postgres/health-check-failed",
        status: "error",
        duration: 0,
        timestamp: new Date().toLocaleTimeString()
      };
      setTelemetryTable((prev) => [newRow, ...prev]);
    } finally {
      setDbChecking(false);
    }
  };

  // Database Tab: Inject simulated telemetry event
  const insertMockTelemetry = () => {
    const mockEvents = [
      { event: "auth/user-token-refreshed", status: "success", duration: 8 },
      { event: "vector/index-upsert-batch", status: "success", duration: 84 },
      { event: "redis/cache-hit", status: "success", duration: 2 },
      { event: "sandbox/container-build", status: "success", duration: 920 },
      { event: "ai-agent/model-inference-timeout", status: "error", duration: 4200 },
    ];
    const picked = mockEvents[Math.floor(Math.random() * mockEvents.length)];
    const newRow: TelemetryRow = {
      id: `TX-${Math.floor(100 + Math.random() * 900)}`,
      event: picked.event,
      status: picked.status as any,
      duration: picked.duration,
      timestamp: new Date().toLocaleTimeString()
    };
    setTelemetryTable((prev) => [newRow, ...prev]);
    addLog(`[DATABASE] Injected mock transaction log: ${picked.event} (duration: ${picked.duration}ms)`, "success");
  };

  // Vector Tab: Mock Search
  const handleVectorSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vectorQuery.trim()) return;
    setVectorSearching(true);
    addLog(`[VECTOR] Performing cosine similarity index search: "${vectorQuery}"`, "info");
    
    setTimeout(() => {
      const results = [
        { score: 0.985, doc: "backend/app/api/deps.py: Verify authentication token via Bearer header authorization protocol.", category: "auth" },
        { score: 0.912, doc: "backend/app/db/session.py: SQLAlchemy PostgreSQL engine connection pools on port 5434.", category: "database" },
        { score: 0.843, doc: "frontend/src/app/firebase.ts: Client web configuration parameters supporting OAuth popups.", category: "config" },
      ].filter(r => r.doc.toLowerCase().includes(vectorQuery.toLowerCase()) || vectorQuery.length > 2);
      
      setVectorResults(results);
      setVectorSearching(false);
      addLog(`[SUCCESS] Vector match complete. Found ${results.length} relevant documents.`, "success");
    }, 800);
  };

  // Vector Tab: Mock File Upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      addLog(`[VECTOR] Reading document file: "${file.name}" (${file.size} bytes)`, "info");
      
      setTimeout(() => {
        addLog(`[SUCCESS] Tokenized document into 4 chunks. Embedded with text-embedding-ada-002. Upserted to Qdrant collection 'ai_engineer_kb'.`, "success");
      }, 1000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-indigo-600 animate-spin"></div>
          <p className="font-mono text-xs text-slate-500 tracking-wider">Validating Firebase Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex font-sans relative overflow-hidden">
      
      {/* Background Soft Glow Effects (Inspired by Magic UI Light Theme) */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-indigo-200/20 via-violet-100/10 to-fuchsia-100/15 blur-[130px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-cyan-100/15 via-blue-100/10 to-indigo-100/20 blur-[130px] pointer-events-none animate-pulse-glow"></div>

      {!user ? (
        /* ================= AUTHENTICATION LOCK SCREEN ================= */
        <div className="flex-1 min-h-screen flex items-center justify-center px-4 z-10">
          <div className="glass-card max-w-lg w-full rounded-3xl p-8 relative border border-slate-200/60 text-center shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center font-semibold text-xl text-white mx-auto shadow-md mb-6 animate-bounce">
              Ω
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-semibold font-mono tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
              Secure Auth Required
            </span>
            <h2 className="text-3xl font-extrabold mt-4 tracking-tight text-slate-900 leading-tight">
              Unlock Your Autonomous Developer Stack
            </h2>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed max-w-md mx-auto">
              Please authenticate using your Google or GitHub credentials via Firebase Popup to access the central agentic controls, container sandbox pipelines, vector indices, and database control maps.
            </p>
            
            {/* OAuth Sign-In Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 justify-center">
              <button 
                onClick={signInWithGoogle}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-98 text-white font-semibold text-xs tracking-wide transition-all shadow-sm border border-slate-950 flex items-center justify-center gap-2.5 cursor-pointer glow-btn"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.386-2.87-6.386-6.39 0-3.51 2.87-6.386 6.386-6.386 1.629 0 3.12.607 4.269 1.706l3.12-3.12C19.29 2.217 15.93 1 12.24 1 5.617 1 0 6.617 0 13.24c0 6.618 5.617 12.24 12.24 12.24 6.887 0 12.24-5.358 12.24-12.24 0-.847-.075-1.666-.225-2.455H12.24z"/>
                </svg>
                Sign In with Google
              </button>

              <button 
                onClick={signInWithGithub}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-white hover:bg-slate-50 active:scale-98 text-slate-800 font-semibold text-xs tracking-wide transition-all shadow-xs border border-slate-200 hover:border-slate-300 flex items-center justify-center gap-2.5 cursor-pointer glow-btn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                Sign In with GitHub
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 font-mono mt-8">
              AI-Engineer-OS Workspace v0.1 • Authorized to Anirudh-saiA
            </p>
          </div>
        </div>
      ) : (
        /* ================= PREMIUM SIDEBAR LAYOUT ================= */
        <div className="flex-1 min-h-screen flex relative z-10">
          
          {/* LEFT PERSISTENT SIDEBAR */}
          <aside className={`border-r border-slate-200/60 bg-white/80 backdrop-blur-md flex flex-col transition-all duration-300 z-30 sticky top-0 h-screen ${
            sidebarCollapsed ? "w-20" : "w-64"
          }`}>
            
            {/* Sidebar Logo Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center font-bold text-md text-white shadow-md flex-shrink-0 animate-pulse">
                  Ω
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-xs font-extrabold tracking-tight text-slate-900 leading-none">
                      AI-ENGINEER-OS
                    </h1>
                    <span className="text-[9px] text-indigo-600 font-mono font-semibold uppercase tracking-wider">
                      Agent Console
                    </span>
                  </div>
                )}
              </div>
              
              {/* Collapse Button */}
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center border border-slate-200/40 text-slate-500 cursor-pointer shadow-3xs"
              >
                {sidebarCollapsed ? "→" : "←"}
              </button>
            </div>

            {/* Sidebar Navigation Tabs */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              
              {/* Tab 1: Dashboard */}
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-slate-950 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                {!sidebarCollapsed && <span>Dashboard Overview</span>}
              </button>

              {/* Tab 2: Agent Terminal */}
              <button
                onClick={() => setActiveTab("agent")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "agent"
                    ? "bg-slate-950 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {!sidebarCollapsed && <span>Agent Chat Terminal</span>}
              </button>

              {/* Tab 3: Database Explorer */}
              <button
                onClick={() => setActiveTab("database")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "database"
                    ? "bg-slate-950 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                {!sidebarCollapsed && <span>Database Explorer</span>}
              </button>

              {/* Tab 4: Vector Indexes */}
              <button
                onClick={() => setActiveTab("vector")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "vector"
                    ? "bg-slate-950 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {!sidebarCollapsed && <span>Vector Search Index</span>}
              </button>

              {/* Tab 5: Settings */}
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-slate-950 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {!sidebarCollapsed && <span>Settings & Config</span>}
              </button>

            </nav>

            {/* Sidebar User Identity Profile Card */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full border border-slate-200 p-0.5 bg-white flex-shrink-0 overflow-hidden shadow-2xs">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-semibold text-white">
                      {user.displayName?.[0] || "D"}
                    </div>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                      {user.displayName || "Developer"}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono truncate leading-none mt-0.5">
                      {user.email}
                    </p>
                  </div>
                )}
              </div>
              
              {!sidebarCollapsed && (
                <button 
                  onClick={signOut}
                  className="w-full mt-3 py-1.5 px-3 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-semibold text-[10px] tracking-wide transition-all border border-slate-200 hover:border-rose-100 cursor-pointer shadow-3xs text-center"
                >
                  Disconnect Session
                </button>
              )}
            </div>
          </aside>

          {/* MAIN CANVAS AREA */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* Dynamic Top Header Bar */}
            <header className="h-16 border-b border-slate-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                  {activeTab === "dashboard" && "Dashboard Overview"}
                  {activeTab === "agent" && "Cognitive Agent Terminal"}
                  {activeTab === "database" && "PostgreSQL Database Explorer"}
                  {activeTab === "vector" && "Semantic Vector Search Index"}
                  {activeTab === "settings" && "OS System Configurations"}
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-slate-100 text-slate-500 border border-slate-200/60">
                    Live
                  </span>
                </h2>
                <p className="text-[9px] text-slate-400 font-mono">
                  Path: /workspace/{activeTab}
                </p>
              </div>

              {/* Global system status telemetry */}
              <div className="flex items-center gap-4 text-[10px] font-mono">
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-slate-400">Gateway:</span>
                  <span className={`w-2 h-2 rounded-full ${fastapiOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                  <span className="text-slate-700 font-semibold">{fastapiOnline ? "8000" : "Offline"}</span>
                </div>
                <div className="h-3 w-[1px] bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Model:</span>
                  <span className="text-indigo-600 font-semibold uppercase">{activeModel.replace(/-/g, " ")}</span>
                </div>
              </div>
            </header>

            {/* Dynamic Content Pane */}
            <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
              
              {/* ================= TAB 1: DASHBOARD PANEL ================= */}
              {activeTab === "dashboard" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Stat Card 1 */}
                    <div className="glass-card rounded-2xl p-5 border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">FastAPI Gateway</p>
                        <h3 className="text-xl font-bold mt-1 text-slate-900">Uvicorn Dev</h3>
                        <p className="text-[9px] text-indigo-600 font-mono mt-1">Status: {fastapiOnline ? "Healthy" : "Locked/Closed"}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                        fastapiOnline ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                      }`}>
                        ⚡
                      </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="glass-card rounded-2xl p-5 border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Postgres DB</p>
                        <h3 className="text-xl font-bold mt-1 text-slate-900">Port 5434</h3>
                        <p className="text-[9px] text-emerald-600 font-mono mt-1">Pool: Active</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-lg">
                        🐘
                      </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="glass-card rounded-2xl p-5 border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Qdrant Vector</p>
                        <h3 className="text-xl font-bold mt-1 text-slate-900">Port 6333</h3>
                        <p className="text-[9px] text-cyan-600 font-mono mt-1">Cosine similarity online</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center text-lg">
                        🎯
                      </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="glass-card rounded-2xl p-5 border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Active Workspace</p>
                        <h3 className="text-xl font-bold mt-1 text-slate-900">AI-Engineer-OS</h3>
                        <p className="text-[9px] text-indigo-600 font-mono mt-1">Branch: main</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-lg">
                        📂
                      </div>
                    </div>

                  </div>

                  {/* Core Console Log Terminal & Quick Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Log Console Terminal (8 Cols) */}
                    <div className="lg:col-span-8 glass-card rounded-2xl p-6 flex flex-col min-h-[400px] border border-slate-200/60">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                          </span>
                          <h3 className="font-mono text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Cognitive OS Console</h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setLogs([])}
                            className="text-[9px] font-mono text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Log Rows */}
                      <div className="flex-1 bg-slate-50/80 rounded-xl p-4 font-mono text-[11px] leading-6 text-slate-600 border border-slate-200/50 overflow-y-auto space-y-2 max-h-[300px] shadow-inner">
                        {logs.map((log, idx) => {
                          let colorClass = "text-slate-600";
                          if (log.type === "system") colorClass = "text-indigo-600 font-semibold";
                          else if (log.type === "success") colorClass = "text-emerald-600";
                          else if (log.type === "config") colorClass = "text-cyan-600";
                          else if (log.type === "error") colorClass = "text-rose-600";
                          else if (log.type === "info") colorClass = "text-amber-600";
                          return (
                            <div key={idx} className={colorClass}>
                              {log.text}
                            </div>
                          );
                        })}
                        <div className="pt-2 border-t border-slate-200/40 flex items-center gap-1 text-slate-800">
                          <span className="text-indigo-600 font-bold">$</span>
                          <span className="border-r border-slate-600 animate-pulse pr-1">
                            aios-agent --active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Developer Options & Telemetry Info (4 Cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      
                      {/* Interactive Actions */}
                      <div className="glass-card rounded-2xl p-6 border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/40">
                        <h3 className="font-mono text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                          OS Developer Tools
                        </h3>
                        <div className="space-y-3">
                          <button 
                            onClick={fetchStatus}
                            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all border border-slate-950 bg-slate-950 hover:bg-slate-800 text-white cursor-pointer shadow-sm glow-btn"
                          >
                            Sync API Gateway Status
                          </button>
                          <button 
                            onClick={() => {
                              addLog("[SYSTEM] Instantiating Sandboxed Docker Container...", "system");
                              setTimeout(() => addLog("[SUCCESS] Sandbox online at localhost:9001 (Ubuntu 22.04)", "success"), 1000);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all border border-slate-200 hover:border-slate-300 bg-white text-slate-700 cursor-pointer shadow-3xs glow-btn"
                          >
                            Launch Sandbox Container
                          </button>
                          <button 
                            onClick={() => {
                              addLog("[SYSTEM] Running standard test execution suite...", "system");
                              setTimeout(() => addLog("[SUCCESS] Complete check passed. 0 errors, 12 warnings.", "success"), 800);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all border border-slate-200 hover:border-slate-300 bg-white text-slate-700 cursor-pointer shadow-3xs glow-btn"
                          >
                            Run Test Suites
                          </button>
                        </div>
                      </div>

                      {/* Monorepo layout details */}
                      <div className="glass-card rounded-2xl p-6 border border-slate-200/60">
                        <h3 className="font-mono text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                          Module Maps
                        </h3>
                        <ul className="space-y-3 font-mono text-[10px] text-slate-600">
                          <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-indigo-600 font-semibold">/frontend</span>
                            <span className="text-slate-800 text-xs">Next.js v14</span>
                          </li>
                          <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-indigo-600 font-semibold">/backend</span>
                            <span className="text-slate-800 text-xs">FastAPI v0.100</span>
                          </li>
                          <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-indigo-600 font-semibold">/rag-system</span>
                            <span className="text-slate-800 text-xs">LlamaIndex/Qdrant</span>
                          </li>
                        </ul>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* ================= TAB 2: AGENT TERMINAL (CHAT) ================= */}
              {activeTab === "agent" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-190px)] animate-fadeIn">
                  
                  {/* Left Chat Window Column (9 Cols) */}
                  <div className="lg:col-span-9 glass-card rounded-3xl border border-slate-200/60 bg-white flex flex-col overflow-hidden h-full">
                    
                    {/* Chat Messages Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex items-start gap-3.5 max-w-[85%] ${
                            msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                          }`}
                        >
                          {/* Avatar Circle */}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs border ${
                            msg.sender === "user" 
                              ? "bg-slate-950 text-white border-slate-950" 
                              : "bg-indigo-50 text-indigo-600 border-indigo-100"
                          }`}>
                            {msg.sender === "user" ? (user.displayName?.[0] || "U") : "Ω"}
                          </div>

                          {/* Chat Bubble Box */}
                          <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-3xs border ${
                            msg.sender === "user"
                              ? "bg-slate-950 text-white border-slate-950 rounded-tr-none"
                              : "bg-slate-50/60 text-slate-800 border-slate-200/60 rounded-tl-none"
                          }`}>
                            <div className="whitespace-pre-line font-sans">{msg.text}</div>
                            <span className={`block text-[8px] font-mono mt-2 text-right ${
                              msg.sender === "user" ? "text-slate-400" : "text-slate-400"
                            }`}>
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Thinking Loader */}
                      {agentThinking && (
                        <div className="flex items-start gap-3.5 max-w-[80%] mr-auto">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs animate-pulse">
                            Ω
                          </div>
                          <div className="bg-slate-50/60 text-slate-400 border border-slate-200/60 rounded-2xl rounded-tl-none p-4 text-xs font-mono tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-150"></span>
                            <span>Agent parsing telemetry files...</span>
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Footer Area */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/40">
                      
                      {/* Suggestion Chips */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button 
                          onClick={() => handleSendMessage("/code Build a FastAPI database model table")}
                          className="px-2.5 py-1 rounded-full text-[9px] font-mono bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 transition-all cursor-pointer shadow-3xs"
                        >
                          ⚡ Generate DB Model code
                        </button>
                        <button 
                          onClick={() => handleSendMessage("/db Trigger db-check route and verify migrations")}
                          className="px-2.5 py-1 rounded-full text-[9px] font-mono bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 transition-all cursor-pointer shadow-3xs"
                        >
                          🐘 SQL Migration status
                        </button>
                        <button 
                          onClick={() => handleSendMessage("/rag Query matching files inside Qdrant index")}
                          className="px-2.5 py-1 rounded-full text-[9px] font-mono bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 transition-all cursor-pointer shadow-3xs"
                        >
                          🎯 Vector Search index docs
                        </button>
                      </div>

                      {/* Real Text Input */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="flex gap-2"
                      >
                        <input 
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask the AI-Engineer agent to write code, review container settings..."
                          className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-400 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 transition-all shadow-inner"
                        />
                        <button 
                          type="submit"
                          className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-98 text-white text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center cursor-pointer"
                        >
                          Send
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* Right Chat Parameters (3 Cols) */}
                  <div className="lg:col-span-3 flex flex-col gap-5 h-full overflow-y-auto pr-1">
                    
                    {/* Cognitive Presets Info */}
                    <div className="glass-card rounded-2xl p-5 border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/20">
                      <h4 className="font-mono text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                        Agent Topologies
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Currently using **Antigravity v0.1** custom developer configuration. Backed by Google Gemini 3.5 Flash context maps.
                      </p>
                    </div>

                    {/* Quick Command Reference */}
                    <div className="glass-card rounded-2xl p-5 border border-slate-200/60">
                      <h4 className="font-mono text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                        OS Command Tags
                      </h4>
                      <ul className="space-y-2 font-mono text-[9px] text-slate-600">
                        <li className="flex flex-col gap-0.5">
                          <span className="font-semibold text-indigo-600">/code [prompt]</span>
                          <span className="text-slate-400">Generates code templates</span>
                        </li>
                        <li className="flex flex-col gap-0.5 mt-2">
                          <span className="font-semibold text-indigo-600">/db [query]</span>
                          <span className="text-slate-400">Checks Postgres schema logs</span>
                        </li>
                        <li className="flex flex-col gap-0.5 mt-2">
                          <span className="font-semibold text-indigo-600">/rag [concept]</span>
                          <span className="text-slate-400">Semantically queries files</span>
                        </li>
                      </ul>
                    </div>

                  </div>

                </div>
              )}

              {/* ================= TAB 3: DATABASE EXPLORER ================= */}
              {activeTab === "database" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Database Actions Bar */}
                  <div className="glass-card rounded-2xl p-5 border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">PostgreSQL Transaction Relational logs</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Pool engine active on loopback 127.0.0.1:5434 • Base models synchronized automatically.
                      </p>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                      <button 
                        onClick={triggerDbCheck}
                        disabled={dbChecking}
                        className="flex-1 sm:flex-none py-2 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all border border-slate-950 bg-slate-950 hover:bg-slate-800 text-white cursor-pointer shadow-sm glow-btn flex items-center justify-center gap-2"
                      >
                        {dbChecking && <span className="w-3 h-3 rounded-full border-2 border-t-transparent border-white animate-spin"></span>}
                        Trigger Live DB Check
                      </button>
                      <button 
                        onClick={insertMockTelemetry}
                        className="flex-1 sm:flex-none py-2 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all border border-slate-200 hover:border-slate-300 bg-white text-slate-700 cursor-pointer shadow-3xs"
                      >
                        Insert Mock Telemetry
                      </button>
                    </div>
                  </div>

                  {/* Grid Table Container */}
                  <div className="glass-card rounded-2xl border border-slate-200/60 overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-mono tracking-wider uppercase text-[9px]">
                            <th className="p-4 font-bold">Transaction ID</th>
                            <th className="p-4 font-bold">Telemetry Event Name</th>
                            <th className="p-4 font-bold">Status Badge</th>
                            <th className="p-4 font-bold">Execution Time (ms)</th>
                            <th className="p-4 font-bold">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {telemetryTable.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-mono font-semibold text-slate-900">{row.id}</td>
                              <td className="p-4 font-mono text-indigo-600 font-semibold">{row.event}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold font-mono border ${
                                  row.status === "success" 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                    : row.status === "warning" 
                                      ? "bg-amber-50 text-amber-600 border-amber-100"
                                      : "bg-rose-50 text-rose-600 border-rose-100"
                                }`}>
                                  {row.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-4 font-mono">{row.duration === 0 ? "timeout" : `${row.duration} ms`}</td>
                              <td className="p-4 font-mono text-slate-400">{row.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ================= TAB 4: VECTOR INDEX SEARCH ================= */}
              {activeTab === "vector" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Main Vector Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Vector Search Input Panel (7 Cols) */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                      
                      {/* Search box card */}
                      <div className="glass-card rounded-2xl p-6 border border-slate-200/60 bg-white">
                        <h3 className="text-sm font-bold text-slate-900 mb-2">Qdrant Vector Embedding Search</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                          Search cognitive indices using cosine similarity matching. Enter keywords to query embedded workspace files.
                        </p>

                        <form onSubmit={handleVectorSearch} className="flex gap-2">
                          <input 
                            type="text"
                            value={vectorQuery}
                            onChange={(e) => setVectorQuery(e.target.value)}
                            placeholder="Type query to find nearest-neighbor documentation..."
                            className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-400 focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-800 transition-all shadow-inner"
                          />
                          <button 
                            type="submit"
                            disabled={vectorSearching}
                            className="py-2 px-5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide transition-all border border-slate-950 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                          >
                            {vectorSearching && <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-white animate-spin"></span>}
                            Search Index
                          </button>
                        </form>
                      </div>

                      {/* Embeddings Search results */}
                      <div className="glass-card rounded-2xl p-6 border border-slate-200/60 bg-white flex-1 min-h-[250px]">
                        <h4 className="font-mono text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                          Embeddings Match Results
                        </h4>

                        {vectorResults.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <span className="text-2xl mb-2 text-slate-300">🔍</span>
                            <p className="text-[11px] text-slate-400">No matching vectors found. Type a query above (e.g. "auth" or "postgres") to simulate.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {vectorResults.map((res, i) => (
                              <div key={i} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:border-indigo-200 transition-all flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                                    {res.category}
                                  </span>
                                  <p className="text-xs font-mono text-slate-700 leading-relaxed mt-1">{res.doc}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-xs font-bold text-slate-900 font-mono">
                                    {(res.score * 100).toFixed(1)}%
                                  </span>
                                  <p className="text-[8px] text-slate-400 font-mono">Similarity</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Ingestion Drag & Drop Zone (5 Cols) */}
                    <div className="lg:col-span-5 flex flex-col">
                      
                      <div 
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`flex-1 glass-card rounded-3xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center transition-all min-h-[350px] relative ${
                          dragActive 
                            ? "border-indigo-400 bg-indigo-50/20 scale-[1.01]" 
                            : "border-slate-300/80 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <span className="text-4xl mb-4 animate-pulse">📁</span>
                        <h4 className="text-xs font-bold text-slate-900">Drag & Drop Knowledge Base Files</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-2 max-w-xs mx-auto">
                          Split, embed, and ingest PDF, Markdown, or text documentation files automatically into your Qdrant semantic storage.
                        </p>
                        
                        <label className="mt-5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 cursor-pointer shadow-3xs transition-all">
                          Browse System Files
                          <input type="file" className="hidden" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const name = e.target.files[0].name;
                              addLog(`[VECTOR] File selected: "${name}". Tokenizing...`, "info");
                              setTimeout(() => addLog(`[SUCCESS] File "${name}" ingested successfully.`, "success"), 1000);
                            }
                          }} />
                        </label>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* ================= TAB 5: SYSTEM CONFIG CONFIGURATIONS ================= */}
              {activeTab === "settings" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* General Config Screen */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Controls Panel (8 Cols) */}
                    <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-slate-200/60 bg-white space-y-6">
                      
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">AI Engine Model Parameters</h3>
                      
                      {/* Dropdown Input */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase">Active LLM Model Topology</label>
                        <select 
                          value={activeModel}
                          onChange={(e) => {
                            setActiveModel(e.target.value);
                            addLog(`[CONFIG] System active model topology changed to: ${e.target.value}`, "config");
                          }}
                          className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 transition-all font-mono"
                        >
                          <option value="gemini-3.5-flash">Google Gemini 3.5 Flash (Recommended)</option>
                          <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                          <option value="claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                          <option value="gpt-4o">OpenAI GPT-4o</option>
                        </select>
                      </div>

                      {/* Range Parameters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        
                        {/* Temperature Slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 font-mono uppercase">
                            <span>Model Temperature</span>
                            <span className="text-indigo-600 font-bold">{temperature}</span>
                          </div>
                          <input 
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full accent-indigo-600 bg-slate-100 cursor-pointer h-1.5 rounded-lg appearance-none"
                          />
                        </div>

                        {/* Max Tokens Slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 font-mono uppercase">
                            <span>Max Output Tokens</span>
                            <span className="text-indigo-600 font-bold">{maxTokens}</span>
                          </div>
                          <input 
                            type="range"
                            min="256"
                            max="8192"
                            step="128"
                            value={maxTokens}
                            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                            className="w-full accent-indigo-600 bg-slate-100 cursor-pointer h-1.5 rounded-lg appearance-none"
                          />
                        </div>

                      </div>

                      {/* Text Prompt Area */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700 font-mono uppercase">Cognitive System Prompt Blueprint</label>
                        <textarea 
                          value={systemPrompt}
                          onChange={(e) => setSystemPrompt(e.target.value)}
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 focus:outline-none rounded-xl p-4 text-xs text-slate-800 transition-all font-mono leading-5 shadow-inner"
                        />
                      </div>

                    </div>

                    {/* Additional Toggles sidebar (4 Cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      
                      {/* OS Toggles */}
                      <div className="glass-card rounded-2xl p-6 border border-slate-200/60 bg-white">
                        <h4 className="font-mono text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                          Developer Switches
                        </h4>
                        
                        <div className="space-y-4">
                          
                          {/* Toggle 1 */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-800">Developer Debug Mode</p>
                              <p className="text-[9px] text-slate-400">Injects verbose runtime states</p>
                            </div>
                            <button 
                              onClick={() => {
                                setDebugMode(!debugMode);
                                addLog(`[CONFIG] Debug mode set to: ${!debugMode}`, "config");
                              }}
                              className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${
                                debugMode ? "bg-indigo-600" : "bg-slate-250"
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${
                                debugMode ? "left-5" : "left-1"
                              }`} />
                            </button>
                          </div>

                          {/* Toggle 2 */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                            <div>
                              <p className="text-xs font-bold text-slate-800">Mock Mode Sandbox</p>
                              <p className="text-[9px] text-slate-400">Allows offline component tests</p>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase">
                              Enabled
                            </span>
                          </div>

                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </main>

            {/* Premium Minimalistic Footer */}
            <footer className="w-full py-4 text-center text-[10px] text-slate-400 font-mono border-t border-slate-100 bg-white/40">
              AI-Engineer-OS Monorepo Workspace • Configured to username: Anirudh-saiA
            </footer>

          </div>

        </div>
      )}

    </div>
  );
}
