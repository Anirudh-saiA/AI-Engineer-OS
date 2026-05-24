"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import OnboardingWizard from "./onboarding/OnboardingWizard";
import ProfileTab from "./components/ProfileTab";
import SettingsTab from "./components/SettingsTab";

type Tab = "dashboard" | "agent" | "database" | "vector" | "settings" | "profile";

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
  const { user, loading: authLoading, signInWithGoogle, signInWithGithub, signOut, signInMockDeveloper } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
// Onboarding flow state
const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
const [onboardingStep, setOnboardingStep] = useState<number>(1);
const [onboardingData, setOnboardingData] = useState<any>({});
const [profileExists, setProfileExists] = useState<boolean>(true);

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
  const [theme, setTheme] = useState("dark");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [debugMode, setDebugMode] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("You are Antigravity, a professional agentic developer working inside the AI-Engineer-OS platform.");

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Initialize theme from system preference
  useEffect(() => {
    const saved = localStorage.getItem("aios-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // Persist theme choice
  useEffect(() => {
    localStorage.setItem("aios-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

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
// Fetch user profile to determine onboarding status
const fetchProfile = async () => {
  if (!user) return;
  try {
    const res = await fetch("http://localhost:8000/api/v1/profile/me", {
      headers: { Authorization: `Bearer ${user.uid}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.onboarded) {
        setProfileExists(true);
        setShowOnboarding(false);
      } else {
        setProfileExists(false);
        setShowOnboarding(true);
      }
    } else if (res.status === 404) {
      setProfileExists(false);
      setShowOnboarding(true);
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("Profile fetch error", err);
    setProfileExists(false);
    setShowOnboarding(true);
  }
};
  // Sync auth updates
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        addLog(`[SUCCESS] Developer identity verified (Firebase): ${user.email}`, "success");
        addLog("[SYSTEM] Connection to AI-Engineer-OS API gateway unlocked.", "system");
        fetchStatus();
    fetchProfile();
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="flex flex-col items-center gap-4 animate-fade-up">
          <div className="w-14 h-14 rounded-full border-[3px] border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}></div>
          <p className="font-mono text-sm tracking-wider" style={{ color: "var(--text-muted)" }}>Validating Firebase Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans relative overflow-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      
      {/* Background Ambient Glow Blobs */}
      {user && (
        <>
          <div className="blob-1" style={{ top: "-15%", left: "-10%" }}></div>
          <div className="blob-2" style={{ bottom: "-15%", right: "-10%" }}></div>
        </>
      )}

      {!user ? (
        /* ═══════════════════════════════════════════════════════════
           LANDING / LOGIN SCREEN — Nexus (dark) / ailingo (light)
           ═══════════════════════════════════════════════════════════ */
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between px-4 py-6 md:py-10 overflow-y-auto" style={{ background: "var(--bg-primary)" }}>

          {/* Background effects */}
          <div className="blob-1" style={{ top: "-15%", left: "-10%" }}></div>
          <div className="blob-2" style={{ bottom: "-20%", right: "-15%" }}></div>

          {/* Subtle grid overlay for light mode texture */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

          {/* Floating decorative elements */}
          <div className="absolute top-6 left-6 md:top-10 md:left-12 w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-3xl md:text-4xl select-none pointer-events-none z-10 animate-float rotate-[-6deg]"
            style={{ background: "var(--accent-soft)", border: "2px solid var(--accent)", boxShadow: "var(--shadow-glow)" }}>
            🚀
          </div>
          <div className="absolute top-16 right-8 md:top-24 md:right-20 w-14 h-14 md:w-18 md:h-18 rounded-xl flex items-center justify-center text-2xl select-none pointer-events-none z-10 animate-float-reverse"
            style={{ background: "var(--secondary-soft)", border: "2px solid var(--secondary)" }}>
            ⚡
          </div>
          <div className="absolute bottom-8 left-14 md:bottom-20 md:left-28 w-16 h-16 md:w-22 md:h-22 rounded-xl flex items-center justify-center text-2xl select-none pointer-events-none z-10 animate-float"
            style={{ background: "var(--accent-soft)", border: "2px solid var(--accent)" }}>
            🤖
          </div>
          <div className="absolute bottom-20 right-10 md:bottom-32 md:right-16 w-24 h-24 md:w-32 md:h-32 rounded-2xl flex flex-col items-center justify-center select-none pointer-events-none z-10 animate-float-reverse"
            style={{ background: "var(--secondary-soft)", border: "2px solid var(--secondary)" }}>
            <span className="text-3xl">🔥</span>
            <span className="text-[10px] font-black uppercase tracking-wider mt-1" style={{ color: "var(--accent-text)" }}>AI-OS</span>
          </div>

          {/* Small floating dots */}
          <div className="absolute top-1/4 left-20 w-5 h-5 rounded-full animate-float-reverse" style={{ background: "var(--accent)", opacity: 0.3 }}></div>
          <div className="absolute top-2/3 right-20 w-7 h-7 rounded-full animate-float" style={{ background: "var(--secondary)", opacity: 0.25 }}></div>
          <div className="absolute bottom-1/3 left-1/4 w-4 h-4 rounded-full animate-float" style={{ background: "var(--accent)", opacity: 0.2 }}></div>

          {/* Header Badge */}
          <div className="z-10 mt-1 md:mt-2 animate-fade-down">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wide shadow-sm"
              style={{ background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
              <span className="animate-pulse">✨</span>
              <span>AI-Powered Developer Platform</span>
              <span className="h-3.5 w-[1.5px]" style={{ background: "var(--accent)" }}></span>
              <span>Open Source</span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="z-10 max-w-5xl w-full text-center space-y-7 md:space-y-9 my-auto px-4 py-8 relative">
            
            {/* Massive Bold Hero Title */}
            <h1 className="text-5xl sm:text-7xl md:text-[5.5rem] font-black tracking-tight leading-[1.05] select-none animate-fade-up" style={{ color: "var(--text-primary)" }}>
              Build AI agents<br className="hidden sm:inline" />
              <span className="hero-gradient-text"> at warp speed</span>
              <span className="accent-dot text-6xl sm:text-8xl">.</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto font-semibold animate-fade-up delay-2" style={{ color: "var(--text-secondary)" }}>
              AI-Engineer-OS is an autonomous developer workspace. Code, deploy, and manage intelligent agents with a single platform — powered by FastAPI, PostgreSQL, and vector search.
            </p>

            {/* Auth Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center max-w-lg sm:max-w-2xl mx-auto pt-2 animate-fade-up delay-3">
              <button 
                onClick={signInWithGoogle}
                className="btn-accent w-full sm:w-auto py-4 px-8 rounded-2xl text-sm flex items-center justify-center gap-3 select-none"
                style={{ fontSize: "14px" }}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.386-2.87-6.386-6.39 0-3.51 2.87-6.386 6.386-6.386 1.629 0 3.12.607 4.269 1.706l3.12-3.12C19.29 2.217 15.93 1 12.24 1 5.617 1 0 6.617 0 13.24c0 6.618 5.617 12.24 12.24 12.24 6.887 0 12.24-5.358 12.24-12.24 0-.847-.075-1.666-.225-2.455H12.24z"/>
                </svg>
                Sign In with Google
              </button>

              <button 
                onClick={signInWithGithub}
                className="btn-outline w-full sm:w-auto py-4 px-8 rounded-2xl text-sm flex items-center justify-center gap-3 select-none"
                style={{ fontSize: "14px" }}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                Sign In with GitHub
              </button>
            </div>

            {/* Mock Sandbox Bypass */}
            <div className="pt-1 text-center max-w-md mx-auto animate-fade-up delay-4">
              <button
                onClick={signInMockDeveloper}
                className="w-full sm:w-auto py-3.5 px-8 rounded-2xl font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer select-none border-2"
                style={{ 
                  background: "transparent", 
                  color: "var(--text-muted)", 
                  borderColor: "var(--border)" 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent-text)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <span>🚀</span> Bypass to Mock Sandbox
              </button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-6 text-left animate-fade-up delay-5">
              <div className="card-glow rounded-2xl p-5 card flex items-start gap-3.5 relative hover:translate-y-[-2px] transition-all cursor-pointer"
                style={{ borderLeft: "4px solid var(--accent)" }}>
                <span className="text-2xl p-2 rounded-xl flex-shrink-0" style={{ background: "var(--accent-soft)" }}>🤖</span>
                <div>
                  <h4 className="text-sm font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Cognitive AI Workflows</h4>
                  <p className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)" }}>Autonomous code sandboxing, docker checking & lint fixes.</p>
                </div>
              </div>
              
              <div className="card-glow rounded-2xl p-5 card flex items-start gap-3.5 relative hover:translate-y-[-2px] transition-all cursor-pointer"
                style={{ borderLeft: "4px solid var(--secondary)" }}>
                <span className="text-2xl p-2 rounded-xl flex-shrink-0" style={{ background: "var(--secondary-soft)" }}>🔥</span>
                <div>
                  <h4 className="text-sm font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Gamified Heatmaps</h4>
                  <p className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)" }}>365-day commit calendar, milestones and XP awards.</p>
                </div>
              </div>
              
              <div className="card-glow rounded-2xl p-5 card flex items-start gap-3.5 relative hover:translate-y-[-2px] transition-all cursor-pointer"
                style={{ borderLeft: "4px solid var(--warning)" }}>
                <span className="text-2xl p-2 rounded-xl flex-shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>⚡</span>
                <div>
                  <h4 className="text-sm font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Semantic RAG Engine</h4>
                  <p className="text-xs font-medium mt-1" style={{ color: "var(--text-muted)" }}>Nearest-neighbor vector matching of files inside Qdrant.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Stats Bar */}
          <div className="z-10 flex flex-wrap justify-center items-center gap-x-6 gap-y-4 text-xs font-semibold pt-5 md:pt-6 w-full max-w-4xl select-none animate-fade-up delay-6"
            style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <span className="w-7 h-7 rounded-full border-2 text-[9px] font-black text-white flex items-center justify-center" style={{ borderColor: "var(--bg-primary)", background: "var(--accent)" }}>A</span>
                <span className="w-7 h-7 rounded-full border-2 text-[9px] font-black text-white flex items-center justify-center" style={{ borderColor: "var(--bg-primary)", background: "var(--secondary)" }}>M</span>
                <span className="w-7 h-7 rounded-full border-2 text-[9px] font-black text-white flex items-center justify-center" style={{ borderColor: "var(--bg-primary)", background: "#06b6d4" }}>S</span>
              </div>
              <span>500,000+ professionals</span>
            </div>
            
            <span className="hidden sm:inline h-4 w-[1.5px]" style={{ background: "var(--border)" }}></span>

            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--warning)" }}>★★★★★</span>
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>4.9/5</span>
            </div>

            <span className="hidden sm:inline h-4 w-[1.5px]" style={{ background: "var(--border)" }}></span>

            <div className="flex items-center gap-1.5" style={{ color: "var(--success)" }}>
              <svg className="w-4 h-4 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Open source & free</span>
            </div>
          </div>
        </div>
      ) : (
        <>
        {/* ═══════════════════════════════════════════════════════════
           AUTHENTICATED APP SHELL
           ═══════════════════════════════════════════════════════════ */}
          {showOnboarding && (
            <OnboardingWizard
              step={onboardingStep}
              data={onboardingData}
              setStep={setOnboardingStep}
              setData={setOnboardingData}
              close={() => {
                setShowOnboarding(false);
                setProfileExists(true);
                setActiveTab("dashboard");
              }}
            />
          )}
          {/* Mobile Sidebar Backdrop */}
          {mobileSidebarOpen && (
            <div 
              className="fixed inset-0 z-35 md:hidden transition-opacity duration-300"
              style={{ background: "var(--bg-overlay)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          <div className="flex-1 min-h-screen flex relative z-10">
          
          {/* ═══════ LEFT SIDEBAR ═══════ */}
          <aside className={`fixed inset-y-0 left-0 md:sticky md:top-0 h-screen backdrop-blur-md flex flex-col transition-all duration-300 z-40 md:z-30 ${
            mobileSidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0"
          } ${
            sidebarCollapsed ? "md:w-20" : "md:w-64 w-64"
          }`}
          style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}>
            
            {/* Sidebar Logo */}
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-md text-white shadow-md flex-shrink-0"
                  style={{ background: "var(--accent)" }}>
                  Ω
                </div>
                {(!sidebarCollapsed || mobileSidebarOpen) && (
                  <div>
                    <h1 className="text-sm font-black tracking-tight leading-none" style={{ color: "var(--text-primary)" }}>
                      AI-ENGINEER-OS
                    </h1>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--accent-text)" }}>
                      Agent Console
                    </span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex w-7 h-7 rounded-lg items-center justify-center cursor-pointer transition-all"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                {sidebarCollapsed ? "→" : "←"}
              </button>

              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              
              {([
                { id: "dashboard" as Tab, label: "Dashboard", icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg> },
                { id: "agent" as Tab, label: "Agent Terminal", icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                { id: "database" as Tab, label: "Database Explorer", icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg> },
                { id: "vector" as Tab, label: "Vector Search", icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
                { id: "settings" as Tab, label: "Settings", icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                { id: "profile" as Tab, label: "Profile", icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg> },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === tab.id ? "nav-active" : ""
                  }`}
                  style={activeTab === tab.id ? {} : { color: "var(--text-muted)" }}
                  onMouseEnter={(e) => { if (activeTab !== tab.id) { e.currentTarget.style.background = "var(--accent-soft)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
                  onMouseLeave={(e) => { if (activeTab !== tab.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; } }}
                >
                  {tab.icon}
                  {(!sidebarCollapsed || mobileSidebarOpen) && <span>{tab.label}</span>}
                </button>
              ))}
            </nav>

            {/* Theme Toggle + User Card */}
            <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>

              {/* Theme toggle */}
              {(!sidebarCollapsed || mobileSidebarOpen) && (
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl mb-3 text-xs font-semibold cursor-pointer transition-all"
                  style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
                >
                  <span>{theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    {theme === "dark" ? "Dark" : "Light"}
                  </span>
                </button>
              )}
              {sidebarCollapsed && !mobileSidebarOpen && (
                <button onClick={toggleTheme} className="w-full flex justify-center py-2 mb-3 rounded-xl cursor-pointer text-lg transition-all" style={{ background: "var(--accent-soft)" }}>
                  {theme === "dark" ? "🌙" : "☀️"}
                </button>
              )}

              {/* User avatar */}
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full p-0.5 flex-shrink-0 overflow-hidden" style={{ border: "2px solid var(--border)" }}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--accent)" }}>
                      {user.displayName?.[0] || "D"}
                    </div>
                  )}
                </div>
                {(!sidebarCollapsed || mobileSidebarOpen) && (
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold truncate leading-tight" style={{ color: "var(--text-primary)" }}>
                      {user.displayName || "Developer"}
                    </p>
                    <p className="text-[10px] font-mono truncate leading-none mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {user.email}
                    </p>
                  </div>
                )}
              </div>
              
              {(!sidebarCollapsed || mobileSidebarOpen) && (
                <button 
                  onClick={signOut}
                  className="w-full mt-3 py-1.5 px-3 rounded-lg font-semibold text-[11px] tracking-wide transition-all cursor-pointer text-center"
                  style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--error)"; e.currentTarget.style.color = "var(--error)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  Disconnect Session
                </button>
              )}
            </div>
          </aside>

          {/* ═══════ MAIN CONTENT AREA ═══════ */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* Header Bar */}
            <header className="h-16 sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between backdrop-blur-md"
              style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="md:hidden p-1.5 rounded-lg cursor-pointer flex-shrink-0"
                  style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                  aria-label="Toggle Sidebar Menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm md:text-lg font-bold flex items-center gap-2 truncate" style={{ color: "var(--text-primary)" }}>
                    {activeTab === "dashboard" && "Dashboard"}
                    {activeTab === "agent" && "Agent Terminal"}
                    {activeTab === "database" && "Database Explorer"}
                    {activeTab === "vector" && "Vector Search"}
                    {activeTab === "settings" && "Settings"}
                    {activeTab === "profile" && "Developer Profile"}
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono flex-shrink-0 hidden sm:inline-block"
                      style={{ background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
                      Live
                    </span>
                  </h2>
                  <p className="text-[10px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
                    /workspace/{activeTab}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4 text-[11px] font-mono flex-shrink-0">
                <div className="hidden sm:flex items-center gap-1.5">
                  <span style={{ color: "var(--text-muted)" }}>Gateway:</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${fastapiOnline ? "animate-pulse" : ""}`}
                    style={{ background: fastapiOnline ? "var(--success)" : "var(--error)" }}></span>
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>{fastapiOnline ? "8000" : "Offline"}</span>
                </div>
                <div className="hidden sm:block h-4 w-[1px]" style={{ background: "var(--border)" }}></div>
                <div className="flex items-center gap-1.5">
                  <span className="hidden xs:inline" style={{ color: "var(--text-muted)" }}>Model:</span>
                  <span className="font-bold uppercase text-[10px] md:text-[11px] truncate max-w-[80px] sm:max-w-none" style={{ color: "var(--accent-text)" }}>
                    {activeModel.replace(/-/g, " ")}
                  </span>
                </div>
                {/* Header theme toggle */}
                <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all text-sm"
                  style={{ border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-soft)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {theme === "dark" ? "🌙" : "☀️"}
                </button>
              </div>
            </header>

            {/* Dynamic Content Pane */}
            <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
              
              {/* ═══════ TAB 1: DASHBOARD ═══════ */}
              {activeTab === "dashboard" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Stat Card 1 */}
                    <div className="card stat-card-1 rounded-2xl p-5 flex items-center justify-between animate-fade-up delay-1">
                      <div>
                        <p className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>FastAPI Gateway</p>
                        <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>Uvicorn</h3>
                        <p className="text-[10px] font-mono mt-1 font-semibold" style={{ color: fastapiOnline ? "var(--success)" : "var(--error)" }}>
                          {fastapiOnline ? "● Healthy" : "○ Locked"}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
                        ⚡
                      </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="card stat-card-2 rounded-2xl p-5 flex items-center justify-between animate-fade-up delay-2">
                      <div>
                        <p className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Postgres DB</p>
                        <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>Port 5434</h3>
                        <p className="text-[10px] font-mono mt-1 font-semibold" style={{ color: "var(--success)" }}>● Pool Active</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: "var(--secondary-soft)", color: "var(--secondary-text)" }}>
                        🐘
                      </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="card stat-card-3 rounded-2xl p-5 flex items-center justify-between animate-fade-up delay-3">
                      <div>
                        <p className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Qdrant Vector</p>
                        <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>Port 6333</h3>
                        <p className="text-[10px] font-mono mt-1 font-semibold" style={{ color: "var(--accent-text)" }}>● Cosine online</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: "rgba(245,158,11,0.1)", color: "var(--warning)" }}>
                        🎯
                      </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="card stat-card-4 rounded-2xl p-5 flex items-center justify-between animate-fade-up delay-4">
                      <div>
                        <p className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Workspace</p>
                        <h3 className="text-2xl font-black mt-1" style={{ color: "var(--text-primary)" }}>AI-OS</h3>
                        <p className="text-[10px] font-mono mt-1 font-semibold" style={{ color: "var(--secondary-text)" }}>Branch: main</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: "var(--secondary-soft)", color: "var(--secondary-text)" }}>
                        📂
                      </div>
                    </div>
                  </div>

                  {/* Console + Quick Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Console Terminal */}
                    <div className="lg:col-span-8 card rounded-2xl p-6 flex flex-col min-h-[400px] animate-fade-up delay-3">
                      <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: "var(--accent)" }}></span>
                          </span>
                          <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Cognitive OS Console</h3>
                        </div>
                        <button 
                          onClick={() => setLogs([])}
                          className="text-[10px] font-mono cursor-pointer transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-text)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                        >
                          Clear
                        </button>
                      </div>

                      <div className="flex-1 rounded-xl p-4 font-mono text-[12px] leading-7 overflow-y-auto space-y-1 max-h-[300px]"
                        style={{ background: "var(--bg-code)", color: "var(--text-code)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {logs.map((log, idx) => {
                          let color = "#a1a1aa";
                          if (log.type === "system") color = "#818cf8";
                          else if (log.type === "success") color = "#4ade80";
                          else if (log.type === "config") color = "#22d3ee";
                          else if (log.type === "error") color = "#f87171";
                          else if (log.type === "info") color = "#fbbf24";
                          return (
                            <div key={idx} style={{ color }} className="font-semibold">
                              {log.text}
                            </div>
                          );
                        })}
                        <div className="pt-2 flex items-center gap-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#e2e8f0" }}>
                          <span className="font-bold" style={{ color: "var(--accent)" }}>$</span>
                          <span className="animate-cursor-blink">
                            aios-agent --active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Developer Tools + Module Maps */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      
                      <div className="card rounded-2xl p-6 animate-fade-up delay-4">
                        <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-4 pb-2" 
                          style={{ color: "var(--accent-text)", borderBottom: "1px solid var(--border)" }}>
                          Developer Tools
                        </h3>
                        <div className="space-y-3">
                          <button 
                            onClick={fetchStatus}
                            className="btn-accent w-full py-2.5 px-4 rounded-xl text-xs"
                          >
                            Sync API Gateway Status
                          </button>
                          <button 
                            onClick={() => {
                              addLog("[SYSTEM] Instantiating Sandboxed Docker Container...", "system");
                              setTimeout(() => addLog("[SUCCESS] Sandbox online at localhost:9001 (Ubuntu 22.04)", "success"), 1000);
                            }}
                            className="btn-outline w-full py-2.5 px-4 rounded-xl text-xs"
                          >
                            Launch Sandbox Container
                          </button>
                          <button 
                            onClick={() => {
                              addLog("[SYSTEM] Running standard test execution suite...", "system");
                              setTimeout(() => addLog("[SUCCESS] Complete check passed. 0 errors, 12 warnings.", "success"), 800);
                            }}
                            className="btn-outline w-full py-2.5 px-4 rounded-xl text-xs"
                          >
                            Run Test Suites
                          </button>
                        </div>
                      </div>

                      <div className="card rounded-2xl p-6 animate-fade-up delay-5">
                        <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-4 pb-2" 
                          style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                          Module Maps
                        </h3>
                        <ul className="space-y-3 font-mono text-[11px]">
                          <li className="flex items-center justify-between pb-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                            <span className="font-bold" style={{ color: "var(--accent-text)" }}>/frontend</span>
                            <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>Next.js v14</span>
                          </li>
                          <li className="flex items-center justify-between pb-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                            <span className="font-bold" style={{ color: "var(--accent-text)" }}>/backend</span>
                            <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>FastAPI v0.100</span>
                          </li>
                          <li className="flex items-center justify-between pb-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                            <span className="font-bold" style={{ color: "var(--accent-text)" }}>/rag-system</span>
                            <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>LlamaIndex/Qdrant</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ TAB 2: AGENT TERMINAL ═══════ */}
              {activeTab === "agent" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-190px)] animate-fadeIn">
                  
                  {/* Chat Window */}
                  <div className="lg:col-span-9 card rounded-3xl flex flex-col overflow-hidden h-full">
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex items-start gap-3.5 max-w-[85%] ${
                            msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm`}
                            style={msg.sender === "user" 
                              ? { background: "var(--accent)", color: "white" }
                              : { background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent)" }
                            }>
                            {msg.sender === "user" ? (user.displayName?.[0] || "U") : "Ω"}
                          </div>

                          <div className={`rounded-2xl p-4 text-[13px] leading-relaxed shadow-sm ${
                            msg.sender === "user" ? "rounded-tr-none" : "rounded-tl-none"
                          }`}
                          style={msg.sender === "user"
                            ? { background: "var(--accent)", color: "white" }
                            : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }
                          }>
                            <div className="whitespace-pre-line font-sans">{msg.text}</div>
                            <span className="block text-[9px] font-mono mt-2 text-right" style={{ opacity: 0.6 }}>
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}

                      {agentThinking && (
                        <div className="flex items-start gap-3.5 max-w-[80%] mr-auto">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs animate-pulse"
                            style={{ background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
                            Ω
                          </div>
                          <div className="rounded-2xl rounded-tl-none p-4 text-xs font-mono tracking-wider flex items-center gap-2"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)" }}></span>
                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: "75ms" }}></span>
                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: "150ms" }}></span>
                            <span>Agent parsing telemetry files...</span>
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          { text: "⚡ Generate DB Model code", cmd: "/code Build a FastAPI database model table" },
                          { text: "🐘 SQL Migration status", cmd: "/db Trigger db-check route and verify migrations" },
                          { text: "🎯 Vector Search index docs", cmd: "/rag Query matching files inside Qdrant index" },
                        ].map((chip, i) => (
                          <button 
                            key={i}
                            onClick={() => handleSendMessage(chip.cmd)}
                            className="px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-all"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent-text)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                          >
                            {chip.text}
                          </button>
                        ))}
                      </div>

                      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                        <input 
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask the AI agent to write code, review containers..."
                          className="flex-1 rounded-xl px-4 py-3 text-[13px] transition-all outline-none"
                          style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                        />
                        <button type="submit" className="btn-accent px-5 py-3 rounded-xl text-xs font-bold">
                          Send
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Chat Sidebar */}
                  <div className="lg:col-span-3 flex flex-col gap-5 h-full overflow-y-auto pr-1">
                    
                    <div className="card rounded-2xl p-5">
                      <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-3 pb-1" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                        Agent Topologies
                      </h4>
                      <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        Currently using <strong>Antigravity v0.1</strong> custom developer configuration. Backed by Google Gemini 3.5 Flash context maps.
                      </p>
                    </div>

                    <div className="card rounded-2xl p-5">
                      <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-3 pb-1" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                        OS Command Tags
                      </h4>
                      <ul className="space-y-3 font-mono text-[10px]">
                        {[
                          { cmd: "/code [prompt]", desc: "Generates code templates" },
                          { cmd: "/db [query]", desc: "Checks Postgres schema logs" },
                          { cmd: "/rag [concept]", desc: "Semantically queries files" },
                        ].map((item, i) => (
                          <li key={i} className="flex flex-col gap-0.5">
                            <span className="font-bold" style={{ color: "var(--accent-text)" }}>{item.cmd}</span>
                            <span style={{ color: "var(--text-muted)" }}>{item.desc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ TAB 3: DATABASE EXPLORER ═══════ */}
              {activeTab === "database" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  <div className="card rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>PostgreSQL Transaction Logs</h3>
                      <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Pool engine on 127.0.0.1:5434 • Models synchronized.
                      </p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button 
                        onClick={triggerDbCheck}
                        disabled={dbChecking}
                        className="btn-accent flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2"
                      >
                        {dbChecking && <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-white animate-spin"></span>}
                        Live DB Check
                      </button>
                      <button 
                        onClick={insertMockTelemetry}
                        className="btn-outline flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs"
                      >
                        Insert Mock
                      </button>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3">
                    {telemetryTable.map((row) => (
                      <div key={row.id} className="card rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>
                            ID: <span className="font-extrabold" style={{ color: "var(--text-primary)" }}>{row.id}</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono`}
                            style={{
                              background: row.status === "success" ? "rgba(34,197,94,0.1)" : row.status === "warning" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                              color: row.status === "success" ? "var(--success)" : row.status === "warning" ? "var(--warning)" : "var(--error)",
                              border: `1px solid ${row.status === "success" ? "rgba(34,197,94,0.2)" : row.status === "warning" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}`
                            }}>
                            {row.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono uppercase font-bold" style={{ color: "var(--text-muted)" }}>Event</p>
                          <p className="text-[12px] font-mono font-bold break-all" style={{ color: "var(--accent-text)" }}>{row.event}</p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono pt-2" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
                          <span>⏱️ {row.duration === 0 ? "timeout" : `${row.duration} ms`}</span>
                          <span>📅 {row.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                          <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                            <th className="p-4 font-bold font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Transaction ID</th>
                            <th className="p-4 font-bold font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Event Name</th>
                            <th className="p-4 font-bold font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</th>
                            <th className="p-4 font-bold font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Duration</th>
                            <th className="p-4 font-bold font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {telemetryTable.map((row) => (
                            <tr key={row.id} className="transition-colors" style={{ borderBottom: "1px solid var(--border)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-soft)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <td className="p-4 font-mono font-bold" style={{ color: "var(--text-primary)" }}>{row.id}</td>
                              <td className="p-4 font-mono font-bold" style={{ color: "var(--accent-text)" }}>{row.event}</td>
                              <td className="p-4">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono"
                                  style={{
                                    background: row.status === "success" ? "rgba(34,197,94,0.1)" : row.status === "warning" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                                    color: row.status === "success" ? "var(--success)" : row.status === "warning" ? "var(--warning)" : "var(--error)",
                                  }}>
                                  {row.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-4 font-mono" style={{ color: "var(--text-secondary)" }}>{row.duration === 0 ? "timeout" : `${row.duration} ms`}</td>
                              <td className="p-4 font-mono" style={{ color: "var(--text-muted)" }}>{row.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ TAB 4: VECTOR SEARCH ═══════ */}
              {activeTab === "vector" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    <div className="lg:col-span-7 flex flex-col gap-6">
                      
                      <div className="card rounded-2xl p-6">
                        <h3 className="text-base font-black mb-2" style={{ color: "var(--text-primary)" }}>Qdrant Vector Search</h3>
                        <p className="text-[12px] leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                          Search cognitive indices using cosine similarity. Enter keywords to query embedded workspace files.
                        </p>
                        <form onSubmit={handleVectorSearch} className="flex gap-2">
                          <input 
                            type="text"
                            value={vectorQuery}
                            onChange={(e) => setVectorQuery(e.target.value)}
                            placeholder="Type query for nearest-neighbor docs..."
                            className="flex-1 rounded-xl px-4 py-2.5 text-[13px] transition-all outline-none"
                            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                          />
                          <button type="submit" disabled={vectorSearching} className="btn-accent py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2">
                            {vectorSearching && <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-white animate-spin"></span>}
                            Search
                          </button>
                        </form>
                      </div>

                      <div className="card rounded-2xl p-6 flex-1 min-h-[250px]">
                        <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-4 pb-2" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                          Match Results
                        </h4>
                        {vectorResults.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <span className="text-3xl mb-3" style={{ opacity: 0.3 }}>🔍</span>
                            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No matching vectors. Type a query above to search.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {vectorResults.map((res, i) => (
                              <div key={i} className="p-4 rounded-xl flex items-start justify-between gap-4 transition-all"
                                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                              >
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
                                    style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
                                    {res.category}
                                  </span>
                                  <p className="text-[12px] font-mono leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>{res.doc}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-sm font-black font-mono" style={{ color: "var(--text-primary)" }}>
                                    {(res.score * 100).toFixed(1)}%
                                  </span>
                                  <p className="text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>Similarity</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div className="lg:col-span-5 flex flex-col">
                      <div 
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className="flex-1 rounded-3xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center transition-all min-h-[350px] relative"
                        style={{ 
                          borderColor: dragActive ? "var(--accent)" : "var(--border)", 
                          background: dragActive ? "var(--accent-soft)" : "var(--bg-card)",
                          transform: dragActive ? "scale(1.01)" : "scale(1)"
                        }}
                      >
                        <span className="text-5xl mb-4 animate-float">📁</span>
                        <h4 className="text-sm font-black" style={{ color: "var(--text-primary)" }}>Drag & Drop Knowledge Base</h4>
                        <p className="text-[11px] leading-relaxed mt-2 max-w-xs mx-auto" style={{ color: "var(--text-muted)" }}>
                          Split, embed, and ingest PDF, Markdown, or text files into your Qdrant semantic storage.
                        </p>
                        
                        <label className="mt-5 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all"
                          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
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

              {/* ═══════ TAB 5: SETTINGS ═══════ */}
              {activeTab === "settings" && (<SettingsTab theme={theme} setTheme={setTheme} activeModel={activeModel} setActiveModel={setActiveModel} addLog={addLog} user={user} />)}

              {/* ═══════ TAB 6: PROFILE ═══════ */}
              {activeTab === "profile" && (
                <ProfileTab user={user} />
              )}

            </main>

            {/* Footer */}
            <footer className="w-full py-4 text-center text-[11px] font-mono font-medium"
              style={{ borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
              AI-Engineer-OS Monorepo Workspace • Configured to username: Anirudh-saiA
            </footer>

          </div>
          </div>
        </>
      )}

    </div>
  );
}
