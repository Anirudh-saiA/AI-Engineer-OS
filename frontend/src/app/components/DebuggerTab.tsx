"use client";

import React, { useState, useEffect, useCallback } from "react";
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

interface CodeSuggestion {
  name?: string;
  title?: string;
  before: string;
  after: string;
  reason: string;
}

interface LearningMode {
  concept: string;
  common_mistakes: string[];
  prevention_tips: string[];
  real_world_examples: string[];
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
  // Enhanced mentor fields
  beginner_explanation?: string;
  chain_of_events?: string[];
  code_suggestions?: CodeSuggestion[];
  recommended_fix?: string;
  learning_mode?: LearningMode;
}

interface DebuggerStats {
  total_sessions: number;
  ai_enhanced_count: number;
  rule_based_count: number;
  most_common_error?: string;
  severity_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
}

interface CodeReviewResult {
  suggestions: CodeSuggestion[];
  ai_enhanced: boolean;
  language: string;
}

const ERROR_EXAMPLES = [
  {
    name: "Python ZeroDivisionError (Traceback)",
    text: `Traceback (most recent call last):\n  File "c:\\Users\\aniru\\OneDrive\\Desktop\\AIOS\\backend\\app\\services\\analytics.py", line 42, in calculate_average_hours\n    return total_hours / total_projects\nZeroDivisionError: division by zero`
  },
  {
    name: "Python ModuleNotFoundError (fitz/PyMuPDF)",
    text: `Traceback (most recent call last):\n  File "main.py", line 12, in <module>\n    import fitz\nModuleNotFoundError: No module named 'fitz'`
  },
  {
    name: "Node.js 'Module not found' (React)",
    text: `Error: Cannot find module 'react-dom/client'\nRequire stack:\n- /Users/developer/project/src/index.js\n    at Module._resolveFilename (node:internal/modules/cjs/loader:1144:15)\n    at Module._load (node:internal/modules/cjs/loader:985:27)\n    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:135:5)`
  },
  {
    name: "npm Peer Dependency Conflict (ERESOLVE)",
    text: `npm ERR! code ERESOLVE\nnpm ERR! ERESOLVE could not resolve peer dependency\nnpm ERR! \nnpm ERR! While resolving: @typescript-eslint/eslint-plugin@6.21.0\nnpm ERR! Found: eslint@9.4.0\nnpm ERR! node_modules/eslint\nnpm ERR!   eslint@"^9.0.0" from the root project\nnpm ERR! \nnpm ERR! Could not resolve dependency:\nnpm ERR! peer eslint@"^8.57.0" from @typescript-eslint/eslint-plugin@6.21.0`
  },
  {
    name: "HTTP 401 Unauthorized API Response",
    text: `{\n  "status": 401,\n  "error": "Unauthorized",\n  "message": "Invalid authentication token. Token has expired.",\n  "timestamp": "2026-06-02T18:01:14Z"\n}`
  }
];

const PIPELINE_STEPS = [
  { icon: "⚠️", label: "Error Input" },
  { icon: "🏷️", label: "Classify" },
  { icon: "🔍", label: "Root Cause" },
  { icon: "💬", label: "Explain" },
  { icon: "🛠️", label: "Fix" },
  { icon: "📚", label: "Learn" },
  { icon: "💾", label: "Save" },
];

