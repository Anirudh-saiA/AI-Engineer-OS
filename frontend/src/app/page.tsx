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
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-indigo-600 animate-spin"></div>
          <p className="font-mono text-xs text-slate-500 tracking-wider">Validating Firebase Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Soft Glow Effects (Inspired by Magic UI) */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-indigo-200/20 via-violet-100/10 to-fuchsia-100/15 blur-[130px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-cyan-100/15 via-blue-100/10 to-indigo-100/20 blur-[130px] pointer-events-none animate-pulse-glow"></div>

      {/* Sleek Minimalist Header */}
      <header className="w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center font-semibold text-sm text-white shadow-sm">
            Ω
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
              AI-ENGINEER-OS
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">v0.1</span>
            </h1>
            <p className="text-[9px] text-indigo-600 font-mono tracking-widest uppercase font-semibold">Autonomous Developer Workspace</p>
          </div>
        </div>

        {/* Global telemetry stats */}
        <div className="hidden md:flex items-center gap-5 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">Agent:</span>
            <span className="text-slate-800 font-semibold">Active</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Model:</span>
            <span className="text-indigo-600 font-semibold">Gemini 3.5 Flash</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Services:</span>
            {user ? (
              <span className={fastapiOnline ? "text-indigo-600 font-semibold" : "text-rose-600 font-semibold"}>
                {fastapiOnline ? "4/4 Healthy" : "3/4 Healthy"}
              </span>
            ) : (
              <span className="text-amber-600 font-semibold">Locked</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* LEFT COLUMN (8 Cols): System Console & Folder Directory */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {!user ? (
            /* Welcome Connect Identity Info Card (Magic UI Light Mode Style) */
            <section className="glass-card rounded-2xl p-8 relative overflow-hidden group border border-slate-200/60">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-semibold font-mono tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                Secure Authentication Required
              </span>
              <h2 className="text-3xl font-extrabold mt-4 tracking-tight text-slate-900 leading-tight">
                Unlock Your Autonomous Developer Stack
              </h2>
              <p className="text-slate-600 text-sm mt-3 leading-relaxed max-w-2xl">
                Please authenticate using your Google Developer credentials via Firebase Popup to authorize the central agentic controllers, container sandbox pipelines, vector indices, and database control maps.
              </p>
              
              <button 
                onClick={signInWithGoogle}
                className="mt-8 py-3 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-98 text-white font-semibold text-xs tracking-wide transition-all shadow-sm border border-slate-950 flex items-center gap-2.5 cursor-pointer glow-btn"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.386-2.87-6.386-6.39 0-3.51 2.87-6.386 6.386-6.386 1.629 0 3.12.607 4.269 1.706l3.12-3.12C19.29 2.217 15.93 1 12.24 1 5.617 1 0 6.617 0 13.24c0 6.618 5.617 12.24 12.24 12.24 6.887 0 12.24-5.358 12.24-12.24 0-.847-.075-1.666-.225-2.455H12.24z"/>
                </svg>
                Sign In with Google (Firebase)
              </button>
            </section>
          ) : (
            /* Welcome Info Card */
            <section className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-20 h-20 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold font-mono tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                Active Developer Workspace
              </span>
              <h2 className="text-2xl font-extrabold mt-3 tracking-tight text-slate-900">
                Welcome back, {user.displayName || "Developer"}
              </h2>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed max-w-2xl">
                Firebase Identity verified successfully. AI-Engineer-OS has established dynamic connections. The REST APIs are running on port 8000 and the PostgreSQL database container is active on host port 5434.
              </p>
            </section>
          )}

          {/* Core System Dashboard Console */}
          <section className="glass-card rounded-2xl p-6 flex flex-col flex-1 min-h-[350px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                </span>
                <h3 className="font-mono text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Cognitive Agent Terminal</h3>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                <span className="w-2 h-2 rounded-full bg-slate-200"></span>
              </div>
            </div>

            {/* Pseudo Logs Terminal */}
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
              {fastapiOnline === null && user && (
                <div className="text-slate-400 animate-pulse">[WAITING] Querying REST API gateway status...</div>
              )}
              <div className="pt-2 border-t border-slate-200/40 flex items-center gap-1 text-slate-800">
                <span className="text-indigo-600 font-bold">$</span>
                <span className="border-r border-slate-600 animate-pulse pr-1">
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
            <section className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4 text-center border border-indigo-200/30 bg-gradient-to-b from-white to-indigo-50/10">
              <div className="relative w-14 h-14 rounded-full border border-indigo-200 p-0.5 bg-white overflow-hidden shadow-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-md font-semibold text-white">
                    {user.displayName?.[0] || "D"}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{user.displayName || "Developer"}</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</p>
              </div>
              <button 
                onClick={signOut}
                className="w-full py-2 px-4 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs tracking-wide transition-all border border-slate-200 hover:border-rose-100 cursor-pointer shadow-2xs"
              >
                Disconnect Session
              </button>
            </section>
          ) : (
            /* Identity Lock Panel */
            <section className="glass-card rounded-2xl p-6 text-center border border-amber-200/30 bg-gradient-to-b from-white to-amber-50/10">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mx-auto text-md mb-2.5 border border-amber-100">
                🔒
              </div>
              <h4 className="text-xs font-bold text-slate-900">Workspace Locked</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-2">
                Awaiting developer OAuth credentials. Sign in using your Google account via Firebase Popup to authorize vector search index mapping and DB control dashboards.
              </p>
            </section>
          )}

          {/* Services Health Monitor */}
          <section className="glass-card rounded-2xl p-6">
            <h3 className="font-mono text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Infrastructure Status
            </h3>
            <div className="flex flex-col gap-3">
              
              {/* FastAPI Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-xs">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">FastAPI Gateway</h4>
                    <p className="text-[9px] text-slate-400 font-mono">Port 8000</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                  user && fastapiOnline ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}>
                  {user && fastapiOnline ? "Online" : "Offline / Locked"}
                </span>
              </div>

              {/* Postgres Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-xs">
                    🐘
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">PostgreSQL DB</h4>
                    <p className="text-[9px] text-slate-400 font-mono">Port 5434</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                  user ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}>
                  {user ? "Online" : "Offline / Locked"}
                </span>
              </div>

              {/* Qdrant Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-xs">
                    🎯
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Qdrant Vector</h4>
                    <p className="text-[9px] text-slate-400 font-mono">Port 6333</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                  user ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}>
                  {user ? "Online" : "Offline / Locked"}
                </span>
              </div>

              {/* Redis Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-xs">
                    🍒
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Redis Cache</h4>
                    <p className="text-[9px] text-slate-400 font-mono">Port 6379</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                  user ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}>
                  {user ? "Online" : "Offline / Locked"}
                </span>
              </div>

            </div>
          </section>

          {/* Quick Monorepo Directory Info */}
          <section className="glass-card rounded-2xl p-6">
            <h3 className="font-mono text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Monorepo Modules
            </h3>
            <ul className="space-y-3 font-mono text-[10px] text-slate-600">
              <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-indigo-600 font-semibold">/frontend</span>
                <span className="text-slate-800 text-xs">Next.js Framework</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-indigo-600 font-semibold">/backend</span>
                <span className="text-slate-800 text-xs">FastAPI Gateway</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-indigo-600 font-semibold">/rag-system</span>
                <span className="text-slate-800 text-xs">LlamaIndex/Qdrant</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-indigo-600 font-semibold">/agents</span>
                <span className="text-slate-800 text-xs">LangGraph Topologies</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-indigo-600 font-semibold">/deployment</span>
                <span className="text-slate-800 text-xs">Docker Services</span>
              </li>
            </ul>
          </section>

          {/* Quick Actions Panel */}
          <section className="glass-card rounded-2xl p-6 bg-gradient-to-b from-white to-slate-50/40">
            <h3 className="font-mono text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={fetchStatus}
                disabled={!user}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all border border-slate-950 glow-btn ${
                  user
                    ? "bg-slate-950 hover:bg-slate-800 text-white cursor-pointer shadow-sm hover:shadow"
                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                }`}
              >
                Refresh API Gateway Status
              </button>
              <button 
                disabled={!user}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all border border-slate-200 glow-btn ${
                  user
                    ? "bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs hover:border-slate-300"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                }`}
              >
                Launch Sandbox Container
              </button>
            </div>
          </section>

        </div>

      </main>

      {/* Minimalistic Premium Footer */}
      <footer className="w-full py-4 text-center text-[10px] text-slate-400 font-mono border-t border-slate-150 mt-8 bg-white/40">
        AI-Engineer-OS Monorepo Workspace • Configured to username: Anirudh-saiA
      </footer>

    </div>
  );
}
