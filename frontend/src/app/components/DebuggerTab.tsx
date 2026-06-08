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
  beginner_explanation?: string;
  chain_of_events?: string[];
  code_suggestions?: CodeSuggestion[];
  recommended_fix?: string;
  learning_mode?: LearningMode;
  github_references?: any[];
  stackoverflow_references?: any[];
  safer_pattern?: {
    error_type: string;
    before: string;
    after: string;
    reason: string;
  };
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

interface SemanticSearchResult {
  error_name: string;
  error_category: string;
  similarity: number;
  similarity_pct: number;
  root_cause: string;
  beginner_explanation: string;
  fix_recommendations: string[];
  prevention_strategies: string[];
  best_practices: string[];
  related_errors: string[];
  frameworks: string[];
}

interface AnalyticsData {
  total_errors_analyzed: number;
  ai_enhanced_count: number;
  rule_based_count: number;
  category_distribution: [string, number][];
  severity_distribution: Record<string, number>;
  error_type_distribution: Record<string, number>;
  fix_success_rate: number | null;
  avg_confidence: {
    root_cause: number | null;
    fix: number | null;
    explanation: number | null;
  };
  daily_frequency: Record<string, number>;
  learning_notes_count: number;
  recurring_pattern_count: number;
  recent_errors: any[];
}

interface RecurringError {
  id: number;
  error_type: string;
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
  weak_area_category: string;
  suggested_module: string;
  is_addressed: boolean;
}

interface WeakArea {
  category: string;
  count: number;
  severity: string;
  suggested_module: string;
  recommendation: string;
}

interface KBEntry {
  error_name: string;
  error_category: string;
  root_cause: string;
  beginner_explanation: string;
  fix_recommendations: string[];
  prevention_strategies: string[];
  best_practices: string[];
  learning_resources: string[];
  related_errors: string[];
  frameworks: string[];
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

const ConfidenceGauge = ({ value, label, title, color }: { value: number; label: string; title: string; color: string }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="confidence-gauge-container p-2 flex flex-col items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl w-full">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="none"
            className="confidence-ring-circle"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute font-mono text-[11px] font-black text-slate-100 confidence-gauge-value">
          {value}%
        </span>
      </div>
      <span className="text-[9px] font-bold text-slate-300 mt-2 text-center break-words w-full">{title}</span>
      <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-500 mt-0.5 text-center">{label}</span>
    </div>
  );
};