export default function DebuggerTab({ user, parseMarkdownToReact, addLog }: DebuggerTabProps) {
  const [errorInput, setErrorInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const [selectedExample, setSelectedExample] = useState("");

  // New state for enhanced features
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState({ category: "", severity: "" });
  const [stats, setStats] = useState<DebuggerStats | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    chain: true, beginner: true, recommended: true, fixes: true,
    code: false, practices: false, learning: false, mistakes: false,
  });

  // Code review state
  const [codeReviewInput, setCodeReviewInput] = useState("");
  const [codeReviewLang, setCodeReviewLang] = useState("python");
  const [codeReviewResult, setCodeReviewResult] = useState<CodeReviewResult | null>(null);
  const [reviewingCode, setReviewingCode] = useState(false);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (historySearch) params.set("search", historySearch);
      if (historyFilter.category) params.set("category", historyFilter.category);
      if (historyFilter.severity) params.set("severity", historyFilter.severity);

      const url = `${API_BASE_URL}/api/v1/debugger/history?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.uid}` },
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
  }, [user, historySearch, historyFilter]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/stats`, {
        headers: { Authorization: `Bearer ${user.uid}` },
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory, fetchStats]);

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
    setPipelineStep(0);
    addLog(`Initiating intelligent ${mode === "analyze" ? "AI analysis" : mode} parsing...`, "system");

    // Animate pipeline steps
    if (mode === "analyze") {
      const stepTimers: NodeJS.Timeout[] = [];
      for (let i = 1; i <= 6; i++) {
        stepTimers.push(setTimeout(() => setPipelineStep(i), i * 400));
      }
    }

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

        if (mode === "classify") {
          const unifiedResult: AnalysisResult = {
            error_type: data.error_type || "UnknownError",
            file: data.file,
            line: data.line,
            message: data.message || "Classification only",
            categories: data.categories || [],
            severity: data.severity || "medium",
            explanation: `Lightweight structural scan completed. Detected main error type: **${data.error_type}** in **${data.file || "unknown location"}**.`,
            root_cause: `Type: ${data.error_type}. Message: ${data.message}`,
            suggested_fixes: ["Run the 'Analyze Error' option for complete AI-powered fixes and deep conceptual explanations."],
            best_practices: ["Check your IDE lint warnings", "Trace back imports"],
            learning_notes: "To trigger interactive tutor mentoring and earn +10 XP, submit this traceback via the full AI 'Analyze Error' pipeline.",
            ai_enhanced: false,
            frames: data.frames || [],
            beginner_explanation: "",
            chain_of_events: [],
            code_suggestions: [],
            recommended_fix: "",
            learning_mode: { concept: "", common_mistakes: [], prevention_tips: [], real_world_examples: [] },
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
          if (mode === "analyze") {
            fetchHistory();
            fetchStats();
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
      setTimeout(() => setPipelineStep(-1), 1000);
    }
  };

  const handleCodeReview = async () => {
    if (!codeReviewInput.trim()) {
      addLog("Please paste some code to review.", "error");
      return;
    }
    setReviewingCode(true);
    setCodeReviewResult(null);
    addLog("Submitting code for AI review...", "system");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/code-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.uid}`,
        },
        body: JSON.stringify({ code_snippet: codeReviewInput, language: codeReviewLang }),
      });
      if (res.ok) {
        const data = await res.json();
        setCodeReviewResult(data);
        addLog(
          data.ai_enhanced
            ? "AI-powered code review completed! ✨"
            : "Pattern-based code review completed.",
          "success"
        );
      } else {
        addLog("Code review failed.", "error");
      }
    } catch (err) {
      console.error(err);
      addLog("Failed to reach code review service.", "error");
    } finally {
      setReviewingCode(false);
    }
  };

  const handleDeleteHistory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this analysis session?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.uid}` },
      });

      if (res.ok) {
        addLog("Analysis record deleted.", "info");
        if (activeHistoryId === id) {
          setResult(null);
          setActiveHistoryId(null);
        }
        fetchHistory();
        fetchStats();
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
        return { bg: "rgba(239, 68, 68, 0.15)", text: "rgb(239, 68, 68)", border: "rgba(239, 68, 68, 0.3)", glow: "0 0 20px rgba(239,68,68,0.15)" };
      case "high":
        return { bg: "rgba(249, 115, 22, 0.15)", text: "rgb(249, 115, 22)", border: "rgba(249, 115, 22, 0.3)", glow: "0 0 20px rgba(249,115,22,0.15)" };
      case "medium":
        return { bg: "rgba(234, 179, 8, 0.15)", text: "rgb(234, 179, 8)", border: "rgba(234, 179, 8, 0.3)", glow: "0 0 20px rgba(234,179,8,0.1)" };
      default:
        return { bg: "rgba(34, 197, 94, 0.15)", text: "rgb(34, 197, 94)", border: "rgba(34, 197, 94, 0.3)", glow: "0 0 20px rgba(34,197,94,0.1)" };
    }
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    addLog(`Copied ${label || "text"} to clipboard!`, "success");
  };

  // Collapsible section component
  const Section = ({ id, icon, title, color, children, badge }: {
    id: string; icon: string; title: string; color: string;
    children: React.ReactNode; badge?: React.ReactNode;
  }) => (
    <div className="glass-card rounded-2xl border border-[var(--border)] overflow-hidden transition-all duration-300" style={{ boxShadow: result ? getSeverityColor(result.severity).glow : "none" }}>
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <h4 className={`text-xs font-mono font-bold uppercase tracking-wider`} style={{ color }}>{title}</h4>
          {badge}
        </div>
        <span className="text-slate-500 text-xs transition-transform duration-200" style={{ transform: expandedSections[id] ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expandedSections[id] ? "2000px" : "0px", opacity: expandedSections[id] ? 1 : 0 }}
      >
        <div className="px-5 pb-5 space-y-3">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Welcome & Overview Header */}
      <div className="glass-card rounded-2xl p-6 border border-[var(--border)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[rgba(99,102,241,0.05)] to-transparent">
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <span>🧠</span> AI Debugging Mentor
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Intelligent error analysis · Root cause chains · Beginner explanations · Code suggestions · Learning mode
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border)] font-mono text-[10px] text-slate-300">
              <span className="text-indigo-400 font-bold">{stats.total_sessions}</span> sessions
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">{stats.ai_enhanced_count}</span> AI
            </div>
          )}
          <div className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border)] font-mono text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"></span>
            Mentor: ONLINE
          </div>
        </div>
      </div>

      {/* Pipeline Progress Indicator */}
      {analyzing && pipelineStep >= 0 && (
        <div className="glass-card rounded-2xl p-4 border border-[var(--border)] overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            {PIPELINE_STEPS.map((step, i) => (
              <React.Fragment key={i}>
                <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${i <= pipelineStep ? "opacity-100 scale-100" : "opacity-30 scale-90"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${i <= pipelineStep ? "bg-[rgba(99,102,241,0.2)] border-2 border-[var(--accent)] shadow-lg shadow-[rgba(99,102,241,0.2)]" : "bg-[var(--bg-secondary)] border border-[var(--border)]"} ${i === pipelineStep ? "animate-pulse" : ""}`}>
                    {step.icon}
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400">{step.label}</span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded transition-all duration-500 ${i < pipelineStep ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

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

            {/* Main exception input */}
            <div className="relative">
              <textarea
                value={errorInput}
                onChange={(e) => {
                  setErrorInput(e.target.value);
                  setSelectedExample("");
                }}
                placeholder="Paste your python stack trace, npm ERESOLVE error, HTTP response details, or compiler logs here..."
                className="w-full h-72 bg-[rgba(15,23,42,0.6)] border border-[var(--border)] rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-y shadow-inner"
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

            {/* Action Buttons */}
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
                <span>🔍</span> Classify
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
                <span>🌐</span> API Code
              </button>
            </div>
          </div>

          {/* Stack Trace Frame Visualizer */}
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

          {/* Code Review Mini-Panel */}
          <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>✨</span> Code Review Assistant
              </h4>
              <select
                value={codeReviewLang}
                onChange={(e) => setCodeReviewLang(e.target.value)}
                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </select>
            </div>
            <textarea
              value={codeReviewInput}
              onChange={(e) => setCodeReviewInput(e.target.value)}
              placeholder={`Paste your ${codeReviewLang} code here for improvement suggestions...`}
              className="w-full h-32 bg-[rgba(15,23,42,0.6)] border border-[var(--border)] rounded-xl p-3 font-mono text-[11px] leading-relaxed text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[var(--accent)] resize-y"
            />
            <button
              onClick={handleCodeReview}
              disabled={reviewingCode || !codeReviewInput.trim()}
              className="btn-outline py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer w-full"
            >
              {reviewingCode ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-t-transparent border-current animate-spin"></span>
                  Reviewing...
                </>
              ) : (
                <>
                  <span>🔎</span> Get Suggestions
                </>
              )}
            </button>

            {/* Code Review Results */}
            {codeReviewResult && codeReviewResult.suggestions.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    {codeReviewResult.suggestions.length} Suggestions Found
                  </span>
                  {codeReviewResult.ai_enhanced && (
                    <span className="text-[8px] bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-extrabold px-1.5 py-0.5 rounded-full">AI</span>
                  )}
                </div>
                {codeReviewResult.suggestions.map((sug, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
                    <p className="text-[11px] font-mono font-bold text-slate-200">{sug.title || `Suggestion ${i + 1}`}</p>
                    {sug.before && (
                      <div>
                        <span className="text-[9px] font-mono font-bold text-rose-400 uppercase">Before:</span>
                        <pre className="mt-1 p-2 rounded-lg bg-[rgba(239,68,68,0.05)] border border-rose-900/30 text-[10px] font-mono text-slate-300 overflow-x-auto">{sug.before}</pre>
                      </div>
                    )}
                    {sug.after && (
                      <div>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">After:</span>
                        <pre className="mt-1 p-2 rounded-lg bg-[rgba(34,197,94,0.05)] border border-emerald-900/30 text-[10px] font-mono text-slate-300 overflow-x-auto">{sug.after}</pre>
                      </div>
                    )}
                    {sug.reason && (
                      <p className="text-[10px] text-slate-400 italic">💡 {sug.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Analysis Result Dashboard & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Analysis View Card */}
          {result ? (
            <div className="space-y-4 animate-scale-in">
              {/* Header card with metadata */}
              <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4" style={{ boxShadow: getSeverityColor(result.severity).glow }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Primary Exception
                    </span>
                    <h3 className="text-base font-black text-rose-400 font-mono tracking-tight break-all">
                      {result.error_type}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.ai_enhanced && (
                      <span className="text-[9px] bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-violet-400">
                        ✨ AI-Enhanced
                      </span>
                    )}
                    {(() => {
                      const colors = getSeverityColor(result.severity);
                      return (
                        <span
                          className="px-3 py-1 rounded-full text-[9px] font-mono font-black border tracking-wider"
                          style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                        >
                          {result.severity?.toUpperCase()}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Categories */}
                {result.categories && result.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {result.categories.map((cat, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-[var(--bg-secondary)] border border-[var(--border)] text-slate-300">
                        🏷️ {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Location */}
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

                {/* Message */}
                <p className="text-[12px] font-mono leading-relaxed bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border)] text-slate-200">
                  {result.message}
                </p>
              </div>

              {/* Root Cause Chain */}
              {result.chain_of_events && result.chain_of_events.length > 0 && (
                <Section id="chain" icon="🔗" title="Root Cause Chain" color="rgb(249, 115, 22)">
                  <div className="space-y-0">
                    {result.chain_of_events.map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${i === result.chain_of_events!.length - 1 ? "bg-[rgba(239,68,68,0.2)] text-rose-400 border-2 border-rose-500/40" : "bg-[rgba(249,115,22,0.15)] text-orange-400 border border-orange-500/30"}`}>
                            {i + 1}
                          </div>
                          {i < result.chain_of_events!.length - 1 && (
                            <div className="w-0.5 h-6 bg-gradient-to-b from-orange-500/40 to-orange-500/10" />
                          )}
                        </div>
                        <p className={`text-[12px] leading-relaxed pt-0.5 pb-3 ${i === result.chain_of_events!.length - 1 ? "text-rose-300 font-bold" : "text-slate-300"}`}>
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Beginner Explanation */}
              {result.beginner_explanation && (
                <Section id="beginner" icon="🎓" title="Beginner-Friendly Explanation" color="rgb(99, 102, 241)">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[rgba(99,102,241,0.06)] to-transparent border border-indigo-500/10">
                    <div className="text-[13px] leading-relaxed text-slate-200 font-medium">
                      {parseMarkdownToReact(result.beginner_explanation)}
                    </div>
                  </div>
                </Section>
              )}

              {/* Recommended Fix */}
              {result.recommended_fix && (
                <Section id="recommended" icon="⭐" title="Recommended Fix" color="rgb(34, 197, 94)"
                  badge={<span className="text-[8px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Top Pick</span>}
                >
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[rgba(34,197,94,0.06)] to-transparent border border-emerald-500/20">
                    <div className="text-[13px] leading-relaxed text-slate-200 font-medium">
                      {parseMarkdownToReact(result.recommended_fix)}
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.recommended_fix!, "recommended fix")}
                      className="mt-3 text-[9px] font-mono font-bold tracking-wider uppercase text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-900/30 border border-emerald-800/40 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                    >
                      📋 Copy Fix
                    </button>
                  </div>
                </Section>
              )}

              {/* All Fixes */}
              {result.suggested_fixes && result.suggested_fixes.length > 0 && (
                <Section id="fixes" icon="🛠️" title="All Actionable Solutions" color="rgb(34, 197, 94)">
                  <div className="space-y-2">
                    {result.suggested_fixes.map((fix, idx) => (
                      <div key={idx} className="group flex gap-3 p-3 rounded-xl bg-[rgba(15,23,42,0.4)] border border-[var(--border)] hover:border-emerald-900 transition-colors">
                        <div className="w-5 h-5 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-[var(--success)] flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-[12px] leading-relaxed text-slate-200 font-medium">{fix}</p>
                          <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyToClipboard(fix, `fix #${idx + 1}`)}
                              className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-400 hover:text-emerald-400 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Code Suggestions */}
              {result.code_suggestions && result.code_suggestions.length > 0 && (
                <Section id="code" icon="💡" title="Code Suggestions" color="rgb(168, 85, 247)">
                  <div className="space-y-3">
                    {result.code_suggestions.map((sug, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
                        <p className="text-[11px] font-mono font-bold text-purple-300">{sug.name || sug.title || `Improvement ${i + 1}`}</p>
                        <div className="grid grid-cols-1 gap-2">
                          {sug.before && (
                            <div>
                              <span className="text-[9px] font-mono font-bold text-rose-400 uppercase">Before:</span>
                              <pre className="mt-1 p-2 rounded-lg bg-[rgba(239,68,68,0.05)] border border-rose-900/30 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">{sug.before}</pre>
                            </div>
                          )}
                          {sug.after && (
                            <div>
                              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">After:</span>
                              <pre className="mt-1 p-2 rounded-lg bg-[rgba(34,197,94,0.05)] border border-emerald-900/30 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">{sug.after}</pre>
                            </div>
                          )}
                        </div>
                        {sug.reason && (
                          <p className="text-[10px] text-slate-400 italic leading-relaxed">💡 {sug.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Best Practices */}
              {result.best_practices && result.best_practices.length > 0 && (
                <Section id="practices" icon="🛡️" title="Best Practices" color="rgb(99, 102, 241)">
                  <ul className="space-y-2 list-none font-mono text-[11px] text-slate-300">
                    {result.best_practices.map((bp, i) => (
                      <li key={i} className="flex gap-2 items-start leading-relaxed">
                        <span className="text-indigo-500 font-black shrink-0">•</span>
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Learning Mode */}
              {result.learning_mode && result.learning_mode.concept && (
                <Section id="learning" icon="📚" title="Learning Mode" color="rgb(234, 179, 8)"
                  badge={<span className="text-[8px] bg-yellow-900/60 text-yellow-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Teach Me</span>}
                >
                  <div className="space-y-4">
                    {/* Concept */}
                    <div className="space-y-1">
                      <h5 className="text-[10px] font-mono font-bold uppercase tracking-wide text-yellow-400/80">Concept Deep-Dive</h5>
                      <div className="text-[12px] leading-relaxed text-slate-300 font-medium">
                        {parseMarkdownToReact(result.learning_mode.concept)}
                      </div>
                    </div>

                    {/* Common Mistakes */}
                    {result.learning_mode.common_mistakes && result.learning_mode.common_mistakes.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-[var(--border)]">
                        <h5 className="text-[10px] font-mono font-bold uppercase tracking-wide text-rose-400/80">Common Mistakes</h5>
                        <ul className="space-y-1.5">
                          {result.learning_mode.common_mistakes.map((m, i) => (
                            <li key={i} className="flex gap-2 items-start text-[11px] text-slate-300">
                              <span className="text-rose-500 shrink-0">⚠️</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Prevention Techniques */}
                    {result.learning_mode.prevention_tips && result.learning_mode.prevention_tips.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-[var(--border)]">
                        <h5 className="text-[10px] font-mono font-bold uppercase tracking-wide text-emerald-400/80">Prevention Techniques</h5>
                        <ul className="space-y-1.5">
                          {result.learning_mode.prevention_tips.map((t, i) => (
                            <li key={i} className="flex gap-2 items-start text-[11px] text-slate-300">
                              <span className="text-emerald-500 shrink-0">✅</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Real-World Examples */}
                    {result.learning_mode.real_world_examples && result.learning_mode.real_world_examples.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-[var(--border)]">
                        <h5 className="text-[10px] font-mono font-bold uppercase tracking-wide text-blue-400/80">Real-World Examples</h5>
                        <ul className="space-y-1.5">
                          {result.learning_mode.real_world_examples.map((ex, i) => (
                            <li key={i} className="flex gap-2 items-start text-[11px] text-slate-300 italic">
                              <span className="shrink-0">🌍</span>
                              <span>{ex}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* Legacy Learning Note (fallback) */}
              {result.learning_notes && !result.learning_mode?.concept && (
                <Section id="learning" icon="💡" title="Concept Deep-Dive" color="rgb(234, 179, 8)">
                  <div className="text-[12px] leading-relaxed text-slate-300 font-medium italic">
                    {parseMarkdownToReact(result.learning_notes)}
                  </div>
                </Section>
              )}

              {/* Root Cause (legacy — shows if chain_of_events is empty) */}
              {result.root_cause && (!result.chain_of_events || result.chain_of_events.length === 0) && (
                <Section id="rootcause" icon="🧐" title="Root Cause" color="rgb(239, 68, 68)">
                  <div className="text-[13px] leading-relaxed text-slate-200 font-medium">
                    {parseMarkdownToReact(result.root_cause)}
                  </div>
                </Section>
              )}

              {/* Explanation (legacy — shows if beginner_explanation is empty) */}
              {result.explanation && !result.beginner_explanation && (
                <Section id="explanation" icon="📝" title="Explanation" color="rgb(99, 102, 241)">
                  <div className="text-[13px] leading-relaxed text-slate-200 font-medium">
                    {parseMarkdownToReact(result.explanation)}
                  </div>
                </Section>
              )}
            </div>
          ) : (
            // Idle state
            <div className="glass-card rounded-2xl p-8 border border-[var(--border)] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center text-3xl mx-auto shadow-sm">
                🧠
              </div>
              <div>
                <h3 className="text-sm font-black">AI Debugging Mentor Ready</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Submit a traceback, paste error text, or load a template to activate the AI-enhanced mentor pipeline.
                </p>
              </div>
              {/* Quick Stats */}
              {stats && stats.total_sessions > 0 && (
                <div className="pt-3 border-t border-[var(--border)] grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-lg font-black text-indigo-400">{stats.total_sessions}</p>
                    <p className="text-[9px] font-mono text-slate-500 uppercase">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-emerald-400">{stats.ai_enhanced_count}</p>
                    <p className="text-[9px] font-mono text-slate-500 uppercase">AI-Enhanced</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-amber-400">{stats.most_common_error || "—"}</p>
                    <p className="text-[9px] font-mono text-slate-500 uppercase">Top Error</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Panel */}
          <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span>📚 Debugging History</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono font-bold">
                {history.length} Saved
              </span>
            </h4>

            {/* Search & Filters */}
            <div className="space-y-2">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchHistory()}
                placeholder="Search errors, explanations, fixes..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[var(--accent)]"
              />
              <div className="flex gap-2">
                <select
                  value={historyFilter.severity}
                  onChange={(e) => {
                    setHistoryFilter(prev => ({ ...prev, severity: e.target.value }));
                    setTimeout(fetchHistory, 100);
                  }}
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">All Severity</option>
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
                <select
                  value={historyFilter.category}
                  onChange={(e) => {
                    setHistoryFilter(prev => ({ ...prev, category: e.target.value }));
                    setTimeout(fetchHistory, 100);
                  }}
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">All Categories</option>
                  <option value="Syntax Error">Syntax Error</option>
                  <option value="Runtime Error">Runtime Error</option>
                  <option value="Import Error">Import Error</option>
                  <option value="Type Error">Type Error</option>
                  <option value="Key Error">Key Error</option>
                  <option value="Index Error">Index Error</option>
                  <option value="API Error">API Error</option>
                  <option value="Database Error">Database Error</option>
                  <option value="Dependency Error">Dependency Error</option>
                </select>
              </div>
            </div>

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
                        {(() => {
                          const c = getSeverityColor(item.severity);
                          return (
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.text }} title={item.severity} />
                          );
                        })()}
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
                {historySearch || historyFilter.category || historyFilter.severity
                  ? "No results match your search criteria."
                  : "No past debugger sessions logged."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
