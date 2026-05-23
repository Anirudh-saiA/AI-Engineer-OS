"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  const [logs, setLogs] = useState<Array<{ text: string; type: "system" | "success" | "config" | "info" | "error" }>>([
    { text: "[SYSTEM] Initializing AI-Engineer-OS developer stack...", type: "system" },
    { text: "[SUCCESS] Git repository initialized locally. Active: user.name=\"Anirudh-saiA\"", type: "success" },
    { text: "[SUCCESS] Generated 9-tier core monorepo folder layouts.", type: "success" },
    { text: "[SUCCESS] Bootstrapped Next.js Frontend Framework.", type: "success" },
    { text: "[CONFIG] Tailwind CSS v4 and TypeScript configured in /frontend.", type: "config" },
  ]);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [fastapiOnline, setFastapiOnline] = useState<boolean | null>(null);

  const addLog = (text: string, type: "system" | "success" | "config" | "info" | "error") => {
    setLogs((prev) => [...prev, { text, type }]);
  };

  const fetchStatus = async () => {
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

  useEffect(() => {
    fetchStatus();
  }, []);

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
            <span className={fastapiOnline ? "text-cyan-400 font-semibold" : "text-rose-400 font-semibold"}>
              {fastapiOnline ? "4 / 4 Healthy" : "3 / 4 Healthy"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* LEFT COLUMN (8 Cols): System Console & Folder Directory */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Welcome Info Card */}
          <section className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase">
              Phase 1 — Day 2
            </span>
            <h2 className="text-2xl font-bold mt-4 tracking-tight text-white">
              Welcome to your Autonomous Agent Workspace
            </h2>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-2xl">
              AI-Engineer-OS has bootstrapped successfully. The monorepo has been mapped, git configurations are locked to <code className="text-violet-300 font-mono">Anirudh-saiA</code>, and Next.js is connected dynamically with our FastAPI core backend services.
            </p>
          </section>

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
              {fastapiOnline === null && (
                <div className="text-gray-500 animate-pulse">[WAITING] Querying REST API gateway status...</div>
              )}
              <div className="pt-2 border-t border-white/5 flex items-center gap-1 text-white">
                <span className="text-violet-500 font-bold">$</span>
                <span className="border-r-2 border-white animate-pulse pr-1">aios-agent --active</span>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (4 Cols): Monorepo Layout & Service Check */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
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
                  fastapiOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {fastapiOnline ? "Online" : "Offline"}
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
                    <p className="text-[10px] text-gray-500 font-mono">Port 5432</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Online
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
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Online
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
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Online
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
                className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-violet-600/10 glow-btn border border-violet-500/20 cursor-pointer"
              >
                Refresh API Gateway Status
              </button>
              <button className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/5 text-gray-200 font-semibold text-xs tracking-wide transition-all border border-white/5 hover:border-white/10 cursor-pointer glow-btn">
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