export default function DebuggerTab({ user, parseMarkdownToReact, addLog }: DebuggerTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"analyze" | "search" | "analytics" | "patterns" | "learn">("analyze");

  // Core submission/analysis state
  const [errorInput, setErrorInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const [selectedExample, setSelectedExample] = useState("");

  // Search tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Analytics tab state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Patterns tab state
  const [recurringData, setRecurringData] = useState<{
    recurring_errors: RecurringError[];
    all_patterns: any[];
    weak_area_report: WeakArea[];
  } | null>(null);
  const [loadingPatterns, setLoadingPatterns] = useState(false);

  // Learn tab state
  const [kbData, setKbData] = useState<{
    stats: any;
    categories: string[];
    entries: KBEntry[];
    total: number;
  } | null>(null);
  const [selectedKbCategory, setSelectedKbCategory] = useState<string>("");
  const [loadingKb, setLoadingKb] = useState(false);
  const [expandedKbIndex, setExpandedKbIndex] = useState<number | null>(null);
  const [kbTeachingCards, setKbTeachingCards] = useState<Record<string, any>>({});
  const [loadingKbCard, setLoadingKbCard] = useState<string | null>(null);

  // Confidence & Live Teaching states for current result
  const [currentConfidence, setCurrentConfidence] = useState<any>(null);
  const [currentSimilarErrors, setCurrentSimilarErrors] = useState<any[]>([]);
  const [currentTeachingCard, setCurrentTeachingCard] = useState<any>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean | null>(null);

  // General state
  const [stats, setStats] = useState<DebuggerStats | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState({ category: "", severity: "" });
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

  // Fetch Analytics Tab Data
  const fetchAnalytics = async () => {
    if (!user) return;
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/debugging-analytics`, {
        headers: { Authorization: `Bearer ${user.uid}` },
      });
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch (err) {
      console.error("Failed to load analytics dashboard data:", err);
      addLog("Failed to load analytics dashboard.", "error");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Recurring Error Patterns & Weak Area Report
  const fetchRecurringData = async () => {
    if (!user) return;
    setLoadingPatterns(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/recurring-errors`, {
        headers: { Authorization: `Bearer ${user.uid}` },
      });
      if (res.ok) {
        setRecurringData(await res.json());
      }
    } catch (err) {
      console.error("Failed to load recurring patterns:", err);
      addLog("Failed to load recurring patterns.", "error");
    } finally {
      setLoadingPatterns(false);
    }
  };

  // Fetch Knowledge Base Browser Data
  const fetchKnowledgeBase = async (cat?: string) => {
    if (!user) return;
    setLoadingKb(true);
    try {
      const params = new URLSearchParams();
      if (cat) params.set("category", cat);
      const url = `${API_BASE_URL}/api/v1/debugger/knowledge-base?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.uid}` },
      });
      if (res.ok) {
        setKbData(await res.json());
      }
    } catch (err) {
      console.error("Failed to load knowledge base:", err);
      addLog("Failed to load error knowledge base.", "error");
    } finally {
      setLoadingKb(false);
    }
  };

  // Semantic Search
  const handleSemanticSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/error-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.uid}`,
        },
        body: JSON.stringify({ query: searchQuery, top_k: 8 }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
        addLog(`Semantic search found ${data.results?.length || 0} matching concepts.`, "success");
      }
    } catch (err) {
      console.error(err);
      addLog("Semantic search request failed.", "error");
    } finally {
      setSearching(false);
    }
  };

  // Fetch Live Teaching Card for KB Browse
  const fetchKbTeachingCard = async (errorType: string) => {
    if (kbTeachingCards[errorType]) return;
    setLoadingKbCard(errorType);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/teaching-card/${encodeURIComponent(errorType)}`, {
        headers: { Authorization: `Bearer ${user.uid}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKbTeachingCards(prev => ({ ...prev, [errorType]: data }));
      }
    } catch (err) {
      console.error("Failed to load teaching card", err);
    } finally {
      setLoadingKbCard(null);
    }
  };

  // Enrich Analysis with Confidence, similar errors and teaching card
  const enrichAnalysis = async (analysisId: number, errorType: string, errorText: string) => {
    // 1. Fetch confidence scores
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/confidence-scores/${analysisId}`, {
        headers: { Authorization: `Bearer ${user.uid}` },
      });
      if (res.ok) {
        const conf = await res.json();
        setCurrentConfidence(conf);
        setFeedbackSubmitted(conf.was_fix_helpful);
      } else {
        setCurrentConfidence(null);
        setFeedbackSubmitted(null);
      }
    } catch (e) {
      console.error("Failed to load confidence scores", e);
    }

    // 2. Fetch similar errors using semantic search
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/error-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.uid}`,
        },
        body: JSON.stringify({ query: errorText || errorType, top_k: 3 }),
      });
      if (res.ok) {
        const searchData = await res.json();
        setCurrentSimilarErrors(searchData.results || []);
      } else {
        setCurrentSimilarErrors([]);
      }
    } catch (e) {
      console.error("Failed to fetch similar errors", e);
    }

    // 3. Fetch teaching card
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/teaching-card/${encodeURIComponent(errorType)}`, {
        headers: { Authorization: `Bearer ${user.uid}` },
      });
      if (res.ok) {
        const card = await res.json();
        setCurrentTeachingCard(card);
      } else {
        setCurrentTeachingCard(null);
      }
    } catch (e) {
      console.error("Failed to fetch teaching card", e);
      setCurrentTeachingCard(null);
    }
  };

  // Submit Feedback on helpfulness
  const handleFeedback = async (helpful: boolean) => {
    if (!result?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/debugger/feedback/${result.id}?helpful=${helpful}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.uid}` },
      });
      if (res.ok) {
        setFeedbackSubmitted(helpful);
        addLog(`Submitted feedback: marked fix suggestion as ${helpful ? "helpful" : "unhelpful"}.`, "success");
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      addLog("Failed to submit feedback.", "error");
    }
  };

  // Handle Tab Change with lazy loading
  const handleTabChange = (tab: "analyze" | "search" | "analytics" | "patterns" | "learn") => {
    setActiveSubTab(tab);
    if (tab === "analytics") {
      fetchAnalytics();
    } else if (tab === "patterns") {
      fetchRecurringData();
    } else if (tab === "learn") {
      fetchKnowledgeBase(selectedKbCategory);
    }
  };

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
    setCurrentConfidence(null);
    setCurrentSimilarErrors([]);
    setCurrentTeachingCard(null);
    setFeedbackSubmitted(null);
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
            if (data.id) {
              enrichAnalysis(data.id, data.error_type, errorInput);
            }
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
          setCurrentConfidence(null);
          setCurrentSimilarErrors([]);
          setCurrentTeachingCard(null);
          setFeedbackSubmitted(null);
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
    if (item.id) {
      enrichAnalysis(item.id, item.error_type, item.message || "");
    }
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
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color }}>{title}</h4>
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
            Centralized Knowledge Base · Semantic Search · Confidence Scoring · Analytics · Recur Tracker
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

      {/* Sub-Tab strip */}
      <div className="debugger-subtab-strip">
        <button
          onClick={() => handleTabChange("analyze")}
          className={`debugger-subtab-btn ${activeSubTab === "analyze" ? "active" : ""}`}
        >
          <span>🧠</span> Analyze Error
        </button>
        <button
          onClick={() => handleTabChange("search")}
          className={`debugger-subtab-btn ${activeSubTab === "search" ? "active" : ""}`}
        >
          <span>🔍</span> Semantic Search
        </button>
        <button
          onClick={() => handleTabChange("analytics")}
          className={`debugger-subtab-btn ${activeSubTab === "analytics" ? "active" : ""}`}
        >
          <span>📊</span> Analytics Dashboard
        </button>
        <button
          onClick={() => handleTabChange("patterns")}
          className={`debugger-subtab-btn ${activeSubTab === "patterns" ? "active" : ""}`}
        >
          <span>🔄</span> Recurring Patterns
        </button>
        <button
          onClick={() => handleTabChange("learn")}
          className={`debugger-subtab-btn ${activeSubTab === "learn" ? "active" : ""}`}
        >
          <span>📚</span> Browse KB
        </button>
      </div>

      {/* Pipeline Progress Indicator (Only in analyze tab when analyzing) */}
      {activeSubTab === "analyze" && analyzing && pipelineStep >= 0 && (
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

      {/* ──────────────────────────────────────────────────────── */}
      {/* 🧠 SUBTAB 1: ANALYZE ERROR */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeSubTab === "analyze" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Editor & Submission (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
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
                  className="btn-accent flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-md"
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
                          ✨ AI
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

                {/* Confidence Scores Gauge Panel */}
                {currentConfidence && (
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-[var(--border)] pb-2">
                      🎯 Analysis Confidence Engine
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <ConfidenceGauge
                        value={currentConfidence.root_cause_confidence}
                        label={currentConfidence.root_cause_label}
                        title="Root Cause"
                        color="#f97316"
                      />
                      <ConfidenceGauge
                        value={currentConfidence.fix_confidence}
                        label={currentConfidence.fix_label}
                        title="Fix Plan"
                        color="#10b981"
                      />
                      <ConfidenceGauge
                        value={currentConfidence.explanation_confidence}
                        label={currentConfidence.explanation_label}
                        title="Concept"
                        color="#6366f1"
                      />
                    </div>

                    {/* Was this fix helpful feedback */}
                    <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-300">Did these solutions resolve your error?</span>
                      <div className="flex gap-2">
                        {feedbackSubmitted === true ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-900">
                            ✓ Fixed marked helpful!
                          </span>
                        ) : feedbackSubmitted === false ? (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-900">
                            ✗ Fix marked unhelpful
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleFeedback(true)}
                              className="text-[10px] bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-800 text-emerald-300 font-extrabold px-3 py-1 rounded cursor-pointer transition-colors"
                            >
                              👍 Yes, fixed!
                            </button>
                            <button
                              onClick={() => handleFeedback(false)}
                              className="text-[10px] bg-rose-900/40 hover:bg-rose-800/60 border border-rose-800 text-rose-300 font-extrabold px-3 py-1 rounded cursor-pointer transition-colors"
                            >
                              👎 No
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Similar Past Errors display */}
                {currentSimilarErrors && currentSimilarErrors.length > 0 && (
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-[var(--border)] pb-2">
                      👥 Similar Past Debugging Sessions
                    </h4>
                    <div className="space-y-2">
                      {currentSimilarErrors.map((err, idx) => (
                        <div
                          key={idx}
                          className="similar-error-card flex justify-between items-center gap-3 cursor-pointer"
                          onClick={() => {
                            setSearchQuery(err.error_name);
                            handleTabChange("search");
                          }}
                        >
                          <div className="truncate">
                            <p className="text-[11px] font-bold font-mono text-slate-200 truncate">{err.error_name}</p>
                            <p className="text-[9px] font-mono text-slate-400 mt-0.5">Category: {err.error_category || err.category}</p>
                          </div>
                          <span className="similarity-badge bg-orange-950/60 text-orange-400 border border-orange-900/50 shrink-0">
                            {err.similarity_pct ? err.similarity_pct : Math.round(err.similarity * 100)}% Match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Community Solutions Panel */}
                {((result.github_references && result.github_references.length > 0) ||
                  (result.stackoverflow_references && result.stackoverflow_references.length > 0)) && (
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4 animate-fadeIn">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 border-b border-[var(--border)] pb-2 flex items-center justify-between">
                      <span>🌐 Community Solutions</span>
                      <span className="text-[8px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Real-time Refs</span>
                    </h4>

                    {/* GitHub Issues */}
                    {result.github_references && result.github_references.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-mono font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                          <span>🐈</span> GitHub Issues
                        </h5>
                        <div className="space-y-2">
                          {result.github_references.map((ref, idx) => (
                            <a
                              key={idx}
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-indigo-500/50 transition-colors space-y-1.5"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-[11px] font-bold text-slate-200 hover:text-indigo-400 transition-colors line-clamp-2">
                                  {ref.title}
                                </p>
                                <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ${ref.state === "closed" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40" : "bg-amber-950/60 text-amber-400 border border-amber-900/40"}`}>
                                  {ref.state}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                                <span>💬 {ref.comments_count || 0} comments</span>
                                <span>Created: {ref.created_at ? new Date(ref.created_at).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stack Overflow */}
                    {result.stackoverflow_references && result.stackoverflow_references.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                        <h5 className="text-[10px] font-mono font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                          <span>🥞</span> Stack Overflow Threads
                        </h5>
                        <div className="space-y-2">
                          {result.stackoverflow_references.map((ref, idx) => (
                            <a
                              key={idx}
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-indigo-500/50 transition-colors space-y-1.5"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-[11px] font-bold text-slate-200 hover:text-indigo-400 transition-colors line-clamp-2">
                                  {ref.title}
                                </p>
                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded shrink-0 ${ref.is_answered ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                                  {ref.is_answered ? "Solved" : "Unsolved"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                                <span>🔥 Score: {ref.score || 0}</span>
                                <span>👀 Views: {ref.view_count || 0}</span>
                                <span>🗣️ Answers: {ref.answer_count || 0}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Best Practices & Safe Coding Patterns */}
                {result.safer_pattern && result.safer_pattern.before && (
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4 animate-fadeIn">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 border-b border-[var(--border)] pb-2 flex items-center justify-between">
                      <span>🛡️ Best Practices & Safe Coding Patterns</span>
                      <span className="text-[8px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Safer Alternative</span>
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      We detected a safer pattern implementation to prevent this crash type:
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-rose-400 uppercase">⚠️ Unsafe Pattern:</span>
                        <pre className="mt-1 p-3 rounded-xl bg-[rgba(239,68,68,0.03)] border border-rose-900/20 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">{result.safer_pattern.before}</pre>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">🛡️ Safe Pattern:</span>
                        <pre className="mt-1 p-3 rounded-xl bg-[rgba(34,197,94,0.03)] border border-emerald-900/20 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">{result.safer_pattern.after}</pre>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                        <p className="text-[11px] text-slate-300 leading-relaxed"><strong className="text-emerald-400 font-mono">Why:</strong> {result.safer_pattern.reason}</p>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Teaching Card Layer */}
                {currentTeachingCard && (
                  <Section id="learning" icon="📚" title="AI Teaching Card" color="rgb(234, 179, 8)"
                    badge={<span className="text-[8px] bg-yellow-900/60 text-yellow-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">{currentTeachingCard.difficulty_level}</span>}
                  >
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h5 className="text-[10px] font-mono font-bold uppercase tracking-wide text-yellow-400/80">Underlying Concept</h5>
                        <h4 className="text-sm font-bold text-slate-200">{currentTeachingCard.concept_title}</h4>
                        <div className="text-[12px] leading-relaxed text-slate-300 font-medium mt-1">
                          {parseMarkdownToReact(currentTeachingCard.why_it_happened)}
                        </div>
                      </div>

                      {currentTeachingCard.underlying_concepts && currentTeachingCard.underlying_concepts.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-[var(--border)]">
                          <h5 className="text-[10px] font-mono font-bold uppercase tracking-wide text-indigo-400/80">Key Computer Science Fundamentals</h5>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentTeachingCard.underlying_concepts.map((uc: string, i: number) => (
                              <span key={i} className="text-[9px] bg-indigo-950/40 text-indigo-300 border border-indigo-900/50 px-2 py-0.5 rounded-lg font-mono">
                                ⚛️ {uc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentTeachingCard.prevention_strategies && currentTeachingCard.prevention_strategies.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-[var(--border)]">
                          <h5 className="text-[10px] font-mono font-bold uppercase tracking-wide text-emerald-400/80">Prevention Strategies</h5>
                          <ul className="space-y-1.5 mt-1">
                            {currentTeachingCard.prevention_strategies.map((t: string, i: number) => (
                              <li key={i} className="flex gap-2 items-start text-[11px] text-slate-300">
                                <span className="text-emerald-500 shrink-0">✅</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {currentTeachingCard.real_world_examples && currentTeachingCard.real_world_examples.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-[var(--border)]">
                          <h5 className="text-[10px] font-mono font-bold uppercase tracking-wide text-blue-400/80">Real-World Production Scenarios</h5>
                          <ul className="space-y-1.5 mt-1">
                            {currentTeachingCard.real_world_examples.map((ex: string, i: number) => (
                              <li key={i} className="flex gap-2 items-start text-[11px] text-slate-300 italic">
                                <span className="shrink-0 text-blue-400">🌍</span>
                                <span>{ex}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Section>
                )}
              </div>
            ) : analyzing ? (
              <div className="space-y-4 animate-pulse">
                {/* Skeleton for Header metadata */}
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                  </div>
                  <div className="h-8 bg-slate-900 rounded w-full"></div>
                </div>

                {/* Skeleton for Confidence score */}
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3">
                  <div className="h-3 bg-slate-800 rounded w-1/3"></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-16 bg-slate-900 rounded-xl"></div>
                    <div className="h-16 bg-slate-900 rounded-xl"></div>
                    <div className="h-16 bg-slate-900 rounded-xl"></div>
                  </div>
                </div>

                {/* Skeleton for Community References */}
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                  <div className="space-y-2">
                    <div className="h-12 bg-slate-900 rounded-xl"></div>
                    <div className="h-12 bg-slate-900 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ) : (
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
                    <div className="text-center text-ellipsis overflow-hidden whitespace-nowrap">
                      <p className="text-lg font-black text-amber-400 truncate w-full" title={stats.most_common_error}>{stats.most_common_error || "—"}</p>
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
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 🔍 SUBTAB 2: SEMANTIC SEARCH */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeSubTab === "search" && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-[var(--border)] space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400">
              🔍 Semantic Error Search
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Find debugging guides from the knowledge base by typing natural language symptoms, imports conflicts, or logs. Uses vector embeddings to match concepts instead of raw keywords.
            </p>

            <form onSubmit={handleSemanticSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., failed to read pandas dataframe because of index, cannot import modules, peer dependency conflict eslint"
                className="flex-1 bg-[rgba(15,23,42,0.6)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="btn-accent px-6 py-3 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2"
              >
                {searching ? "Searching..." : "Search KB"}
              </button>
            </form>

            {/* Quick-select tags */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Quick Search:</span>
              {[
                "KeyError in python dictionary",
                "Next.js hydration error",
                "React Hook rendering issue",
                "npm ERESOLVE dependency",
                "CORS auth headers missing",
                "OperationalError database timeout"
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(q);
                    // Trigger search after a tiny timeout to ensure state update
                    setTimeout(() => {
                      setSearching(true);
                      fetch(`${API_BASE_URL}/api/v1/debugger/error-search`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${user.uid}`,
                        },
                        body: JSON.stringify({ query: q, top_k: 8 }),
                      })
                        .then(r => r.json())
                        .then(d => {
                          setSearchResults(d.results || []);
                          setSearching(false);
                        })
                        .catch(() => setSearching(false));
                    }, 50);
                  }}
                  className="bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-500 text-[10px] font-mono text-slate-300 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {searching ? (
            <div className="flex flex-col justify-center items-center py-12 space-y-3">
              <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-[var(--accent)] animate-spin"></span>
              <span className="text-xs font-mono text-slate-400">Computing embeddings and matching vector similarities...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  Showing {searchResults.length} ranked semantic matches:
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((res, idx) => (
                  <div key={idx} className="glass-card rounded-2xl p-5 border border-[var(--border)] hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-2">
                        <div>
                          <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            {res.error_category}
                          </span>
                          <h4 className="text-sm font-black text-slate-100 font-mono mt-1 break-all">
                            {res.error_name}
                          </h4>
                        </div>
                        <span className="similarity-badge bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 shrink-0">
                          {res.similarity_pct}% Match
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-[12px] leading-relaxed">
                        <div>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-500">Root Cause</span>
                          <p className="text-slate-300 font-medium">{res.root_cause}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-400">Beginner Explanation</span>
                          <div className="text-slate-300 font-medium mt-0.5">
                            {parseMarkdownToReact(res.beginner_explanation)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border)] space-y-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400">Actionable Fix Recommendations</span>
                      <ul className="space-y-1">
                        {res.fix_recommendations.map((rec, rIdx) => (
                          <li key={rIdx} className="flex gap-2 items-start text-[11px] text-slate-300 font-medium">
                            <span className="text-emerald-500 shrink-0">✓</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setErrorInput(res.error_name);
                            setActiveSubTab("analyze");
                          }}
                          className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/40 border border-indigo-900/40 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                        >
                          📋 Load in Editor
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : searchQuery ? (
            <div className="glass-card rounded-2xl p-8 border border-[var(--border)] text-center">
              <p className="text-xs font-mono text-slate-400">No semantic matches found for your query. Try writing a longer phrase or error message.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 📊 SUBTAB 3: ANALYTICS DASHBOARD */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6">
          {loadingAnalytics ? (
            <div className="flex justify-center items-center py-20">
              <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-[var(--accent)] animate-spin"></span>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] stat-card-1">
                  <p className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Total Debugging Sessions</p>
                  <p className="text-2xl font-black text-slate-100 mt-1">{analytics.total_errors_analyzed}</p>
                  <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                    {analytics.rule_based_count} rules + {analytics.ai_enhanced_count} AI
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] stat-card-2">
                  <p className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">AI Enhancement Rate</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {analytics.total_errors_analyzed > 0
                      ? Math.round((analytics.ai_enhanced_count / analytics.total_errors_analyzed) * 100)
                      : 0}%
                  </p>
                  <p className="text-[9px] font-mono text-slate-500 mt-0.5">sessions leverage Gemini AI</p>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] stat-card-3">
                  <p className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Saved Learning Insights</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">{analytics.learning_notes_count}</p>
                  <p className="text-[9px] font-mono text-slate-500 mt-0.5">active concept notebooks</p>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] stat-card-4">
                  <p className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Recurring Patterns</p>
                  <p className="text-2xl font-black text-indigo-400 mt-1">{analytics.recurring_pattern_count}</p>
                  <p className="text-[9px] font-mono text-slate-500 mt-0.5">struggling areas detected</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column Left (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Category Distribution Chart */}
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 border-b border-[var(--border)] pb-2">
                      🏷️ Error Category Distribution
                    </h4>
                    {analytics.category_distribution && analytics.category_distribution.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.category_distribution.map(([cat, count], idx) => {
                          const maxCount = analytics.category_distribution[0][1];
                          const percent = Math.max(8, Math.min(100, (count / maxCount) * 100));
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center text-[11px] font-mono">
                                <span className="font-bold text-slate-300">{cat}</span>
                                <span className="text-indigo-400 font-black">{count} error(s)</span>
                              </div>
                              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-slate-500">No categories logged yet.</p>
                    )}
                  </div>

                  {/* Historical Confidence Scores */}
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 border-b border-[var(--border)] pb-2">
                      🎯 Historical Avg Confidence Scores
                    </h4>
                    {analytics.avg_confidence && (analytics.avg_confidence.root_cause || analytics.avg_confidence.fix) ? (
                      <div className="grid grid-cols-3 gap-4">
                        <ConfidenceGauge
                          value={analytics.avg_confidence.root_cause || 0}
                          label="Avg"
                          title="Root Cause"
                          color="#f97316"
                        />
                        <ConfidenceGauge
                          value={analytics.avg_confidence.fix || 0}
                          label="Avg"
                          title="Fix Plan"
                          color="#10b981"
                        />
                        <ConfidenceGauge
                          value={analytics.avg_confidence.explanation || 0}
                          label="Avg"
                          title="Explanation"
                          color="#6366f1"
                        />
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-slate-500">No confidence statistics available yet.</p>
                    )}
                  </div>

                  {/* Recent Session Logs */}
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 border-b border-[var(--border)] pb-2">
                      ⏱️ Recent Debugging Logs
                    </h4>
                    {analytics.recent_errors && analytics.recent_errors.length > 0 ? (
                      <div className="space-y-2">
                        {analytics.recent_errors.map((err, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-slate-600 transition-colors cursor-pointer flex items-center justify-between gap-3 text-[11px] font-mono"
                            onClick={() => {
                              // Find item in local state
                              const histItem = history.find(h => h.id === err.id);
                              if (histItem) {
                                loadHistoryItem(histItem);
                                handleTabChange("analyze");
                              } else {
                                addLog("Error analysis session record not found in browser buffer.", "error");
                              }
                            }}
                          >
                            <div>
                              <span className="font-black text-slate-200">{err.error_type}</span>
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                Analyzed on {new Date(err.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {err.confidence && (
                                <span className="bg-indigo-950/60 text-indigo-400 border border-indigo-900/50 px-2 py-0.5 rounded text-[9px]">
                                  {err.confidence}% Conf
                                </span>
                              )}
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: getSeverityColor(err.severity).text }}
                                title={err.severity}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-slate-500">No recent errors logged.</p>
                    )}
                  </div>
                </div>

                {/* Column Right (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Severity Distribution */}
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 border-b border-[var(--border)] pb-2">
                      ⚠️ Severity Breakdown
                    </h4>
                    <div className="space-y-3">
                      {["critical", "high", "medium", "low"].map((sev, idx) => {
                        const count = analytics.severity_distribution[sev] || 0;
                        const total = analytics.total_errors_analyzed || 1;
                        const pct = Math.round((count / total) * 100);
                        const colors = getSeverityColor(sev);

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="font-bold uppercase" style={{ color: colors.text }}>{sev}</span>
                              <span className="text-slate-400">{count} session(s) ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${pct}%`, background: colors.text }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fix Success Rate Gauge */}
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 border-b border-[var(--border)] pb-2">
                      🏆 Fix Success Rate
                    </h4>
                    {analytics.fix_success_rate !== null ? (
                      <div className="flex flex-col items-center py-2">
                        <ConfidenceGauge
                          value={analytics.fix_success_rate}
                          label="Helpful Rate"
                          title="Resolved Bugs"
                          color="#10b981"
                        />
                        <p className="text-[10px] text-slate-400 font-mono text-center mt-3 max-w-[200px]">
                          Percentage of fixes user marked as helpful. Excellent job applying solutions!
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-slate-500 text-center py-6">
                        No feedback ratings submitted yet. Help the model learn by marking fixes helpful/unhelpful!
                      </p>
                    )}
                  </div>

                  {/* Daily Frequency - last 7 days bar chart */}
                  <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 border-b border-[var(--border)] pb-2">
                      📅 Last 7 Days Activity
                    </h4>
                    {analytics.daily_frequency && Object.keys(analytics.daily_frequency).length > 0 ? (
                      <div className="space-y-2 pt-1">
                        {Object.entries(analytics.daily_frequency).map(([date, cnt], idx) => {
                          const maxCnt = Math.max(...Object.values(analytics.daily_frequency), 1);
                          const percentage = Math.max(5, (cnt / maxCnt) * 100);
                          return (
                            <div key={idx} className="flex items-center gap-2 text-[10px] font-mono">
                              <span className="w-20 text-slate-400 truncate">{date}</span>
                              <div className="flex-1 h-3 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-lg transition-all duration-1000"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="w-6 text-right font-black text-indigo-400">{cnt}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-slate-500 text-center py-4">No recent activity detected.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 border border-[var(--border)] text-center">
              <p className="text-xs font-mono text-slate-400">Analytics dashboard data is empty.</p>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 🔄 SUBTAB 4: RECURRING PATTERNS */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeSubTab === "patterns" && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3 bg-gradient-to-r from-[rgba(239,68,68,0.02)] to-transparent">
            <h3 className="text-sm font-black uppercase tracking-wider text-rose-400">
              🔄 Recurring Error Tracker
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              The tracker automatically isolates exceptions you make repeatedly (3+ times) and calculates weak areas in programming skills, mapping personalized tutoring topics to strengthen logic.
            </p>
          </div>

          {loadingPatterns ? (
            <div className="flex justify-center items-center py-20">
              <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-[var(--accent)] animate-spin"></span>
            </div>
          ) : recurringData ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Weak Area Report (6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 border-b border-[var(--border)] pb-2">
                    🎯 Dynamic Skill Gap Analysis
                  </h4>
                  {recurringData.weak_area_report && recurringData.weak_area_report.length > 0 ? (
                    <div className="space-y-4">
                      {recurringData.weak_area_report.map((wa, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[9px] bg-rose-950/60 text-rose-400 border border-rose-900/50 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                {wa.severity} severity
                              </span>
                              <h5 className="text-sm font-bold text-slate-200 mt-1">{wa.category}</h5>
                            </div>
                            <span className="text-xs font-mono font-black text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                              Encountered {wa.count}x
                            </span>
                          </div>

                          <div className="text-[12px] leading-relaxed text-slate-300 font-medium">
                            <p className="italic">💡 {wa.recommendation}</p>
                          </div>

                          <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center text-[10px] font-mono">
                            <span className="text-slate-500">Recommended Study Module:</span>
                            <span className="text-emerald-400 font-black">{wa.suggested_module}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="text-3xl">🎉</span>
                      <p className="text-xs font-mono text-slate-400 mt-2">No skill gaps detected yet! Keep debugging cleanly.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recurring Error List (6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 border-b border-[var(--border)] pb-2">
                    🔄 Encountered Recurring Errors
                  </h4>
                  {recurringData.recurring_errors && recurringData.recurring_errors.length > 0 ? (
                    <div className="space-y-3">
                      {recurringData.recurring_errors.map((pat, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between gap-3 text-[11px] font-mono">
                          <div>
                            <span className="font-black text-slate-200 text-xs">{pat.error_type}</span>
                            <p className="text-[9px] text-slate-500 mt-1">
                              First: {new Date(pat.first_seen).toLocaleDateString()} | Last: {new Date(pat.last_seen).toLocaleDateString()}
                            </p>
                            <p className="text-[9px] text-indigo-400 mt-0.5">
                              Focus Area: {pat.weak_area_category}
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1.5">
                            <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-900/30">
                              Count: {pat.occurrence_count}
                            </span>
                            <button
                              onClick={() => {
                                setErrorInput(pat.error_type);
                                handleTabChange("analyze");
                              }}
                              className="text-[8px] bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 px-2 py-0.5 rounded tracking-wide uppercase font-bold cursor-pointer"
                            >
                              Debug Type
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-slate-500 text-center py-6">
                      No errors have occurred 3+ times. Great job learning from mistakes!
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 border border-[var(--border)] text-center">
              <p className="text-xs font-mono text-slate-400">No recurring error tracking data found.</p>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 📚 SUBTAB 5: BROWSE KNOWLEDGE BASE */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeSubTab === "learn" && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-[var(--border)] space-y-3 bg-gradient-to-r from-[rgba(234,179,8,0.02)] to-transparent">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
              📚 Error Knowledge Base Browser
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Explore the curated knowledge base of standard framework mistakes across Python, React, Next.js, Database design, APIs, JWT authentication, and dependency resolving.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Categories Panel (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="glass-card rounded-2xl p-4 border border-[var(--border)] space-y-2">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-[var(--border)] pb-2 mb-2">
                  Browse by Category
                </h4>
                <button
                  onClick={() => {
                    setSelectedKbCategory("");
                    fetchKnowledgeBase("");
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                    selectedKbCategory === ""
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]"
                      : "text-slate-300 hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  All Domains ({kbData?.stats?.total_entries || 0})
                </button>
                {kbData?.categories?.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedKbCategory(cat);
                      fetchKnowledgeBase(cat);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                      selectedKbCategory === cat
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]"
                        : "text-slate-300 hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    {cat} ({kbData?.stats?.category_distribution?.[cat] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: KB Entries list (9 cols) */}
            <div className="lg:col-span-9 space-y-4">
              {loadingKb ? (
                <div className="flex justify-center items-center py-20">
                  <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-[var(--accent)] animate-spin"></span>
                </div>
              ) : kbData?.entries && kbData.entries.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1 text-[11px] font-mono text-slate-400">
                    <span>Showing {kbData.entries.length} articles</span>
                    <span>Knowledge index populated</span>
                  </div>

                  {kbData.entries.map((entry, idx) => {
                    const isExpanded = expandedKbIndex === idx;
                    const liveCard = kbTeachingCards[entry.error_name];

                    return (
                      <div
                        key={idx}
                        className="glass-card rounded-2xl border border-[var(--border)] overflow-hidden transition-all duration-300"
                      >
                        {/* Summary Header */}
                        <div
                          onClick={() => {
                            setExpandedKbIndex(isExpanded ? null : idx);
                            if (!isExpanded) {
                              fetchKbTeachingCard(entry.error_name);
                            }
                          }}
                          className="p-4 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--border)]"
                        >
                          <div>
                            <span className="text-[9px] bg-indigo-950/60 text-indigo-400 border border-indigo-900/50 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                              {entry.error_category}
                            </span>
                            <h4 className="text-sm font-black font-mono text-slate-100 mt-1.5 break-all">
                              {entry.error_name}
                            </h4>
                          </div>
                          <span className="text-slate-500 text-xs transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                        </div>

                        {/* Collapsed/Expanded Body */}
                        {isExpanded && (
                          <div className="p-5 space-y-4 animate-scale-in">
                            {/* Root cause */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-500">Root Cause</span>
                              <p className="text-[12px] text-slate-200 font-medium font-sans leading-relaxed">{entry.root_cause}</p>
                            </div>

                            {/* Beginner Explanation */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-400">Conceptual Explanation</span>
                              <div className="text-[12px] text-slate-300 font-medium font-sans leading-relaxed">
                                {parseMarkdownToReact(entry.beginner_explanation)}
                              </div>
                            </div>

                            {/* Recommendations checklist */}
                            {entry.fix_recommendations && entry.fix_recommendations.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400">Recommendations & Fixes</span>
                                <ul className="space-y-1">
                                  {entry.fix_recommendations.map((rec, rIdx) => (
                                    <li key={rIdx} className="flex gap-2 items-start text-[11px] text-slate-300 font-medium">
                                      <span className="text-emerald-500 shrink-0">✓</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Prevention strategies */}
                            {entry.prevention_strategies && entry.prevention_strategies.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-400">Prevention Techniques</span>
                                <ul className="space-y-1">
                                  {entry.prevention_strategies.map((prev, pIdx) => (
                                    <li key={pIdx} className="flex gap-2 items-start text-[11px] text-slate-300 font-medium">
                                      <span className="text-rose-500 shrink-0">⚠️</span>
                                      <span>{prev}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Live AI Concept deep dive card */}
                            {loadingKbCard === entry.error_name ? (
                              <div className="flex justify-center items-center py-4">
                                <span className="w-5 h-5 rounded-full border-2 border-t-transparent border-[var(--accent)] animate-spin"></span>
                              </div>
                            ) : liveCard ? (
                              <div className="p-4 rounded-xl border border-yellow-900/30 bg-yellow-950/5 space-y-3 animate-scale-in">
                                <div className="flex justify-between items-center border-b border-yellow-900/20 pb-1.5">
                                  <h5 className="text-[10px] font-mono font-black uppercase text-yellow-400/80">AI Educator Concept Deep-Dive</h5>
                                  <span className="text-[8px] bg-yellow-900/60 text-yellow-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">{liveCard.difficulty_level}</span>
                                </div>
                                <div className="space-y-1 text-[12px] text-slate-300 font-medium">
                                  <h6 className="font-bold text-slate-200 text-xs">Concept: {liveCard.concept_title}</h6>
                                  <div className="mt-1 leading-relaxed">
                                    {parseMarkdownToReact(liveCard.why_it_happened)}
                                  </div>
                                </div>
                                {liveCard.underlying_concepts && liveCard.underlying_concepts.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {liveCard.underlying_concepts.map((uc: string, uIdx: number) => (
                                      <span key={uIdx} className="text-[8px] font-mono bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 px-1.5 py-0.5 rounded">
                                        ⚛️ {uc}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {/* Load in editor action */}
                            <div className="pt-3 border-t border-[var(--border)] flex justify-end">
                              <button
                                onClick={() => {
                                  setErrorInput(entry.error_name);
                                  setActiveSubTab("analyze");
                                  addLog(`Loaded '${entry.error_name}' concept into debugger input.`, "info");
                                }}
                                className="text-[9px] font-mono font-bold tracking-wider uppercase text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-900/40 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                              >
                                📋 Copy to Debugger
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-8 border border-[var(--border)] text-center">
                  <p className="text-xs font-mono text-slate-400">No knowledge base articles found in this category.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
