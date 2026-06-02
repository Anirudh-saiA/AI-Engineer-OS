"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

interface DebuggerTabProps {
  user: any;
  parseMarkdownToReact: (text: string) => React.ReactNode;
  addLog: (text: string, type: "system" | "success" | "config" | "info" | "error") => void;
}

interface Frame {
  file: string;
  line: number;
  function?: string;
}

interface AnalysisResult {
  id?: number;
  error_type: string;
  file?: string | null;
  line?: number | null;
  message: string;
  categories: string[];
  explanation: string;
  root_cause: string;
  suggested_fixes: string[];
  best_practices: string[];
  learning_notes: string;
  severity: string;
  ai_enhanced: boolean;
  created_at?: string;
  frames?: Frame[];
}

const ERROR_EXAMPLES = [
  {
    name: "Python ZeroDivisionError (Traceback)",
    text: `Traceback (most recent call last):
  File "c:\\Users\\aniru\\OneDrive\\Desktop\\AIOS\\backend\\app\\services\\analytics.py", line 42, in calculate_average_hours
    return total_hours / total_projects
ZeroDivisionError: division by zero`
  },
  {
    name: "Python ModuleNotFoundError (fitz/PyMuPDF)",
    text: `Traceback (most recent call last):
  File "main.py", line 12, in <module>
    import fitz
ModuleNotFoundError: No module named 'fitz'`
  },
  {
    name: "Node.js 'Module not found' (React)",
    text: `Error: Cannot find module 'react-dom/client'
Require stack:
- /Users/developer/project/src/index.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1144:15)
    at Module._load (node:internal/modules/cjs/loader:985:27)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:135:5)`
  },
  {
    name: "npm Peer Dependency Conflict (ERESOLVE)",
    text: `npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve peer dependency
npm ERR! 
npm ERR! While resolving: @typescript-eslint/eslint-plugin@6.21.0
npm ERR! Found: eslint@9.4.0
npm ERR! node_modules/eslint
npm ERR!   eslint@"^9.0.0" from the root project
npm ERR! 
npm ERR! Could not resolve dependency:
npm ERR! peer eslint@"^8.57.0" from @typescript-eslint/eslint-plugin@6.21.0`
  },
  {
    name: "HTTP 401 Unauthorized API Response",
    text: `{
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid authentication token. Token has expired.",
  "timestamp": "2026-06-02T18:01:14Z"
}`
  }
];

