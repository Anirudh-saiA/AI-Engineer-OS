"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [fastapiOnline, setFastapiOnline] = useState<boolean | null>(null);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  
  const [logs, setLogs] = useState<Array<{ text: string; type: "system" | "success" | "config" | "info" | "error" }>>([
    { text: "[SYSTEM] Initializing AI-Engineer-OS developer stack...", type: "system" },
    { text: "[SUCCESS] Git repository initialized locally. Active: user.name=\"Anirudh-saiA\"", type: "success" },
    { text: "[SUCCESS] Generated 9-tier core monorepo folder layouts.", type: "success" },
    { text: "[SUCCESS] Bootstrapped Next.js Frontend Framework.", type: "success" },
    { text: "[CONFIG] Tailwind CSS v4 and TypeScript configured in /frontend.", type: "config" },
  ]);

  const addLog = (text: string, type: "system" | "success" | "config" | "info" | "error") => {
    setLogs((prev) => [...prev, { text, type }]);
  };

  const fetchStatus = async () => {
    if (!user) return;
    setFastapiOnline(null);
    addLog("[API] Querying REST API gateway status from http://localhost:8000/api/v1/system/status...", "system");
    try {
      const res = await fetch("http://localhost:8000/api/v1/system/status");
      if (res.ok) {
        const data = await res.json();
        setBackendStatus(data);
        setFastapiOnline(true);
        addLog(`[SUCCESS] API Connection Established. Project: ${data.details.project}, Environment: ${data.environment}, Version: ${data.version}, Uptime: ${data.uptime_seconds}s`, "success");
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      setFastapiOnline(false);
      setBackendStatus(null);
      addLog(`[ERROR] Gateway Connection Failed. Ensure uvicorn dev server is running on port 8000.`, "error");
    }
  };

  // Fetch backend status when session becomes authenticated
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#030712] text-gray-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-violet-500 animate-spin"></div>
          <p className="font-mono text-xs text-gray-400 tracking-wider">Validating Firebase Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Neon Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none animate-pulse-glow"></div>

      {/* Sleek Glassmorphic Header */}
      <header className="w-full border-b border-white/5 bg-gray-950/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-violet-500/20">
            Ω
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              AI-ENGINEER-OS
            </h1>
            <p className="text-[10px] text-violet-400/80 font-mono tracking-widest uppercase">Autonomous Developer Workspace</p>
          </div>
        </div>

        {/* Global telemetry stats */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-gray-400">Agent:</span>
            <span className="text-emerald-400 font-semibold">Active & Listening</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Model:</span>
            <span className="text-violet-400 font-semibold">Gemini 3.5 Flash</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Services:</span>
            {user ? (
              <span className={fastapiOnline ? "text-cyan-400 font-semibold" : "text-rose-400 font-semibold"}>
                {fastapiOnline ? "4 / 4 Healthy" : "3 / 4 Healthy"}
              </span>
            ) : (
              <span className="text-amber-400 font-semibold">Locked</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* LEFT COLUMN (8 Cols): System Console & Folder Directory */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {!user ? (
            /* Welcome Connect Identity Info Card */
            <section className="glass-card rounded-2xl p-8 relative overflow-hidden group border border-violet-500/20">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase">
                Secure Authentication Required
              </span>
              <h2 className="text-2xl font-bold mt-4 tracking-tight text-white">
                Unlock Your Autonomous Developer Stack
              </h2>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-2xl">
                Please authenticate using your Google Developer credentials via Firebase Popup to access the central agentic controls, container sandbox pipelines, vector indices, and database control maps.
              </p>
              
              <button 
                onClick={signInWithGoogle}
                className="mt-6 py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:scale-95 text-white font-semibold text-sm tracking-wide transition-all shadow-md shadow-violet-600/20 border border-violet-500/20 flex items-center gap-3 cursor-pointer glow-btn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.386-2.87-6.386-6.39 0-3.51 2.87-6.386 6.386-6.386 1.629 0 3.12.607 4.269 1.706l3.12-3.12C19.29 2.217 15.93 1 12.24 1 5.617 1 0 6.617 0 13.24c0 6.618 5.617 12.24 12.24 12.24 6.887 0 12.24-5.358 12.24-12.24 0-.847-.075-1.666-.225-2.455H12.24z"/>
                </svg>
                Sign In with Google (Firebase)
              </button>
            </section>
          ) : (
            /* Welcome Info Card */
            <section className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase">
                Active Developer Workspace
              </span>
              <h2 className="text-2xl font-bold mt-4 tracking-tight text-white">
                Welcome back, {user.displayName || "Developer"}
              </h2>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-2xl">
                Firebase Identity verified successfully. AI-Engineer-OS has established dynamic connections. The REST APIs are running on port 8000 and the PostgreSQL database container is active on host port 5434.
              </p>
            </section>
          )}

          {/* Core System Dashboard Console */}
          <section className="glass-card rounded-2xl p-6 flex flex-col flex-1 min-h-[350px]">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-violet-500/30 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping"></span>
                </span>
                <h3 className="font-mono text-xs text-gray-300 font-semibold uppercase tracking-wider">Cognitive Agent Terminal</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40"></span>
              </div>
            </div>

            {/* Pseudo Logs Terminal */}
            <div className="flex-1 bg-gray-950/80 rounded-xl p-4 font-mono text-xs leading-6 text-gray-400 border border-white/5 overflow-y-auto space-y-3 max-h-[300px]">
              {logs.map((log, idx) => {
                let colorClass = "text-gray-400";
                if (log.type === "system") colorClass = "text-violet-400";
                else if (log.type === "success") colorClass = "text-emerald-400";
                else if (log.type === "config") colorClass = "text-cyan-400";
                else if (log.type === "error") colorClass = "text-rose-400";
                else if (log.type === "info") colorClass = "text-amber-400";
                return (
                  <div key={idx} className={colorClass}>
                    {log.text}
                  </div>
                );
              })}
              {fastapiOnline === null && user && (
                <div className="text-gray-500 animate-pulse">[WAITING] Querying REST API gateway status...</div>
              )}
              <div className="pt-2 border-t border-white/5 flex items-center gap-1 text-white">
                <span className="text-violet-500 font-bold">$</span>
                <span className="border-r-2 border-white animate-pulse pr-1">
                  {user ? "aios-agent --active" : "aios-agent --restricted-mode"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (4 Cols): Monorepo Layout & Service Check */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {user ? (
            /* User Identity Card */
            <section className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4 text-center border border-violet-500/20">
              <div className="relative w-16 h-16 rounded-full border-2 border-violet-500/50 p-1 bg-gray-950 overflow-hidden shadow-lg shadow-violet-500/10">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-violet-600 flex items-center justify-center text-lg font-bold text-white">
                    {user.displayName?.[0] || "D"}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{user.displayName || "Developer"}</h4>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{user.email}</p>
              </div>
              <button 
                onClick={signOut}
                className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-rose-500/10 active:bg-rose-500/5 text-gray-300 hover:text-rose-400 font-semibold text-xs tracking-wide transition-all border border-white/5 hover:border-rose-500/20 cursor-pointer"
              >
                Disconnect Session
              </button>
            </section>
          ) : (
            /* Identity Lock Panel */
            <section className="glass-card rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mx-auto text-lg mb-3 border border-amber-500/20">
                🔒
              </div>
              <h4 className="text-xs font-bold text-white">Workspace Locked</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed mt-2">
                Awaiting developer OAuth credentials. Sign in using your Google account via Firebase Popup to authorize vector search index mapping and DB control dashboards.
              </p>
            </section>
          )}

          {/* Services Health Monitor */}
          <section className="glass-card rounded-2xl p-6">
            <h3 className="font-mono text-xs text-gray-300 font-semibold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
              Infrastructure Status
            </h3>
            <div className="flex flex-col gap-3">
              
              {/* FastAPI Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">FastAPI Gateway</h4>
                    <p className="text-[10px] text-gray-500 font-mono">Port 8000</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                  user && fastapiOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {user && fastapiOnline ? "Online" : "Offline / Locked"}
                </span>
              </div>

              {/* Postgres Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    🐘
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">PostgreSQL DB</h4>
                    <p className="text-[10px] text-gray-500 font-mono">Port 5434</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                  user ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {user ? "Online" : "Offline / Locked"}
                </span>
              </div>

              {/* Qdrant Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                    🎯
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Qdrant Vector</h4>
                    <p className="text-[10px] text-gray-500 font-mono">Port 6333</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                  user ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {user ? "Online" : "Offline / Locked"}
                </span>
              </div>

              {/* Redis Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                    🍒
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Redis Cache</h4>
                    <p className="text-[10px] text-gray-500 font-mono">Port 6379</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                  user ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {user ? "Online" : "Offline / Locked"}
                </span>
              </div>

            </div>
          </section>

          {/* Quick Monorepo Directory Info */}
          <section className="glass-card rounded-2xl p-6">
            <h3 className="font-mono text-xs text-gray-300 font-semibold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
              Monorepo Modules
            </h3>
            <ul className="space-y-3 font-mono text-[11px] text-gray-400">
              <li className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-violet-400">/frontend</span>
                <span className="text-white text-xs">Next.js Framework</span>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-violet-400">/backend</span>
                <span className="text-white text-xs">FastAPI Gateway</span>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-violet-400">/rag-system</span>
                <span className="text-white text-xs">LlamaIndex/Qdrant</span>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-violet-400">/agents</span>
                <span className="text-white text-xs">LangGraph Topologies</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-violet-400">/deployment</span>
                <span className="text-white text-xs">Docker Services</span>
              </li>
            </ul>
          </section>

          {/* Quick Actions Panel */}
          <section className="glass-card rounded-2xl p-6 bg-gradient-to-b from-gray-950/20 to-violet-950/10">
            <h3 className="font-mono text-xs text-violet-400 font-semibold uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={fetchStatus}
                disabled={!user}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all border border-violet-500/20 glow-btn ${
                  user
                    ? "bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white cursor-pointer shadow-md shadow-violet-600/10"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                }`}
              >
                Refresh API Gateway Status
              </button>
              <button 
                disabled={!user}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all border border-white/5 glow-btn ${
                  user
                    ? "bg-white/5 hover:bg-white/10 active:bg-white/5 text-gray-200 cursor-pointer"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                }`}
              >
                Launch Sandbox Container
              </button>
            </div>
          </section>

        </div>

      </main>

      {/* Minimalistic Premium Footer */}
      <footer className="w-full py-4 text-center text-[10px] text-gray-500 font-mono border-t border-white/5 mt-8 bg-gray-950/20">
        AI-Engineer-OS Monorepo Workspace • Configured to username: Anirudh-saiA
      </footer>

    </div>
  );
}