export default function DebuggerTab({ user, parseMarkdownToReact, addLog }: DebuggerTabProps) {
  const [errorInput, setErrorInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const [selectedExample, setSelectedExample] = useState("");

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/history`, {
        headers: {
          Authorization: `Bearer ${user.uid}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to load debugging history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleExampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedExample(val);
    if (val) {
      const example = ERROR_EXAMPLES.find((ex) => ex.name === val);
      if (example) {
        setErrorInput(example.text);
      }
    }
  };

  const handleAnalyze = async (mode: "analyze" | "classify" | "dependency" | "api" = "analyze") => {
    if (!errorInput.trim()) {
      addLog("Please enter some error text or logs to analyze.", "error");
      return;
    }

    setAnalyzing(true);
    setResult(null);
    addLog(`Initiating intelligent ${mode === "analyze" ? "AI analysis" : mode} parsing...`, "system");

    try {
      let endpoint = `${API_BASE_URL}/api/v1/debugger/analyze-error`;
      let body: any = { error_text: errorInput };

      if (mode === "classify") {
        endpoint = `${API_BASE_URL}/api/v1/debugger/classify-error`;
      } else if (mode === "dependency") {
        endpoint = `${API_BASE_URL}/api/v1/debugger/dependency-check`;
        body = { dependency_text: errorInput };
      } else if (mode === "api") {
        endpoint = `${API_BASE_URL}/api/v1/debugger/api-error-analysis`;
        // Check if input looks like status code
        const statusMatch = errorInput.match(/\b\d{3}\b/);
        body = {
          status_code: statusMatch ? statusMatch[0] : "500",
          error_details: errorInput
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.uid}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Handle direct classifications/dependencies response shapes to unify
        if (mode === "classify") {
          const unifiedResult: AnalysisResult = {
            error_type: data.error_type || "UnknownError",
            file: data.file,
            line: data.line,
            message: data.message || "Classification only",
            categories: data.categories || [],
            severity: data.severity || "medium",
            explanation: `Lightweight structural scan completed. No deep AI mentorship was invoked. Detected main error type: **${data.error_type}** in **${data.file || "unknown location"}**.`,
            root_cause: `Type: ${data.error_type}. Message: ${data.message}`,
            suggested_fixes: ["Run the 'Analyze Error' option for complete AI-powered fixes and deep conceptual explanations."],
            best_practices: ["Check your IDE lint warnings", "Trace back imports"],
            learning_notes: "To trigger interactive tutor mentoring and earn +10 XP, submit this traceback via the full AI 'Analyze Error' pipeline.",
            ai_enhanced: false,
            frames: data.frames || []
          };
          setResult(unifiedResult);
          addLog("Structural parsing completed successfully.", "success");
        } else {
          setResult(data);
          addLog(
            data.ai_enhanced 
              ? "AI-Powered Mentor analysis retrieved successfully! +10 XP awarded! 🏆" 
              : "Rule-based analysis engine generated diagnostics successfully.", 
            "success"
          );
          // Refresh history list if it was a saved endpoint
          if (mode === "analyze") {
            fetchHistory();
          }
        }
      } else {
        const errData = await res.json().catch(() => ({ detail: "Unknown server error" }));
        addLog(`Analysis failed: ${errData.detail || "Server error"}`, "error");
      }
    } catch (err) {
      console.error(err);
      addLog("Failed to reach the AIOS debugger gateway.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteHistory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this analysis session?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/history/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.uid}`,
        },
      });

      if (res.ok) {
        addLog("Analysis record deleted.", "info");
        if (activeHistoryId === id) {
          setResult(null);
          setActiveHistoryId(null);
        }
        fetchHistory();
      } else {
        addLog("Failed to delete record.", "error");
      }
    } catch (err) {
      console.error(err);
      addLog("Network error deleting record.", "error");
    }
  };

  const loadHistoryItem = (item: AnalysisResult) => {
    setResult(item);
    setErrorInput(item.message || "Saved traceback log");
    setActiveHistoryId(item.id || null);
    setSelectedExample("");
    addLog(`Loaded stored session #${item.id} (${item.error_type})`, "info");
  };

  const getSeverityColor = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case "critical":
        return { bg: "rgba(239, 68, 68, 0.15)", text: "rgb(239, 68, 68)", border: "rgba(239, 68, 68, 0.3)" };
      case "high":
        return { bg: "rgba(249, 115, 22, 0.15)", text: "rgb(249, 115, 22)", border: "rgba(249, 115, 22, 0.3)" };
      case "medium":
        return { bg: "rgba(234, 179, 8, 0.15)", text: "rgb(234, 179, 8)", border: "rgba(234, 179, 8, 0.3)" };
      default:
        return { bg: "rgba(34, 197, 94, 0.15)", text: "rgb(34, 197, 94)", border: "rgba(34, 197, 94, 0.3)" };
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    addLog(`Copied solution step #${index + 1} to clipboard!`, "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Welcome & Overview Header */}
      <div className="glass-card rounded-2xl p-6 border border-[var(--border)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[rgba(99,102,241,0.05)] to-transparent">
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <span>🕵️‍♂️</span> AI Debugger & Diagnostic Engine
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Resolve exceptions, parse complex stack traces, check peer dependencies, and level up with +10 XP.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border)] font-mono text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"></span>
          Diagnostic Core: ONLINE
        </div>
      </div>

      {/* Main Debugger Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Editor & Submission (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
            
            {/* Template Selection Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                Load Debugging Template
              </label>
              <select
                value={selectedExample}
                onChange={handleExampleChange}
                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[var(--accent)] w-full sm:w-72"
              >
                <option value="">-- Choose pre-coded error example --</option>
                {ERROR_EXAMPLES.map((ex, i) => (
                  <option key={i} value={ex.name}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Main monorepo exception input */}
            <div className="relative">
              <textarea
                value={errorInput}
                onChange={(e) => {
                  setErrorInput(e.target.value);
                  setSelectedExample("");
                }}
                placeholder="Paste your python stack trace, npm ERESOLVE error, HTTP response details, or compiler logs here..."
                className="w-full h-80 bg-[rgba(15,23,42,0.6)] border border-[var(--border)] rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-y shadow-inner"
              />
              {errorInput && (
                <button
                  onClick={() => {
                    setErrorInput("");
                    setSelectedExample("");
                  }}
                  className="absolute top-3 right-3 text-slate-500 hover:text-slate-200 text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer hover:border-slate-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Diagnostic Callouts */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleAnalyze("analyze")}
                disabled={analyzing}
                className="btn-accent flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[rgba(99,102,241,0.2)]"
              >
                {analyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <span>🧠</span> Analyze Error (+10 XP)
                  </>
                )}
              </button>

              <button
                onClick={() => handleAnalyze("classify")}
                disabled={analyzing}
                className="btn-outline py-3 px-4 rounded-xl text-xs font-bold flex-1 sm:flex-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🔍</span> Structural Classify
              </button>

              <button
                onClick={() => handleAnalyze("dependency")}
                disabled={analyzing}
                className="btn-outline py-3 px-4 rounded-xl text-xs font-bold flex-1 sm:flex-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>📦</span> Dependencies
              </button>

              <button
                onClick={() => handleAnalyze("api")}
                disabled={analyzing}
                className="btn-outline py-3 px-4 rounded-xl text-xs font-bold flex-1 sm:flex-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🌐</span> API Status Code
              </button>
            </div>
          </div>

          {/* Interactive Stack Trace Frame Visualizer */}
          {result?.frames && result.frames.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Parsed Execution Call-Stack Frames
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {result.frames.map((frame, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[11px] font-mono gap-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-[var(--accent-text)] break-all">{frame.file}</p>
                      {frame.function && (
                        <p className="text-slate-400">
                          in function <span className="text-indigo-400 font-extrabold">{frame.function}</span>
                        </p>
                      )}
                    </div>
                    <span className="bg-[rgba(99,102,241,0.15)] text-[var(--accent)] border border-[rgba(99,102,241,0.3)] px-2.5 py-1 rounded-lg font-extrabold text-[10px] sm:self-center">
                      Line {frame.line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Analysis Result Dashboard & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Analysis View Card */}
          {result ? (
            <div className="space-y-6 animate-scale-in">
              {/* Header card with metadata chips */}
              <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Primary Exception
                    </span>
                    <h3 className="text-base font-black text-rose-400 font-mono tracking-tight break-all">
                      {result.error_type}
                    </h3>
                  </div>

                  {/* Severity indicator badge */}
                  {(() => {
                    const colors = getSeverityColor(result.severity);
                    return (
                      <span
                        className="px-3 py-1 rounded-full text-[9px] font-mono font-black border tracking-wider"
                        style={{
                          background: colors.bg,
                          color: colors.text,
                          borderColor: colors.border
                        }}
                      >
                        {result.severity?.toUpperCase()}
                      </span>
                    );
                  })()}
                </div>

                {/* Categories Row */}
                {result.categories && result.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {result.categories.map((cat, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-[var(--bg-secondary)] border border-[var(--border)] text-slate-300"
                      >
                        🏷️ {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Location code-chip */}
                {result.file && (
                  <div className="p-3 rounded-xl bg-[rgba(15,23,42,0.4)] border border-[var(--border)] text-[11px] font-mono flex items-center justify-between gap-3 overflow-hidden">
                    <span className="text-slate-400 truncate pr-2">
                      📍 <span className="font-bold text-slate-300">{result.file.split(/[\\/]/).pop()}</span>
                    </span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 text-[10px] shrink-0">
                      Line {result.line}
                    </span>
                  </div>
                )}

                {/* Message display */}
                <p className="text-[12px] font-mono leading-relaxed bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border)] text-slate-200">
                  {result.message}
                </p>
              </div>

              {/* Explanations & Root Cause Card */}
              <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-[var(--border)] pb-2 flex items-center justify-between">
                  <span>🧐 Mentorship Diagnostics</span>
                  {result.ai_enhanced && (
                    <span className="text-[9px] bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-violet-400">
                      ✨ AI-Enhanced
                    </span>
                  )}
                </h4>

                <div className="space-y-4">
                  {/* Explanation card */}
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-mono font-bold uppercase tracking-wide text-indigo-300">
                      Conceptual Explanation
                    </h5>
                    <div className="text-[13px] leading-relaxed text-slate-200 font-medium">
                      {parseMarkdownToReact(result.explanation || result.message)}
                    </div>
                  </div>

                  {/* Root cause card */}
                  {result.root_cause && (
                    <div className="space-y-1 pt-2 border-t border-[var(--border)]">
                      <h5 className="text-[11px] font-mono font-bold uppercase tracking-wide text-rose-300">
                        Root Cause
                      </h5>
                      <div className="text-[13px] leading-relaxed text-slate-200 font-medium">
                        {parseMarkdownToReact(result.root_cause)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step-by-Step Suggested Fixes */}
              {result.suggested_fixes && result.suggested_fixes.length > 0 && (
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3 bg-gradient-to-b from-transparent to-[rgba(34,197,94,0.02)]">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 border-b border-[var(--border)] pb-2">
                    🛠️ Step-by-Step Actionable Solutions
                  </h4>
                  <div className="space-y-3">
                    {result.suggested_fixes.map((fix, idx) => (
                      <div
                        key={idx}
                        className="group flex gap-3 p-3 rounded-xl bg-[rgba(15,23,42,0.4)] border border-[var(--border)] hover:border-emerald-900 transition-colors"
                      >
                        <div className="w-5 h-5 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-[var(--success)] flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-[13px] leading-relaxed text-slate-200 font-medium">
                            {fix}
                          </p>
                          {/* If the solution step is a command line or code block, show copy */}
                          <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyToClipboard(fix, idx)}
                              className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-400 hover:text-emerald-400 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Practices Accordion */}
              {result.best_practices && result.best_practices.length > 0 && (
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 border-b border-[var(--border)] pb-2">
                    🛡️ Debugging Best Practices
                  </h4>
                  <ul className="space-y-2 list-none font-mono text-[11px] text-slate-300">
                    {result.best_practices.map((bp, i) => (
                      <li key={i} className="flex gap-2 items-start leading-relaxed">
                        <span className="text-indigo-500 font-black shrink-0">•</span>
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Learning Note deep dive */}
              {result.learning_notes && (
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3 bg-[rgba(234,179,8,0.03)] border-yellow-900/30">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5 border-b border-[var(--border)] pb-2">
                    💡 Concept Deep-Dive
                  </h4>
                  <div className="text-[12px] leading-relaxed text-slate-300 font-medium italic">
                    {parseMarkdownToReact(result.learning_notes)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Diagnostic dashboard idle card
            <div className="glass-card rounded-2xl p-8 border border-[var(--border)] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center text-3xl mx-auto shadow-sm">
                🛠️
              </div>
              <div>
                <h3 className="text-sm font-black">Debugger Telemetry Diagnostic Idle</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Submit a traceback stack, paste error text or logs, or load one of the pre-coded templates to populate the AI-enhanced mentor dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Analysis Stored History Sidebar */}
          <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span>📚 Stored Diagnostic Sessions</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono font-bold">
                {history.length} Saved
              </span>
            </h4>

            {loadingHistory ? (
              <div className="flex justify-center py-6">
                <span className="w-5 h-5 rounded-full border-2 border-t-transparent border-[var(--accent)] animate-spin"></span>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className={`group flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all hover:bg-[var(--accent-soft)] ${
                      activeHistoryId === item.id
                        ? "bg-[var(--accent-soft)] border-[var(--accent)]"
                        : "bg-[var(--bg-secondary)] border-[var(--border)]"
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[11px] font-black text-slate-200 truncate max-w-[140px]">
                          {item.error_type}
                        </p>
                        {item.ai_enhanced && (
                          <span className="text-[8px] bg-indigo-900/60 text-indigo-300 px-1.5 rounded font-mono font-bold uppercase tracking-tight">
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 truncate max-w-[200px]">
                        {item.message}
                      </p>
                      {item.created_at && (
                        <p className="text-[8px] font-mono text-slate-500">
                          ⏱️ {new Date(item.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteHistory(item.id!, e)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm hover:border-rose-900"
                      title="Delete saved session"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] font-mono text-slate-400 text-center py-6 bg-[rgba(15,23,42,0.2)] rounded-xl border border-[var(--border)]">
                No past debugger sessions logged.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
