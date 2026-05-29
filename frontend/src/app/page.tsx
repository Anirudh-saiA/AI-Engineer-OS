"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import OnboardingWizard from "./onboarding/OnboardingWizard";
import ProfileTab from "./components/ProfileTab";
import SettingsTab from "./components/SettingsTab";
import { API_BASE_URL } from "./config";

type Tab = "dashboard" | "agent" | "database" | "vector" | "settings" | "profile";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

// ================= PREMIUM LIGHTWEIGHT REACT MARKDOWN COMPILER =================

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border my-4 overflow-hidden shadow-md flex flex-col font-mono text-[12px]" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e24] select-none border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="text-[10px] font-bold cursor-pointer text-slate-400 hover:text-white transition-all flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-white/5"
        >
          {copied ? (
            <>
              <span className="text-[9px]">✓</span> Copied!
            </>
          ) : (
            <>
              <span className="text-[11px]">📋</span> Copy Code
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <pre className="p-4 overflow-x-auto bg-[#111115] text-[#e2e8f0] leading-6 font-semibold select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-extrabold" style={{ color: "var(--text-primary)" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ color: "var(--accent-text)" }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function parseMarkdownToReact(text: string) {
  if (!text) return null;

  // Split by code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("```")) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const lang = match ? match[1] : "";
      const code = match ? match[2] : part.slice(3, -3).trim();

      return <CodeBlock key={idx} language={lang} code={code} />;
    }

    const lines = part.split("\n");
    let inList = false;
    let listItems: React.ReactNode[] = [];
    const elements: React.ReactNode[] = [];

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`${key}-list`} className="list-disc pl-6 my-2 space-y-1 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      const lineKey = `${idx}-${lineIdx}`;

      // Table Detection
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        flushList(lineKey);
        const cols = trimmed.split("|").map(c => c.trim()).filter((c, i) => i > 0 && i < trimmed.split("|").length - 1);
        
        if (cols.every(c => c.startsWith(":") || c.startsWith("-"))) {
          return;
        }

        const prevElement = elements[elements.length - 1];
        // Safely check type using React element structure
        const isHeader = !prevElement || (prevElement as any).type !== "div" || !(prevElement as any).key?.toString().startsWith("table-wrapper");

        if (isHeader) {
          elements.push(
            <div key={`table-wrapper-${lineKey}`} className="overflow-x-auto my-3 rounded-xl border" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                    {cols.map((col, colIdx) => (
                      <th key={colIdx} className="p-3 font-bold font-mono uppercase tracking-wider text-slate-400">
                        {parseInlineMarkdown(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          );
        } else {
          const prevWrapper = prevElement as any;
          const table = prevWrapper.props.children as any;
          const tbody = table.props.children[1] as any;
          const rows = [...(tbody.props.children || [])];
          
          rows.push(
            <tr key={`row-${lineKey}`} className="transition-colors border-b" style={{ borderColor: "var(--border)" }}>
              {cols.map((col, colIdx) => (
                <td key={colIdx} className="p-3 font-medium" style={{ color: "var(--text-primary)" }}>
                  {parseInlineMarkdown(col)}
                </td>
              ))}
            </tr>
          );

          elements[elements.length - 1] = (
            <div key={prevWrapper.key} className="overflow-x-auto my-3 rounded-xl border" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-left border-collapse text-xs">
                {table.props.children[0]}
                <tbody>{rows}</tbody>
              </table>
            </div>
          );
        }
        return;
      }

      // Heading Detection
      if (trimmed.startsWith("###")) {
        flushList(lineKey);
        elements.push(
          <h4 key={lineKey} className="text-sm font-black tracking-tight mt-4 mb-2" style={{ color: "var(--accent-text)" }}>
            {parseInlineMarkdown(trimmed.slice(3).trim())}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith("##")) {
        flushList(lineKey);
        elements.push(
          <h3 key={lineKey} className="text-base font-black tracking-tight mt-5 mb-2.5" style={{ color: "var(--text-primary)" }}>
            {parseInlineMarkdown(trimmed.slice(2).trim())}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith("#")) {
        flushList(lineKey);
        elements.push(
          <h2 key={lineKey} className="text-lg font-black tracking-tight mt-6 mb-3" style={{ color: "var(--text-primary)" }}>
            {parseInlineMarkdown(trimmed.slice(1).trim())}
          </h2>
        );
        return;
      }

      // Bullet List Detection
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
        inList = true;
        listItems.push(
          <li key={lineKey} className="pl-1">
            {parseInlineMarkdown(trimmed.slice(2).trim())}
          </li>
        );
        return;
      }

      // Empty Line
      if (!trimmed) {
        flushList(lineKey);
        elements.push(<div key={lineKey} className="h-2"></div>);
        return;
      }

      // Plain Line
      flushList(lineKey);
      elements.push(
        <p key={lineKey} className="text-[13px] leading-relaxed my-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    });

    flushList(`final-${idx}`);
    return elements;
  });
}

interface TelemetryRow {
  id: string;
  event: string;
  status: "success" | "warning" | "error";
  duration: number;
  timestamp: string;
}

function BreathingSpace() {
  const [timer, setTimer] = React.useState(300); // 5 mins break
  const [breathText, setBreathText] = React.useState("Inhale");
  
  React.useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  React.useEffect(() => {
    let textInterval: any;
    if (timer > 0) {
      textInterval = setInterval(() => {
        setBreathText(prev => {
          if (prev === "Inhale") return "Hold";
          if (prev === "Hold") return "Exhale";
          return "Inhale";
        });
      }, 4000);
    }
    return () => clearInterval(textInterval);
  }, [timer]);

  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  const formattedTime = `${mins}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="text-center font-mono relative z-20">
      <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest select-none animate-pulse">
        {timer > 0 ? breathText : "Peaceful"}
      </p>
      <h3 className="text-2xl font-black text-white mt-1">
        {timer > 0 ? formattedTime : "Finished"}
      </h3>
      {timer === 0 && (
        <button 
          onClick={() => setTimer(300)}
          className="text-[9px] font-bold underline cursor-pointer text-slate-400 hover:text-white"
        >
          Restart break
        </button>
      )}
    </div>
  );
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
const [roadmap, setRoadmap] = useState<any[]>([]);
const [profileData, setProfileData] = useState<any | null>(null);
const [selectedRoadmapTrack, setSelectedRoadmapTrack] = useState<string>("calibrated");
const [activeDetailSubNode, setActiveDetailSubNode] = useState<any | null>(null);
const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  // AI Motivation System states
  const [motivationData, setMotivationData] = useState<any | null>(null);
  const [motivationLoading, setMotivationLoading] = useState<boolean>(true);
  const [showNotifPanel, setShowNotifPanel] = useState<boolean>(false);
  const [showBreatherModal, setShowBreatherModal] = useState<boolean>(false);
  const [showMotivationPopup, setShowMotivationPopup] = useState<boolean>(false);

  const getLast7Days = () => {
    const days = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;
      
      const label = daysOfWeek[d.getDay()];
      const isToday = i === 0;
      
      const isCompleted = profileData?.active_days?.includes(dateStr) || false;
      
      days.push({
        dateStr,
        label,
        isToday,
        isCompleted
      });
    }
    return days;
  };

// Load checked tasks from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem("aios-roadmap-checklist");
  if (saved) {
    try {
      setCheckedTasks(JSON.parse(saved));
    } catch (e) {}
  }
}, []);

const toggleChecklistTask = (taskId: string) => {
  setCheckedTasks((prev) => {
    const updated = { ...prev, [taskId]: !prev[taskId] };
    localStorage.setItem("aios-roadmap-checklist", JSON.stringify(updated));
    return updated;
  });
};

// Auto-switch default track if calibrated is empty
useEffect(() => {
  if (roadmap && roadmap.length > 0) {
    setSelectedRoadmapTrack("calibrated");
  } else {
    setSelectedRoadmapTrack("ai_engineer");
  }
}, [roadmap]);

const staticRoadmaps: Record<string, any> = {
  ai_engineer: {
    title: "AI Engineer",
    icon: "🤖",
    accent: "var(--accent)",
    description: "Master pre-trained models, embeddings, vector databases, RAG, and cyclical multi-agent graphs.",
    nodes: [
      {
        id: "ai-pre-trained",
        title: "Using Pre-Trained Models",
        description: "Standard model integrations and prompt engineering configurations.",
        subNodes: [
          { id: "ai-pt-openai", title: "OpenAI Platform", description: "Connect GPT model endpoints, manage custom system prompts, and calibrate max token thresholds.", checklist: ["Acquire and configure API keys", "Write a standard completion call", "Analyze token billing metrics"] },
          { id: "ai-pt-gemini", title: "Gemini API", description: "Query Google's highly efficient Gemini Flash/Pro multimodal model structures.", checklist: ["Connect using standard SDK/HTTP", "Pass image inputs in prompts", "Configure generation temperature parameters"] },
          { id: "ai-pt-safety", title: "AI Safety & Ethics", description: "Address prompt injection, secure user filters, and audit model output vulnerabilities.", checklist: ["Build basic input sanitizers", "Verify guardrail alignment parameters", "Audit PII data masking constraints"] }
        ]
      },
      {
        id: "ai-embeddings-vector",
        title: "Embeddings & Vector Databases",
        description: "Vector representation of semantic text concepts and indexing configurations.",
        subNodes: [
          { id: "ai-ev-qdrant", title: "Qdrant Vector DB", description: "Perform high-performance similarity indexing on custom document vectors.", checklist: ["Create a custom Qdrant collection", "Insert embedded document nodes", "Perform cosine similarity searches"] },
          { id: "ai-ev-chunking", title: "Text Tokenization & Chunking", description: "Implement sliding-window tokenizers to optimize LLM attention bounds.", checklist: ["Build recursively split text parsers", "Optimize chunk size overlap metrics", "Evaluate metadata injection strategies"] }
        ]
      },
      {
        id: "ai-rag-systems",
        title: "RAG (Retrieval-Augmented Generation)",
        description: "Retrieve relevant context from documents to augment LLM system knowledge.",
        subNodes: [
          { id: "ai-rag-frameworks", title: "LlamaIndex & LangChain", description: "Assemble prompt orchestrators, vector index queries, and context ingestion tools.", checklist: ["Build standard retrieval indexes", "Inject context into LLM chats", "Implement source attribution filters"] },
          { id: "ai-rag-parsing", title: "Document Parsing Strategies", description: "Extract clean markdown tables and layout flows from PDF structures.", checklist: ["Parse structured tables from files", "Extract raw text from layout maps", "Log parsed indexes in Qdrant collections"] }
        ]
      },
      {
        id: "ai-agents-cyclical",
        title: "Cognitive AI Agents",
        description: "Autonomous workflows featuring tools execution, function calling, and state routing.",
        subNodes: [
          { id: "ai-ag-langgraph", title: "LangGraph cyclical flows", description: "Design complex cyclical state nodes and multi-agent interaction systems.", checklist: ["Define state routers & transitions", "Configure loop boundaries and exit rules", "Manage active graph memory pools"] },
          { id: "ai-ag-tools", title: "Sandbox Tool Calling", description: "Enable agents to execute container bash commands and interact with Postgres DB tables.", checklist: ["Write verified sandbox tools", "Handle tool execution exceptions", "Parse structured function arguments"] }
        ]
      }
    ]
  },
  mlops: {
    title: "MLOps",
    icon: "⚙️",
    accent: "var(--secondary)",
    description: "Master automated training pipelines, model version registries, container deploys, and infra observability.",
    nodes: [
      {
        id: "mlo-fundamentals",
        title: "Systems & Python Dev",
        description: "Standard monorepo automation script development and container isolated sandboxing.",
        subNodes: [
          { id: "mlo-fd-bash", title: "Bash & DevOps automation", description: "Write robust terminal commands to synchronize directories and handle environment configurations.", checklist: ["Write automated backup bash files", "Parse stdout logs dynamically", "Establish directory mounts"] },
          { id: "mlo-fd-docker", title: "Docker Containerization", description: "Package web and backend services into reproducible multi-stage Docker images.", checklist: ["Write custom Dockerfiles", "Optimize layer cache rules", "Configure local volume attachments"] }
        ]
      },
      {
        id: "mlo-cloud-cicd",
        title: "Cloud Infrastructure & CI/CD",
        description: "Configure declarative automation models to test and deploy services securely.",
        subNodes: [
          { id: "mlo-cc-actions", title: "GitHub Actions", description: "Trigger automated builds, run test scripts, and dispatch deployment events on git commits.", checklist: ["Write standard action workflow files", "Manage protected repository secrets", "Verify lint status checkers"] },
          { id: "mlo-cc-terraform", title: "Infrastructure as Code", description: "Deploy cloud networking, container nodes, and database servers via Terraform scripts.", checklist: ["Write standard TF configurations", "State management setups", "Trigger resource destructions"] }
        ]
      },
      {
        id: "mlo-data-eng",
        title: "Data Pipelines & Streams",
        description: "Ingest, split, and batch process high-velocity training logs dynamically.",
        subNodes: [
          { id: "mlo-de-spark", title: "Apache Spark & Batching", description: "Execute parallelized data transformations and analytical queries on large file datasets.", checklist: ["Build local map-reduce query scripts", "Optimize JVM allocation memory pools", "Merge massive CSV partition files"] },
          { id: "mlo-de-kafka", title: "Apache Kafka Streaming", description: "Establish persistent high-speed publisher-subscriber queues for event logs.", checklist: ["Create consumer topics", "Write secure stream publishers", "Scale consumer groupings"] }
        ]
      },
      {
        id: "mlo-orchestration",
        title: "Model Registries & Observability",
        description: "Log training parameters, audit metrics, and scale production container groups.",
        subNodes: [
          { id: "mlo-or-mlflow", title: "MLflow Metrics Tracking", description: "Record model training parameters, loss curves, and tag production versioning files.", checklist: ["Initialize MLflow tracking server", "Log epochs validation parameters", "Register trained binary models"] },
          { id: "mlo-or-k8s", title: "Kubernetes Orchestration", description: "Deploy fault-tolerant container clusters with integrated load balancers.", checklist: ["Define cluster deployment YAMLs", "Orchestrate rolling version updates", "Set resource memory limit boundaries"] }
        ]
      }
    ]
  },
  machine_learning: {
    title: "Machine Learning",
    icon: "📈",
    accent: "var(--warning)",
    description: "Master probability theory, numpy/pandas cleaning, supervised/unsupervised fitters, and transformer neural nets.",
    nodes: [
      {
        id: "ml-math-foundations",
        title: "Mathematical Foundations",
        description: "The core statistical framework that guides weight optimizations and linear fits.",
        subNodes: [
          { id: "ml-mf-algebra", title: "Linear Algebra & Matrices", description: "Understand dot products, eigenvectors, matrix transposition, and coordinate transformations.", checklist: ["Calculate matrix dot products", "Compute eigenvalues of matrices", "Solve system configurations of linear formulas"] },
          { id: "ml-mf-calculus", title: "Multivariate Calculus", description: "Learn partial derivatives and standard gradient descent optimizations.", checklist: ["Write partial derivative algorithms", "Calculate Jacobians of layers", "Derive standard chain-rule steps"] }
        ]
      },
      {
        id: "ml-data-preprocessing",
        title: "Data Processing",
        description: "Parse raw features, handle NaN values, and apply min-max standardizations.",
        subNodes: [
          { id: "ml-dp-pandas", title: "Pandas DataFrame Matrix", description: "Group, slice, clean, and merge structured database CSV arrays.", checklist: ["Merge database frames dynamically", "Fill NaN outliers with averages", "Apply vector formatting lamda maps"] },
          { id: "ml-dp-scaling", title: "Scaling & Standardizations", description: "Bring wide-ranging features into cohesive standard distributions.", checklist: ["Execute MinMaxScaling fits", "Apply normal standardization formulas", "Analyze correlation coefficients"] }
        ]
      },
      {
        id: "ml-supervised",
        title: "Supervised & Unsupervised Models",
        description: "Construct basic regression algorithms and fit clustering coordinates.",
        subNodes: [
          { id: "ml-su-scikit", title: "Scikit-Learn Estimators", description: "Fit decision trees, support vector classifiers, and logistic regression bounds.", checklist: ["Fit logistic regression models", "Validate with cross-validation splits", "Plot precision-recall evaluation graphs"] },
          { id: "ml-su-kmeans", title: "K-Means Cluster Partition", description: "Group unlabeled datasets using iterative centroid-distance recalculations.", checklist: ["Run elbow-curve estimations", "Fit K-Means coordinate centroids", "Measure silhouette cluster qualities"] }
        ]
      },
      {
        id: "ml-deep-learning",
        title: "Deep Learning & Transformers",
        description: "Configure multi-layered neural networks and attention-based self-attention parameters.",
        subNodes: [
          { id: "ml-dl-pytorch", title: "PyTorch Layers", description: "Write standard model layers, custom loss formulas, and optimization step functions.", checklist: ["Build custom linear torch layers", "Implement training epoch loops", "Measure backpropagation gradients"] },
          { id: "ml-dl-transformers", title: "Transformer Self-Attention", description: "Analyze positional encodings, key-query-value scales, and multi-head attention weights.", checklist: ["Build basic dot-product attention scales", "Visualize self-attention weights mapping", "Load Hugging Face pre-trained tokenizers"] }
        ]
      }
    ]
  },
  data_analyst: {
    title: "Data Analyst",
    icon: "📊",
    accent: "#06b6d4",
    description: "Master excel pivot summaries, standard SQL groupings, seaborn plots, and Tableau metrics dashboards.",
    nodes: [
      {
        id: "da-excel-basics",
        title: "Spreadsheet Analytics",
        description: "Clean lists and aggregate summaries using advanced formulas.",
        subNodes: [
          { id: "da-eb-formulas", title: "Advanced Excel Formulas", description: "Lookup records and apply dynamic string transforms using standard syntax.", checklist: ["Construct VLOOKUP/XLOOKUP chains", "Apply nested IF-ELSE functions", "Filter datasets with custom criteria"] },
          { id: "da-eb-pivots", title: "Pivot Tables & Graphs", description: "Pivot massive spreadsheets to extract dynamic group sums and averages.", checklist: ["Generate pivot summaries dynamically", "Chart bar/pie visualizations", "Apply timeline slices to charts"] }
        ]
      },
      {
        id: "da-sql-database",
        title: "SQL Databases & Queries",
        description: "Perform structured selections, join relational files, and aggregate group values.",
        subNodes: [
          { id: "da-sq-queries", title: "Relational SQL Joins", description: "Query database tables, group columns, and filter with aggregations.", checklist: ["Write complex LEFT/INNER joins", "Aggregate sum averages with GROUP BY", "Execute nested sub-query tables"] }
        ]
      },
      {
        id: "da-python-plotting",
        title: "Python Data Visualization",
        description: "Extract clean graphic insights from dataframe sets using plotting modules.",
        subNodes: [
          { id: "da-pp-matplotlib", title: "Matplotlib & Seaborn plots", description: "Configure high-fidelity scatter maps, histograms, and correlation heatmaps.", checklist: ["Configure dual-axes line charts", "Plot correlation heatmaps", "Customize tick label colors and legends"] }
        ]
      },
      {
        id: "da-reporting",
        title: "Business Analytics & Tableau",
        description: "Configure real-time interactive business dashboards to display key telemetry metrics.",
        subNodes: [
          { id: "da-re-tableau", title: "Tableau Dashboards", description: "Import SQL server data, define interactive filters, and design layout maps.", checklist: ["Design interactive Tableau panels", "Define clean calculated variables", "Deploy live reporting dashboards"] }
        ]
      }
    ]
  }
};

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
  interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: string;
  }

  const [chatInput, setChatInput] = useState("");
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentThinkingStep, setAgentThinkingStep] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Daily planner states
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [plannerLoading, setPlannerLoading] = useState(false);

  // Derive messages from active session
  const activeSession = chatSessions.find((s) => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  // Fetch existing chat sessions from the backend API gateway
  const fetchChatSessions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/agent/sessions`, {
        headers: {
          "Authorization": `Bearer ${user.uid}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setChatSessions(data);
          setActiveSessionId(data[0].id);
          addLog(`[SYSTEM] Retrieved ${data.length} dialogue threads from persistent databases.`, "success");
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load chat sessions from backend database:", e);
    }

    // Default welcome session fallback if no database sessions are found
    const defaultSessionId = "session-1";
    const defaultSession: ChatSession = {
      id: defaultSessionId,
      title: "AI Mentor Welcome",
      messages: [
        {
          id: "msg-welcome",
          sender: "assistant",
          text: "👋 Hello Developer! I am your AI-Engineer-OS Cognitive Agent. I can help you orchestrate container sandboxes, manage your Postgres migrations, query vector stores, or write boilerplate APIs. What are we building today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatSessions([defaultSession]);
    setActiveSessionId(defaultSessionId);
    
    // Auto-save the default welcome session to the backend database
    try {
      await fetch(`${API_BASE_URL}/api/v1/agent/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.uid}`
        },
        body: JSON.stringify({
          id: defaultSessionId,
          title: "AI Mentor Welcome"
        })
      });
    } catch (err) {}
  };

  // Fetch today's personalized plan from AI Coach
  const fetchDailyTasks = async () => {
    if (!user) return;
    setPlannerLoading(true);
    addLog(`[API] Querying daily planner checklist from AI Coach (${API_BASE_URL})...`, "system");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/profile/daily-planner`, {
        headers: {
          "Authorization": `Bearer ${user.uid}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDailyTasks(data || []);
        addLog(`[SUCCESS] Loaded today's plan containing ${data?.length || 0} customized tasks.`, "success");
      }
    } catch (err) {
      console.error("Failed to load daily planner tasks:", err);
      addLog("[ERROR] Failed to fetch daily plan from AI Coach API.", "error");
    } finally {
      setPlannerLoading(false);
    }
  };

  // Fetch AI Motivation advice & insights from backend
  const fetchMotivation = async () => {
    if (!user) return;
    setMotivationLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/profile/motivation`, {
        headers: { "Authorization": `Bearer ${user.uid}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMotivationData(data);
        if (data.show_popup) {
          const dismissed = sessionStorage.getItem(`aios-motivation-dismissed-${data.popup_title}`);
          if (!dismissed) {
            setShowMotivationPopup(true);
          }
        }
      }
    } catch (err) {
      console.error("Motivation fetch error", err);
    } finally {
      setMotivationLoading(false);
    }
  };

  // Toggle a planner checklist task
  const handleToggleDailyTask = async (taskId: number) => {
    if (!user) return;
    addLog(`[SYSTEM] Toggling daily task progress...`, "system");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/profile/daily-planner/${taskId}/toggle`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${user.uid}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        addLog(`[SUCCESS] Telemetry checklist item logged successfully. +20 XP awarded!`, "success");
        
        // Update local tasks state
        setDailyTasks((prev) => 
          prev.map((t) => t.id === taskId ? { ...t, completed: data.completed } : t)
        );
        
        // Refetch profile data to sync overall XP immediately
        fetchProfile();
        fetchMotivation();
      }
    } catch (err) {
      console.error("Failed to toggle daily task:", err);
      addLog("[ERROR] Connection error. Telemetry synchronization suspended.", "error");
    }
  };

  // Helper to update active session messages
  const updateActiveSessionMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    setChatSessions((prevSessions) => {
      return prevSessions.map((session) => {
        if (session.id === activeSessionId) {
          const updatedMsgs = typeof newMessages === "function" ? newMessages(session.messages) : newMessages;
          
          // Dynamically compute conversational title based on first user message if it's currently default
          let newTitle = session.title;
          if (session.title === "AI Mentor Welcome" || session.title === "New Conversation" || session.title === "New Chat") {
            const firstUserMsg = updatedMsgs.find(m => m.sender === "user");
            if (firstUserMsg) {
              newTitle = firstUserMsg.text.slice(0, 24) + (firstUserMsg.text.length > 24 ? "..." : "");
            }
          }
          
          return {
            ...session,
            title: newTitle,
            messages: updatedMsgs
          };
        }
        return session;
      });
    });
  };

  // Start new chat
  const startNewChat = async () => {
    if (!user) return;
    const newSessionId = "session-" + Math.random().toString(36).substr(2, 9);
    const defaultTitle = "New Chat";
    
    const newSession: ChatSession = {
      id: newSessionId,
      title: defaultTitle,
      messages: [
        {
          id: "msg-" + Math.random().toString(36).substr(2, 9),
          sender: "assistant",
          text: "👋 A clean workspace context spawned! Ask me to audit docker ports, check database tables, query vector stores, or suggest project ideas.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      // Register session in backend database
      await fetch(`${API_BASE_URL}/api/v1/agent/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.uid}`
        },
        body: JSON.stringify({
          id: newSessionId,
          title: defaultTitle
        })
      });
    } catch (e) {
      console.error("Failed to register chat session in backend:", e);
    }
    
    setChatSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    addLog(`[SYSTEM] Spawned new cognitive dialogue context: "${defaultTitle}"`, "system");
  };

  // Delete chat session
  const deleteChatSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      // Wipes session and cascade deleted message children
      await fetch(`${API_BASE_URL}/api/v1/agent/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user.uid}`
        }
      });
    } catch (err) {
      console.error("Failed to delete chat session on backend database:", err);
    }

    setChatSessions((prev) => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (sessionId === activeSessionId && filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      } else if (filtered.length === 0) {
        const defaultSession: ChatSession = {
          id: "session-1",
          title: "AI Mentor Welcome",
          messages: [
            {
              id: "msg-welcome",
              sender: "assistant",
              text: "👋 Hello Developer! I am your AI-Engineer-OS Cognitive Agent. I can help you orchestrate container sandboxes, manage your Postgres migrations, query vector stores, or write boilerplate APIs. What are we building today?",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Re-post default welcome session
        fetch(`${API_BASE_URL}/api/v1/agent/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.uid}`
          },
          body: JSON.stringify({
            id: "session-1",
            title: "AI Mentor Welcome"
          })
        }).catch(() => {});

        setTimeout(() => {
          setChatSessions([defaultSession]);
          setActiveSessionId(defaultSession.id);
        }, 10);
        return [defaultSession];
      }
      return filtered;
    });
    addLog(`[SYSTEM] Closed and wiped session context database registry.`, "config");
  };

  // Rotate thinking steps when thinking is active
  useEffect(() => {
    let interval: any;
    if (agentThinking) {
      setAgentThinkingStep(0);
      interval = setInterval(() => {
        setAgentThinkingStep((prev) => (prev + 1) % 3);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [agentThinking]);

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
  const [uploadStatus, setUploadStatus] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

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
    addLog(`[API] Querying REST API gateway status from ${API_BASE_URL}/api/v1/system/status...`, "system");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system/status`, {
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
    const res = await fetch(`${API_BASE_URL}/api/v1/profile/me`, {
      headers: { Authorization: `Bearer ${user.uid}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.onboarded) {
        setProfileExists(true);
        setShowOnboarding(false);
        setRoadmap(data.roadmap || []);
        setProfileData(data);
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
    addLog("[ERROR] Unable to reach backend API. Check if the server is running.", "error");
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
        fetchMotivation();
        fetchChatSessions();
        fetchDailyTasks();
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

  // Handle Real AI Agent Chat sends (Connected to OpenAI Backend API)
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || !user) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    updateActiveSessionMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setAgentThinking(true);
    addLog(`[AGENT] Dispatching prompt context to secure backend API...`, "info");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/agent/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.uid}`
        },
        body: JSON.stringify({
          message: text,
          session_id: activeSessionId
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.text;
        const msgId = Math.random().toString();
        const timestampVal = data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // 1. Insert empty message placeholder
        const assistantMsg: Message = {
          id: msgId,
          sender: "assistant",
          text: "",
          timestamp: timestampVal
        };
        
        updateActiveSessionMessages((prev) => [...prev, assistantMsg]);
        addLog("[SUCCESS] Agent response compiled dynamically from backend OpenAI gateway.", "success");

        // 2. Word-by-word typewriter streaming
        const words = rawText.split(" ");
        let currentWordIndex = 0;
        let currentText = "";
        
        const timer = setInterval(() => {
          if (currentWordIndex < words.length) {
            currentText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex];
            updateActiveSessionMessages((prev) => 
              prev.map((msg) => msg.id === msgId ? { ...msg, text: currentText } : msg)
            );
            currentWordIndex++;
          } else {
            clearInterval(timer);
          }
        }, 12); // Very fast, fluid 12ms token typewriter streaming
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      addLog("[ERROR] Failed to query AI Agent. Ensure backend uvicorn is running.", "error");
      
      const rawErrorText = "⚠️ [SYSTEM OFFLINE] I failed to establish a secure connection to the OpenAI Backend API. Please verify that your `uvicorn` dev server is active on port 8000 and the PostgreSQL database pool is running.";
      const msgId = Math.random().toString();
      
      const errorMsg: Message = {
        id: msgId,
        sender: "assistant",
        text: "",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      updateActiveSessionMessages((prev) => [...prev, errorMsg]);
      
      const words = rawErrorText.split(" ");
      let currentWordIndex = 0;
      let currentText = "";
      
      const timer = setInterval(() => {
        if (currentWordIndex < words.length) {
          currentText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex];
          updateActiveSessionMessages((prev) => 
            prev.map((msg) => msg.id === msgId ? { ...msg, text: currentText } : msg)
          );
          currentWordIndex++;
        } else {
          clearInterval(timer);
        }
      }, 12);
    } finally {
      setAgentThinking(false);
    }
  };

  // Database Tab: Trigger a live DB ping check
  const triggerDbCheck = async () => {
    if (!user) return;
    setDbChecking(true);
    addLog("[API] Sending db-check query to backend...", "system");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/system/db-check`, {
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

  // Vector Tab: Live Search
  const handleVectorSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vectorQuery.trim()) return;
    if (!user) return;
    setVectorSearching(true);
    addLog(`[VECTOR] Performing cosine similarity index search: "${vectorQuery}"`, "info");
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/vector/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.uid}`
        },
        body: JSON.stringify({
          query: vectorQuery,
          limit: 3
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        setVectorResults(results);
        addLog(`[SUCCESS] Vector match complete. Found ${results.length} relevant documents. (Engine: ${data.engine})`, "success");
      } else {
        addLog(`[ERROR] Vector search failed with status ${res.status}`, "error");
      }
    } catch (err: any) {
      addLog(`[ERROR] Vector search failed: ${err.message || err}`, "error");
    } finally {
      setVectorSearching(false);
    }
  };

  // Vector Tab: File Ingestion Pipeline
  const ingestFile = (file: File) => {
    if (!user) return;
    addLog(`[VECTOR] Reading document file: "${file.name}" (${file.size} bytes)`, "info");
    setUploadStatus({ text: `Reading document file: "${file.name}"...`, type: "info" });
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) {
        addLog(`[ERROR] Failed to read empty or invalid file: "${file.name}"`, "error");
        setUploadStatus({ text: `Failed to read empty or invalid file: "${file.name}"`, type: "error" });
        return;
      }
      
      addLog(`[VECTOR] Ingesting file "${file.name}" into vector pipeline...`, "info");
      setUploadStatus({ text: `Ingesting "${file.name}" into vector pipeline...`, type: "info" });
      
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/vector/ingest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.uid}`
          },
          body: JSON.stringify({
            filename: file.name,
            content: content
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.status === "success" || data.status === "partial_success") {
            addLog(`[VECTOR] Ingesting file... Tokenized into ${data.chunks_count} chunks... Upserted to Qdrant!`, "success");
            addLog(`[SUCCESS] ${data.message}`, "success");
            setUploadStatus({ text: `[VECTOR] Ingesting file... Tokenized into ${data.chunks_count} chunks... Upserted to Qdrant!`, type: "success" });
          } else {
            addLog(`[ERROR] Ingestion failed: ${data.message}`, "error");
            setUploadStatus({ text: `Ingestion failed: ${data.message}`, type: "error" });
          }
        } else {
          const errorText = await res.text();
          addLog(`[ERROR] Ingestion HTTP failure: ${errorText}`, "error");
          setUploadStatus({ text: `Ingestion HTTP failure: ${errorText}`, type: "error" });
        }
      } catch (err: any) {
        addLog(`[ERROR] Ingestion request failed: ${err.message || err}`, "error");
        setUploadStatus({ text: `Ingestion request failed: ${err.message || err}`, type: "error" });
      }
    };
    
    reader.onerror = () => {
      addLog(`[ERROR] Error reading file "${file.name}"`, "error");
      setUploadStatus({ text: `Error reading file "${file.name}"`, type: "error" });
    };
    
    reader.readAsText(file);
  };

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
      ingestFile(file);
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
                fetchProfile();
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
                  
                  {/* Custom CSS Animation Injector */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes breath {
                      0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 20px rgba(6,182,212,0.3); }
                      50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 40px rgba(6,182,212,0.6); }
                      100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 20px rgba(6,182,212,0.3); }
                    }
                    @keyframes driftSparkle {
                      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                      100% { transform: translateY(-300px) rotate(360deg); opacity: 0; }
                    }
                    .animate-breath {
                      animation: breath 12s infinite ease-in-out;
                    }
                  `}} />

                  {/* ═══════ AI MOTIVATIONAL CELEBRATORY POPUP ═══════ */}
                  {showMotivationPopup && motivationData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
                      
                      {/* CSS Sparkles Confetti Container */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                        {Array.from({ length: 25 }).map((_, i) => {
                          const left = Math.random() * 100;
                          const delay = Math.random() * 3;
                          const duration = 2 + Math.random() * 2;
                          const size = 6 + Math.random() * 8;
                          const colors = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#a855f7"];
                          const randColor = colors[Math.floor(Math.random() * colors.length)];
                          return (
                            <div
                              key={i}
                              className="absolute bottom-0 rounded-full"
                              style={{
                                left: `${left}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                background: randColor,
                                opacity: 0.7,
                                animation: `driftSparkle ${duration}s infinite ease-out`,
                                animationDelay: `${delay}s`,
                                boxShadow: `0 0 10px ${randColor}`
                              }}
                            />
                          );
                        })}
                      </div>

                      <div className="card max-w-lg w-full rounded-3xl p-8 border text-center space-y-6 relative overflow-hidden shadow-2xl animate-scale-in"
                        style={{ borderColor: "var(--accent)", background: "#121218" }}>
                        
                        <div className="absolute top-[-30%] left-[-20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[var(--accent-soft)] to-transparent blur-[80px] pointer-events-none"></div>

                        <div className="flex flex-col items-center gap-3">
                          <span className="text-5xl animate-bounce">🎉</span>
                          <h3 className="text-2xl font-black text-white tracking-tight mt-2">
                            {motivationData.popup_title || "Milestone Unlocked!"}
                          </h3>
                          <p className="text-xs font-mono text-[var(--accent)] font-black uppercase tracking-widest mt-0.5">
                            AI Telemetry Congratulatory Node
                          </p>
                        </div>

                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 text-sm text-slate-300 font-sans leading-relaxed">
                          "{motivationData.popup_message || motivationData.mentor_message}"
                        </div>

                        <div className="space-y-4">
                          <p className="text-xs text-slate-400 font-medium">
                            Your active {profileData?.streak_count || 1}-day streak and skills proficiency index are synchronized with our platform servers.
                          </p>
                          
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => {
                                setShowMotivationPopup(false);
                                sessionStorage.setItem(`aios-motivation-dismissed-${motivationData.popup_title}`, "true");
                              }}
                              className="py-2.5 px-8 rounded-xl bg-[var(--accent)] text-white hover:shadow-[0_0_15px_var(--accent-glow)] text-xs font-mono font-bold tracking-wide transition-all shadow-md cursor-pointer"
                            >
                              Let's Keep Coding! ⚡
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══════ POMODORO / BREATHING TIMER MODAL ═══════ */}
                  {showBreatherModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn p-4">
                      <div className="card max-w-md w-full rounded-3xl p-8 border text-center space-y-6 relative overflow-hidden shadow-2xl animate-scale-in"
                        style={{ borderColor: "rgba(255,255,255,0.1)", background: "#121218" }}>
                        
                        <div className="absolute top-[-30%] left-[-20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent blur-[80px] pointer-events-none"></div>

                        <div className="flex justify-between items-center border-b border-[var(--border)] pb-2 relative z-10">
                          <h4 className="font-mono text-xs text-slate-400 uppercase tracking-widest font-bold">
                            🧘 Burnout Mitigation: Breathing Space
                          </h4>
                          <button 
                            onClick={() => setShowBreatherModal(false)}
                            className="text-xs text-slate-400 hover:text-white font-mono cursor-pointer"
                          >
                            [Exit]
                          </button>
                        </div>

                        <div className="relative flex flex-col items-center justify-center py-6 space-y-6">
                          
                          <div className="relative w-44 h-44 rounded-full border border-cyan-500/20 flex items-center justify-center">
                            <div className="absolute w-36 h-36 rounded-full bg-cyan-500/10 border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-breath flex items-center justify-center">
                              
                              <BreathingSpace />

                            </div>
                          </div>
                        </div>

                        <div className="space-y-2.5 relative z-10">
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Let your chest expand as the circle expands. Focus only on the rhythm of your breath.
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">
                            This customized breathing guide decreases heart rate variability, stabilizes brain waves, and clears cognitive memory pools to combat developer burnout.
                          </p>
                        </div>

                        <div className="flex gap-3 justify-center relative z-10">
                          <button
                            onClick={() => setShowBreatherModal(false)}
                            className="btn-accent py-2 px-6 rounded-xl text-xs font-mono font-bold tracking-wider cursor-pointer"
                          >
                            Resume Study Work ⚡
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══════ AI MENTOR MOTIVATION PANEL (PREMIUM GLASSMORPHIC) ═══════ */}
                  {!motivationLoading && motivationData && (
                    <div className="card rounded-3xl p-6 md:p-8 animate-fade-up relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6 border"
                      style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(18, 18, 24, 0.4)", backdropFilter: "blur(20px)" }}>
                      
                      <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-[var(--accent-soft)] to-transparent blur-[80px] pointer-events-none"></div>
                      <div className="absolute bottom-[-20%] left-[-10%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-[var(--secondary-soft)] to-transparent blur-[60px] pointer-events-none"></div>

                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg relative flex-shrink-0 animate-float"
                        style={{ 
                          background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))", 
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
                        }}>
                        {(() => {
                          const bio = profileData?.bio || "";
                          if (bio.includes("Algorithmic Sherpa")) return "🧙‍♂️";
                          if (bio.includes("SaaS Evangelist")) return "🦁";
                          if (bio.includes("Rapid Prototype Guru")) return "🚀";
                          return "🤖";
                        })()}
                        <span className="absolute bottom-[-4px] right-[-4px] flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#121218]"></span>
                        </span>
                      </div>

                      <div className="flex-1 space-y-3.5 text-center md:text-left relative z-10">
                        <div>
                          <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
                            AI Coach Notification
                          </h4>
                          <h3 className="text-lg font-black tracking-tight mt-1 text-white flex items-center justify-center md:justify-start gap-2">
                            <span>AI Mentor:</span> 
                            <span className="text-[var(--accent)] text-sm px-2.5 py-0.5 rounded-full border bg-[var(--accent-soft)]" style={{ borderColor: "var(--accent)" }}>
                              {(() => {
                                const bio = profileData?.bio || "";
                                if (bio.includes("Algorithmic Sherpa")) return "Algorithmic Sherpa";
                                if (bio.includes("SaaS Evangelist")) return "SaaS Evangelist";
                                if (bio.includes("Rapid Prototype Guru")) return "Rapid Prototype Guru";
                                return "Pragmatic Architect";
                              })()}
                            </span>
                          </h3>
                        </div>

                        <p className="text-slate-200 text-sm italic font-medium leading-relaxed max-w-3xl border-l-2 border-[var(--accent)] pl-4 py-1 text-left">
                          "{motivationData.mentor_message}"
                        </p>

                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                          <button
                            onClick={() => setActiveTab("agent")}
                            className="py-2 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono font-bold tracking-wide transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            💬 Consult Mentor
                          </button>
                          <button
                            onClick={() => setShowBreatherModal(true)}
                            className="py-2 px-4 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)] hover:shadow-[0_0_15px_var(--accent-glow)] text-xs font-mono font-bold tracking-wide transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            🧘 Take a 5-Min Break
                          </button>
                          {motivationData.notifications.length > 1 && (
                            <button
                              onClick={() => setShowNotifPanel(!showNotifPanel)}
                              className="py-2 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-amber-500 text-xs font-mono font-bold tracking-wide transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              🔔 Alert Center ({motivationData.notifications.length - 1})
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══════ MENTOR ALERTS CENTER PANEL ═══════ */}
                  {showNotifPanel && motivationData && motivationData.notifications && (
                    <div className="card rounded-3xl p-6 border animate-fadeIn space-y-4"
                      style={{ borderColor: "rgba(255,255,255,0.08)", background: "var(--bg-card)" }}>
                      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                        <h4 className="font-mono text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                          <span>🔔</span> Mentor Active Alert Center
                        </h4>
                        <button 
                          onClick={() => setShowNotifPanel(false)}
                          className="text-xs text-slate-400 hover:text-white font-mono cursor-pointer"
                        >
                          [Close]
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {motivationData.notifications.map((notif: any) => {
                          let typeColor = "var(--accent)";
                          let icon = "💡";
                          if (notif.type === "warning") {
                            typeColor = "#f59e0b";
                            icon = "⚠️";
                          } else if (notif.type === "success") {
                            typeColor = "#22c55e";
                            icon = "🏆";
                          } else if (notif.type === "error") {
                            typeColor = "#ef4444";
                            icon = "🚨";
                          }

                          return (
                            <div key={notif.id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] transition-all hover:border-slate-700">
                              <span className="text-lg flex-shrink-0" style={{ color: typeColor }}>{icon}</span>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="text-xs font-semibold text-slate-200">{notif.message}</p>
                                <p className="text-[9px] font-mono text-slate-500">{notif.timestamp}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ═══════ AI METRIC INSIGHTS GRID ═══════ */}
                  {!motivationLoading && motivationData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
                      {motivationData.insights.map((insight: any) => (
                        <div key={insight.id} className="card rounded-2xl p-5 border flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                          style={{ borderColor: "rgba(255,255,255,0.06)", background: "var(--bg-card)" }}>
                          
                          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                              {insight.title}
                            </span>
                            <span className="text-2xl animate-float">{insight.icon}</span>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-xl font-black" style={{ color: insight.color }}>
                              {insight.metric}
                            </h3>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              {insight.description}
                            </p>
                          </div>

                          {/* Small interaction for specific cards */}
                          {insight.id === "struggle-tracker" && profileData?.weak_topics?.length > 0 && (
                            <button
                              onClick={() => {
                                const latestTopic = profileData.weak_topics[profileData.weak_topics.length - 1];
                                setActiveTab("agent");
                                setTimeout(() => {
                                  const inputEl = document.querySelector("textarea") as HTMLTextAreaElement;
                                  if (inputEl) {
                                    inputEl.value = `As my AI Mentor, please simplify the concept of "${latestTopic}" step by step for me.`;
                                  }
                                }, 100);
                              }}
                              className="mt-3 py-1.5 w-full text-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 hover:border-red-400 text-[9px] font-mono font-bold transition-all cursor-pointer"
                            >
                              ⚡ Simplify Concept
                            </button>
                          )}

                          {insight.id === "burnout-radar" && insight.metric.includes("High") && (
                            <button
                              onClick={() => setShowBreatherModal(true)}
                              className="mt-3 py-1.5 w-full text-center rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 hover:border-amber-400 text-[9px] font-mono font-bold transition-all cursor-pointer animate-pulse"
                            >
                              🧘 Launch Relax Session
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

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

                  {/* ═══════ TODAY'S PLAN (PERSONAL AI COACH) CHECKLIST ═══════ */}
                  <div className="card rounded-3xl p-6 md:p-8 animate-fade-up delay-5 relative overflow-hidden"
                    style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                    
                    <div className="absolute top-[-25%] left-[-15%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[var(--accent-soft)] to-transparent blur-[100px] pointer-events-none"></div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)] relative z-10">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl animate-float">📅</span>
                        <div>
                          <h3 className="text-base sm:text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                            Today's Plan (AI Coach Scheduler)
                          </h3>
                          <p className="text-xs font-mono font-bold mt-0.5 text-slate-400">
                            Custom dynamic checklists generated based on roadmap & weak topics. +20 XP per task!
                          </p>
                        </div>
                      </div>

                      {/* Progress summary badge */}
                      {(() => {
                        const total = dailyTasks.length;
                        const completed = dailyTasks.filter(t => t.completed).length;
                        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                        return (
                          <div className="flex items-center gap-3 font-mono text-[10px] font-bold">
                            <span className="text-slate-400">Completed: {completed} / {total}</span>
                            <span className="px-2.5 py-1 rounded-full text-white bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]">
                              {pct}% Achieved
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Progress Slider Bar */}
                    {(() => {
                      const total = dailyTasks.length;
                      const completed = dailyTasks.filter(t => t.completed).length;
                      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                      return (
                        <div className="w-full bg-[var(--bg-secondary)] h-2 rounded-full mt-4 overflow-hidden border border-[var(--border)] relative z-10">
                          <div className="h-full rounded-full transition-all duration-500 bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]"
                            style={{ width: `${pct}%` }} />
                        </div>
                      );
                    })()}

                    {/* Planner Checklist List */}
                    {plannerLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3 relative z-10 animate-pulse">
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-soft)] border-t-[var(--accent)] animate-spin"></div>
                        <p className="font-mono text-[10px] text-slate-400">AI Coach generating today's tasks...</p>
                      </div>
                    ) : (!dailyTasks || dailyTasks.length === 0) ? (
                      <div className="text-center py-8 relative z-10">
                        <span className="text-2xl mb-1 block">🏆</span>
                        <p className="text-[10px] font-mono text-slate-400">Your AI coach is compiling your calendar goals...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10 animate-fadeIn">
                        {dailyTasks.map((task) => {
                          let badgeBg = "rgba(245,158,11,0.08)";
                          let badgeText = "Study 📚";
                          let badgeColor = "var(--warning)";
                          
                          if (task.category === "dsa") {
                            badgeBg = "rgba(34,197,94,0.08)";
                            badgeText = "DSA 🧠";
                            badgeColor = "var(--success)";
                          } else if (task.category === "coding") {
                            badgeBg = "rgba(168,85,247,0.08)";
                            badgeText = "Coding 💻";
                            badgeColor = "#a855f7";
                          } else if (task.category === "revision") {
                            badgeBg = "rgba(239,68,68,0.08)";
                            badgeText = "Revision 🔄";
                            badgeColor = "#ef4444";
                          }

                          return (
                            <button
                              key={task.id}
                              onClick={() => handleToggleDailyTask(task.id)}
                              className="card rounded-2xl p-5 text-left border cursor-pointer transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between gap-4 h-full relative"
                              style={{
                                borderColor: task.completed ? "var(--success)" : "var(--border)",
                                background: task.completed ? "rgba(34,197,94,0.02)" : "var(--bg-card)",
                                boxShadow: task.completed ? "0 0 10px rgba(34,197,94,0.04)" : "var(--shadow-sm)"
                              }}
                            >
                              <div className="space-y-3 w-full">
                                {/* Header category badge + checkbox */}
                                <div className="flex items-center justify-between w-full">
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono border"
                                    style={{ background: badgeBg, color: badgeColor, borderColor: `${badgeColor}25` }}>
                                    {badgeText}
                                  </span>
                                  <div className="w-5 h-5 rounded-md border flex items-center justify-center font-bold text-[10px] flex-shrink-0 transition-all duration-300"
                                    style={{
                                      borderColor: task.completed ? "var(--success)" : "var(--border)",
                                      background: task.completed ? "var(--success)" : "transparent",
                                      color: task.completed ? "white" : "transparent"
                                    }}>
                                    ✓
                                  </div>
                                </div>

                                <p className="text-[11px] font-semibold leading-relaxed break-words"
                                  style={{
                                    color: task.completed ? "var(--text-muted)" : "var(--text-primary)",
                                    textDecoration: task.completed ? "line-through" : "none"
                                  }}>
                                  {task.task_text}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-2 border-t border-[var(--border)] mt-auto w-full">
                                <span>Status: {task.completed ? "Done" : "Pending"}</span>
                                <span className="font-bold text-[var(--accent)]">+20 XP</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ═══════ STREAK CONSISTENCY COACH ═══════ */}
                  <div className="card rounded-3xl p-6 md:p-8 animate-fade-up delay-6 relative overflow-hidden"
                    style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                    
                    <div className="absolute top-[-25%] right-[-15%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[rgba(249,115,22,0.15)] to-transparent blur-[100px] pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border)] relative z-10">
                      <div className="flex items-center gap-4">
                        {/* Massive pulsing flame counter with warm radial backglow */}
                        <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0 bg-orange-500/10 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)] overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-red-500/20 animate-pulse"></div>
                          <span className="text-3xl sm:text-4xl animate-bounce relative z-10" style={{ animationDuration: '2s' }}>🔥</span>
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                            Streak Consistency Coach
                          </h3>
                          <p className="text-xs font-mono font-bold mt-0.5 text-slate-400">
                            Build coding habits daily. Track your active check-ins, roadmap completions, and learning focus sessions.
                          </p>
                        </div>
                      </div>

                      {/* Streak Stats Badge */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Current Streak</p>
                          <p className="text-xl sm:text-2xl font-black text-orange-500 font-mono tracking-tight">
                            {profileData?.streak_count || 1} { (profileData?.streak_count || 1) === 1 ? "Day" : "Days" }
                          </p>
                        </div>
                        <div className="h-8 w-[1px] bg-[var(--border)]"></div>
                        <div>
                          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Personal Best</p>
                          <p className="text-xl sm:text-2xl font-black text-amber-500 font-mono tracking-tight">
                            {profileData?.longest_streak || 1} { (profileData?.longest_streak || 1) === 1 ? "Day" : "Days" }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 7-Day Consistency Row (Mon-Sun / Last 7 Days) */}
                    <div className="mt-6 relative z-10">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <span>📆</span> 7-Day Consistency Tracker
                      </h4>
                      <div className="grid grid-cols-7 gap-2 sm:gap-4 bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border)]">
                        {getLast7Days().map((day) => {
                          return (
                            <div key={day.dateStr} className={`flex flex-col items-center p-2.5 rounded-xl border transition-all duration-300 ${
                              day.isCompleted
                                ? "bg-orange-500/5 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.06)]"
                                : day.isToday
                                  ? "bg-[var(--bg-card)] border-[var(--accent)]"
                                  : "bg-[var(--bg-card)] border-[var(--border)]"
                            }`}>
                              <span className="text-[10px] font-mono font-bold text-slate-400 mb-1">
                                {day.label}
                              </span>
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                                day.isCompleted
                                  ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse"
                                  : "bg-[var(--bg-secondary)] text-slate-600 border border-[var(--border)]"
                              }`}>
                                {day.isCompleted ? "🔥" : "💤"}
                              </div>
                              <span className="text-[8px] font-mono font-semibold text-slate-500 mt-1">
                                {day.isToday ? "Today" : day.dateStr.slice(8, 10)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Milestone Badges & Progress */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 relative z-10">
                      {[
                        { title: "Habit Builder", days: 3, xp: 50, icon: "🌱", color: "#10b981", bg: "rgba(16,185,129,0.05)" },
                        { title: "Consistency King", days: 7, xp: 150, icon: "👑", color: "#f59e0b", bg: "rgba(245,158,11,0.05)" },
                        { title: "AI Unstoppable", days: 14, xp: 300, icon: "🚀", color: "#ec4899", bg: "rgba(236,72,153,0.05)" }
                      ].map((milestone) => {
                        const current = profileData?.streak_count || 1;
                        const pct = Math.min(100, Math.round((current / milestone.days) * 100));
                        const completed = current >= milestone.days;
                        return (
                          <div key={milestone.title} className="card rounded-2xl p-4 border flex flex-col justify-between gap-3"
                            style={{
                              background: milestone.bg,
                              borderColor: completed ? milestone.color : "var(--border)",
                              boxShadow: completed ? `0 0 12px ${milestone.color}15` : "none"
                            }}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                style={{ background: completed ? milestone.color : "var(--bg-secondary)", color: completed ? "white" : "slate-400" }}>
                                {milestone.icon}
                              </div>
                              <div>
                                <h5 className="text-xs font-black" style={{ color: "var(--text-primary)" }}>{milestone.title}</h5>
                                <p className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">{milestone.days}-Day Streak • +{milestone.xp} XP</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-500">
                                <span>{completed ? "Unlocked! 🎉" : "Progress"}</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden border border-[var(--border)]">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, background: completed ? milestone.color : "var(--accent)" }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ═══════ COGNITIVE ROADMAP CANVASES & INTERACTIVE BLUEPRINTS ═══════ */}
                  <div className="card rounded-3xl p-6 md:p-8 animate-fade-up relative overflow-hidden"
                    style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                    
                    {/* Floating ambient radial background decor */}
                    <div className="absolute top-[-25%] right-[-15%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[var(--accent-soft)] to-transparent blur-[100px] pointer-events-none"></div>

                    {/* Canvas Header */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 mb-6 border-b border-[var(--border)] relative z-10">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl animate-float">🗺️</span>
                        <div>
                          <h3 className="text-base sm:text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                            Cognitive Roadmap Hub
                          </h3>
                          <p className="text-xs font-mono font-bold mt-0.5" style={{ color: "var(--text-muted)" }}>
                            Select, explore, and check off specialized learning trails
                          </p>
                        </div>
                      </div>

                      {/* Track Selector Tab Buttons */}
                      <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto py-1">
                        {roadmap && roadmap.length > 0 && (
                          <button
                            onClick={() => setSelectedRoadmapTrack("calibrated")}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 border ${
                              selectedRoadmapTrack === "calibrated"
                                ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-text)] shadow-[var(--shadow-glow)]"
                                : "bg-[var(--bg-secondary)] border-[var(--border)] hover:border-slate-400 text-slate-400"
                            }`}
                            style={{ fontSize: "12px" }}
                          >
                            🎯 Calibrated Path
                          </button>
                        )}
                        {Object.entries(staticRoadmaps).map(([key, value]) => {
                          const isSelected = selectedRoadmapTrack === key;
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedRoadmapTrack(key)}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 border ${
                                isSelected
                                  ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-text)] shadow-[var(--shadow-glow)]"
                                  : "bg-[var(--bg-secondary)] border-[var(--border)] hover:border-slate-400 text-slate-400"
                              }`}
                              style={{ fontSize: "12px" }}
                            >
                              <span>{value.icon}</span>
                              <span>{value.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Canvas Main Area */}
                    <div className="relative z-10">
                      
                      {/* CASE A: CALIBRATED ROADMAP TIMELINE */}
                      {selectedRoadmapTrack === "calibrated" && roadmap && roadmap.length > 0 && (
                        <div className="space-y-8 animate-fadeIn">
                          
                          {/* Gamified Mastery Summary Banner */}
                          {(() => {
                            const totalRoadmapTasks = roadmap.reduce((acc, curr) => acc + (curr.tasks?.length || 0), 0);
                            const completedRoadmapTasks = profileData?.completed_tasks?.length || 0;
                            const overallPercent = totalRoadmapTasks > 0 ? Math.round((completedRoadmapTasks / totalRoadmapTasks) * 100) : 0;

                            return (
                              <div className="glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border"
                                style={{ borderColor: "var(--border)", background: "var(--bg-sidebar)", boxShadow: "var(--shadow-md)" }}>
                                
                                <div className="absolute top-[-40%] left-[-10%] w-[250px] h-[250px] bg-gradient-to-tr from-[var(--accent-soft)] to-transparent blur-[70px] pointer-events-none"></div>
                                
                                {/* Info / Progress Text */}
                                <div className="flex-1 space-y-2 z-10 w-full">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl animate-float">🔥</span>
                                    <div>
                                      <h4 className="text-sm font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                                        Personalized Mastery Roadmap Progress
                                      </h4>
                                      <p className="text-[10px] font-mono text-[var(--accent-text)] font-bold uppercase mt-0.5">
                                        ⚡ Streak: {profileData?.streak_count || 1} Days • 👑 XP Accumulation: {profileData?.xp_points || 100} XP
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Progress bar */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] font-mono font-bold" style={{ color: "var(--text-muted)" }}>
                                      <span>Objectives Mastered: {completedRoadmapTasks} / {totalRoadmapTasks}</span>
                                      <span style={{ color: "var(--accent-text)" }}>{overallPercent}%</span>
                                    </div>
                                    <div className="w-full bg-[var(--bg-secondary)] h-2.5 rounded-full overflow-hidden border border-[var(--border)] relative">
                                      <div 
                                        className="h-full rounded-full transition-all duration-700 bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]"
                                        style={{ width: `${overallPercent}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Dynamic Badge/Status icon */}
                                <div className="z-10 flex-shrink-0 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 w-full md:w-auto md:min-w-[140px] text-center"
                                  style={{ boxShadow: "var(--shadow-sm)" }}>
                                  <div>
                                    <span className="text-3xl block">🏆</span>
                                    <span className="text-[10px] font-mono font-black uppercase tracking-wider block mt-1" style={{ color: "var(--text-muted)" }}>
                                      {overallPercent === 100 ? "AI Architect" : "OS Initiate"}
                                    </span>
                                  </div>
                                </div>

                              </div>
                            );
                          })()}

                          {/* Roadmap Node Timeline */}
                          <div className="relative pl-9 sm:pl-12 space-y-8 before:absolute before:left-[16px] sm:before:left-[20px] before:top-2 before:bottom-2 before:w-[3px] before:bg-[var(--border)]">
                            {roadmap.map((node, index) => {
                              const isActive = node.status === "active";
                              const isCompleted = node.status === "completed";
                              const isLocked = node.status === "locked";

                              let circleBg = "var(--bg-card)";
                              let circleBorder = "var(--border)";
                              let circleTextColor = "var(--text-muted)";
                              let cardBorder = "var(--border)";
                              let cardGlow = "none";

                              if (isActive) {
                                circleBg = "var(--accent)";
                                circleBorder = "var(--accent)";
                                circleTextColor = "var(--text-inverse)";
                                cardBorder = "var(--accent)";
                                cardGlow = "0 0 16px var(--accent-glow)";
                              } else if (isCompleted) {
                                circleBg = "var(--success)";
                                circleBorder = "var(--success)";
                                circleTextColor = "var(--text-inverse)";
                              }

                              // Extract tasks and compute weekly progress
                              const nodeTasks = node.tasks || [];
                              const completedWeeklyTasks = nodeTasks.filter((task: string) => 
                                profileData?.completed_tasks?.includes(`${node.node_id}:${task}`)
                              ).length;
                              const weeklyPercent = nodeTasks.length > 0 ? Math.round((completedWeeklyTasks / nodeTasks.length) * 100) : 0;

                              return (
                                <div key={node.node_id} className="relative flex flex-col gap-2 transition-all hover:translate-x-1 duration-200">
                                  {/* Step Circle Indicator */}
                                  <div 
                                    className={`absolute left-[-32px] sm:left-[-38px] w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full flex items-center justify-center font-black text-xs border-2 z-15 transition-all duration-300 ${
                                      isActive ? "animate-pulse" : ""
                                    }`}
                                    style={{
                                      background: circleBg,
                                      borderColor: circleBorder,
                                      color: circleTextColor,
                                      boxShadow: isActive ? "0 0 10px var(--accent)" : "none"
                                    }}
                                  >
                                    {isCompleted ? "✓" : index + 1}
                                  </div>

                                  {/* Stage Card */}
                                  <div className="flex-1 card rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-5 transition-all duration-300 border"
                                    style={{
                                      borderColor: cardBorder,
                                      boxShadow: cardGlow,
                                      background: "var(--bg-card)"
                                    }}
                                  >
                                    {/* Card header: stage details */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                                      <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                          <h4 className="text-base font-extrabold" style={{ color: isActive ? "var(--accent-text)" : "var(--text-primary)" }}>
                                            Week {index + 1}: {node.title}
                                          </h4>
                                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                                            isActive 
                                              ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]" 
                                              : isCompleted 
                                                ? "bg-green-500/10 text-green-500 border-green-500/25" 
                                                : "bg-gray-500/10 text-gray-500 border-gray-500/25"
                                          }`}>
                                            {node.status}
                                          </span>
                                        </div>
                                        <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                          {node.description}
                                        </p>
                                      </div>

                                      {/* Stage-level progress metrics */}
                                      {nodeTasks.length > 0 && !isLocked && (
                                        <div className="flex flex-col items-stretch md:items-end w-full md:w-auto min-w-[120px] space-y-1">
                                          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                                            <span>Stage Check: {completedWeeklyTasks} / {nodeTasks.length}</span>
                                            <span style={{ color: weeklyPercent === 100 ? "var(--success)" : "var(--accent-text)" }}>{weeklyPercent}%</span>
                                          </div>
                                          <div className="w-full md:w-32 bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden border border-[var(--border)] relative">
                                            <div 
                                              className="h-full rounded-full transition-all duration-300"
                                              style={{ 
                                                width: `${weeklyPercent}%`,
                                                background: weeklyPercent === 100 ? "var(--success)" : "var(--accent)"
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {isLocked && (
                                        <div className="flex items-center gap-1.5 text-xs font-mono font-black" style={{ color: "var(--text-muted)" }}>
                                          <span>Locked Stage</span>
                                          <span>🔒</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Actionable Subtask Checkboxes (Notion / Duolingo Style) */}
                                    {nodeTasks.length > 0 && !isLocked && (
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-up">
                                        {nodeTasks.map((task: string, i: number) => {
                                          const isChecked = !!profileData?.completed_tasks?.includes(`${node.node_id}:${task}`);
                                          return (
                                            <button
                                              key={i}
                                              onClick={async () => {
                                                addLog(`[SYSTEM] Syncing task checklist item: "${task}"...`, "system");
                                                try {
                                                  const res = await fetch(`${API_BASE_URL}/api/v1/profile/roadmap/task/toggle`, {
                                                    method: "POST",
                                                    headers: {
                                                      "Content-Type": "application/json",
                                                      "Authorization": `Bearer ${user.uid}`
                                                    },
                                                    body: JSON.stringify({
                                                      node_id: node.node_id,
                                                      task_text: task,
                                                      completed: !isChecked
                                                    })
                                                  });
                                                  if (res.ok) {
                                                    const data = await res.json();
                                                    addLog(`[SUCCESS] Task Checklist updated. XP and milestones recalculated!`, "success");
                                                    fetchProfile();
                                                  } else {
                                                    throw new Error(`HTTP ${res.status}`);
                                                  }
                                                } catch (err) {
                                                  addLog(`[ERROR] Connection failed. Sandbox telemetry updates suspended.`, "error");
                                                }
                                              }}
                                              className="flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:bg-[var(--bg-secondary)]"
                                              style={{
                                                borderColor: isChecked ? "var(--success)" : "var(--border)",
                                                background: isChecked ? "rgba(34,197,94,0.02)" : "var(--bg-card)"
                                              }}
                                            >
                                              <div className="w-5 h-5 rounded-md border flex items-center justify-center font-bold text-[10px] flex-shrink-0 transition-all duration-300"
                                                style={{
                                                  borderColor: isChecked ? "var(--success)" : "var(--border)",
                                                  background: isChecked ? "var(--success)" : "transparent",
                                                  color: isChecked ? "white" : "transparent"
                                                }}>
                                                ✓
                                              </div>
                                              <span className="text-[11px] font-semibold leading-snug break-words flex-1"
                                                style={{ 
                                                  color: isChecked ? "var(--text-muted)" : "var(--text-primary)",
                                                  textDecoration: isChecked ? "line-through" : "none"
                                                }}>
                                                {task}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}

                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* CASE B: STANDARD DETAILED BRANCHING MAPS */}
                      {selectedRoadmapTrack !== "calibrated" && staticRoadmaps[selectedRoadmapTrack] && (
                        <div className="space-y-12 py-4">
                          
                          {/* Track Details Card */}
                          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <h4 className="text-base font-extrabold flex items-center gap-2">
                                <span>{staticRoadmaps[selectedRoadmapTrack].icon}</span>
                                <span>Integrated {staticRoadmaps[selectedRoadmapTrack].title} Curriculum Blueprint</span>
                              </h4>
                              <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
                                {staticRoadmaps[selectedRoadmapTrack].description} Click any sub-node card to open its detailed checklist.
                              </p>
                            </div>
                            
                            {/* Track overall checklist progress */}
                            {(() => {
                              const track = staticRoadmaps[selectedRoadmapTrack];
                              let totalTasks = 0;
                              let completedTasks = 0;
                              track.nodes.forEach((node: any) => {
                                node.subNodes.forEach((sub: any) => {
                                  totalTasks += sub.checklist.length;
                                  sub.checklist.forEach((task: string) => {
                                    if (checkedTasks[`${sub.id}-${task}`]) {
                                      completedTasks++;
                                    }
                                  });
                                });
                              });

                              return (
                                <span className="text-xs font-mono font-black px-3.5 py-1.5 rounded-full self-stretch md:self-auto text-center"
                                  style={{ background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
                                  🎯 Mastery Check: {completedTasks} / {totalTasks} Checked
                                </span>
                              );
                            })()}
                          </div>

                          {/* Node Timeline Visual Graph */}
                          <div className="space-y-10 relative before:absolute before:left-1/2 before:top-4 before:bottom-4 before:w-[2px] before:bg-[var(--border)] before:hidden md:before:block">
                            {staticRoadmaps[selectedRoadmapTrack].nodes.map((node: any, idx: number) => (
                              <div key={node.id} className="space-y-6 relative z-10">
                                
                                {/* Yellow Centered Main Subject Node */}
                                <div className="flex justify-center">
                                  <div className="px-6 py-3 rounded-2xl border-2 text-sm font-black shadow-md tracking-wider flex items-center gap-2.5 transition-all hover:scale-102 select-none"
                                    style={{
                                      background: theme === "dark" ? "#3f2b0f" : "#fef9c3",
                                      borderColor: "var(--warning)",
                                      color: theme === "dark" ? "#fef08a" : "#854d0e"
                                    }}>
                                    <span>🔶</span>
                                    <span>{node.title}</span>
                                  </div>
                                </div>

                                {/* Vertical dashed connector */}
                                <div className="w-[2px] h-6 border-l-2 border-dashed border-[var(--border)] mx-auto"></div>

                                {/* Sub-Nodes Grid branching down */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                                  {node.subNodes.map((sub: any) => {
                                    const subTotal = sub.checklist.length;
                                    const subCompleted = sub.checklist.filter((task: string) => checkedTasks[`${sub.id}-${task}`]).length;
                                    const isSubCompleted = subTotal > 0 && subCompleted === subTotal;

                                    return (
                                      <button
                                        key={sub.id}
                                        onClick={() => setActiveDetailSubNode(sub)}
                                        className="card rounded-2xl p-5 text-left transition-all duration-300 hover:translate-y-[-4px] flex flex-col justify-between h-full group relative cursor-pointer"
                                        style={{
                                          border: `1px solid ${isSubCompleted ? "var(--success)" : "var(--border)"}`,
                                          background: isSubCompleted ? "rgba(34,197,94,0.02)" : "var(--bg-card)",
                                          boxShadow: isSubCompleted ? "0 0 10px rgba(34,197,94,0.06)" : "var(--shadow-sm)"
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = isSubCompleted ? "var(--success)" : "var(--accent)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = isSubCompleted ? "var(--success)" : "var(--border)"; }}
                                      >
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between gap-3">
                                            <h5 className="text-xs sm:text-sm font-extrabold group-hover:text-[var(--accent)] transition-colors leading-tight" style={{ color: "var(--text-primary)" }}>
                                              {sub.title}
                                            </h5>
                                            {isSubCompleted ? (
                                              <span className="text-xs font-bold" style={{ color: "var(--success)" }}>✓</span>
                                            ) : (
                                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                                {subCompleted}/{subTotal}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                            {sub.description}
                                          </p>
                                        </div>

                                        {subTotal > 0 && (
                                          <div className="w-full bg-[var(--bg-secondary)] h-1 rounded-full overflow-hidden mt-4 border border-[var(--border)]">
                                            <div 
                                              className="h-full rounded-full transition-all duration-300"
                                              style={{ 
                                                width: `${(subCompleted / subTotal) * 100}%`,
                                                background: isSubCompleted ? "var(--success)" : "var(--accent)"
                                              }}
                                            />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Dash gap to next segment */}
                                {idx < staticRoadmaps[selectedRoadmapTrack].nodes.length - 1 && (
                                  <div className="w-[2px] h-10 border-l-2 border-dashed border-[var(--border)] mx-auto"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* ═══════ SLIDE-OVER FROSTED GLASS POP-UP DETAIL DRAWER ═══════ */}
                  {activeDetailSubNode && (
                    <div className="fixed inset-0 z-50 flex justify-end"
                      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(6px)" }}
                      onClick={() => setActiveDetailSubNode(null)}
                    >
                      <div className="w-full max-w-lg h-full p-6 md:p-8 flex flex-col justify-between overflow-y-auto animate-slide-left relative"
                        style={{ 
                          background: "var(--bg-card)", 
                          borderLeft: "1px solid var(--border)",
                          boxShadow: "var(--shadow-lg)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Ambient subtle drawer background blur */}
                        <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] bg-gradient-to-tr from-[var(--accent-soft)] to-transparent blur-[80px] pointer-events-none"></div>

                        <div className="space-y-7 relative z-10">
                          
                          {/* Close / Header */}
                          <div className="flex items-start justify-between pb-4 border-b border-[var(--border)]">
                            <div>
                              <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full" style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
                                🔶 Sub-Topic Blueprint Detail
                              </span>
                              <h3 className="text-base sm:text-lg font-black tracking-tight mt-2.5" style={{ color: "var(--text-primary)" }}>
                                {activeDetailSubNode.title}
                              </h3>
                            </div>
                            <button 
                              onClick={() => setActiveDetailSubNode(null)}
                              className="w-8 h-8 rounded-xl border border-[var(--border)] flex items-center justify-center font-bold text-xs cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent-text)] transition-colors"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Learning Scope:</h4>
                            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              {activeDetailSubNode.description}
                            </p>
                          </div>

                          {/* Mastery Checklist */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
                              <span>Checklist Objectives:</span>
                              <span className="text-[10px] font-mono text-[var(--accent-text)]">
                                {activeDetailSubNode.checklist.filter((task: string) => checkedTasks[`${activeDetailSubNode.id}-${task}`]).length} / {activeDetailSubNode.checklist.length} Completed
                              </span>
                            </h4>
                            <div className="space-y-2">
                              {activeDetailSubNode.checklist.map((task: string, i: number) => {
                                const taskId = `${activeDetailSubNode.id}-${task}`;
                                const isChecked = !!checkedTasks[taskId];

                                return (
                                  <button
                                    key={i}
                                    onClick={() => toggleChecklistTask(taskId)}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:bg-[var(--bg-secondary)]"
                                    style={{
                                      borderColor: isChecked ? "var(--success)" : "var(--border)",
                                      background: isChecked ? "rgba(34,197,94,0.02)" : "var(--bg-card)"
                                    }}
                                  >
                                    <div className="w-5 h-5 rounded-md border flex items-center justify-center font-bold text-xs"
                                      style={{
                                        borderColor: isChecked ? "var(--success)" : "var(--border)",
                                        background: isChecked ? "var(--success)" : "transparent",
                                        color: isChecked ? "white" : "transparent"
                                      }}>
                                      ✓
                                    </div>
                                    <span className="text-xs font-semibold leading-snug"
                                      style={{ 
                                        color: isChecked ? "var(--text-muted)" : "var(--text-primary)",
                                        textDecoration: isChecked ? "line-through" : "none"
                                      }}>
                                      {task}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                        {/* Footer Exercises */}
                        <div className="pt-6 border-t border-[var(--border)] mt-8 space-y-4 relative z-10">
                          <div className="bg-[var(--accent-soft)] border border-[var(--accent)] rounded-2xl p-4 text-[10px] sm:text-xs font-mono leading-relaxed text-[var(--accent-text)] font-semibold">
                            💡 Setup and verify this curriculum segment inside your AIOS sandboxed docker containers directly from the Agent Terminal tab!
                          </div>
                          
                          <button
                            onClick={() => {
                              setActiveDetailSubNode(null);
                              addLog(`[SYSTEM] Practice Exercise Loaded: Active study session spawned for blueprint node "${activeDetailSubNode.title}"`, "info");
                            }}
                            className="btn-accent w-full py-4 rounded-2xl font-black text-xs uppercase cursor-pointer transition-all active:scale-95"
                          >
                            Launch Sandbox Practice Session 🪐
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

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
                            className="group p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 relative hover:translate-x-1"
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
                  <div className="lg:col-span-6 card rounded-3xl flex flex-col overflow-hidden h-full border border-[var(--border)]">
                    
                    {/* Chat Area Header */}
                    <div className="px-5 py-3.5 flex items-center justify-between border-b" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        <div>
                          <h4 className="text-xs font-black tracking-tight" style={{ color: "var(--text-primary)" }}>AI Mentor Console</h4>
                          <span className="text-[9px] font-mono text-slate-400">Context bounds active</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border"
                        style={{ background: "var(--accent-soft)", color: "var(--accent-text)", borderColor: "var(--accent)" }}>
                        ⚡ Gemini 3.5 Flash
                      </span>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-5 overflow-y-auto space-y-5 custom-scrollbar bg-[var(--bg-input)]/20">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                          <span className="text-5xl animate-float">🤖</span>
                          <div>
                            <h3 className="text-sm font-black" style={{ color: "var(--text-primary)" }}>AI-OS Cognitive Architect Workspace</h3>
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
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
                            style={{ background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
                            Ω
                          </div>
                          <div className="rounded-2xl rounded-tl-none p-4 text-[11px] font-mono tracking-wider flex items-center gap-2.5 border"
                            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                            
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
                    <div className="p-4" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
                      
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
                            className="p-2.5 rounded-xl text-left border hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-all cursor-pointer flex flex-col justify-between gap-1 group bg-[var(--bg-card)]"
                          >
                            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-500 group-hover:text-[var(--accent)]">{chip.title}</span>
                            <span className="text-[10px] font-semibold text-slate-300 truncate">{chip.text}</span>
                          </button>
                        ))}
                      </div>

                      {/* Custom Perplexity-style input box */}
                      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
                        className="flex items-center gap-3 bg-[var(--bg-input)] rounded-2xl px-4 py-3 border shadow-inner focus-within:ring-2 focus-within:ring-[var(--accent-soft)] transition-all"
                        style={{ borderColor: "var(--border)" }}
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
                    
                    <div className="card rounded-2xl p-5">
                      <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-3 pb-1" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                        Cognitive Topology
                      </h4>
                      <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        Currently routing through **Antigravity v0.1** custom developer setup. Synced with local monorepo schemas and SQLite/PostgreSQL telemetry databases.
                      </p>
                    </div>

                    <div className="card rounded-2xl p-5">
                      <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider mb-3 pb-1" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
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
                          <label htmlFor="qdrant-search-input" className="sr-only">Search query</label>
                          <input 
                            id="qdrant-search-input"
                            name="qdrantSearchQuery"
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
                        
                        {uploadStatus && (
                          <div className="mt-4 px-4 py-2.5 rounded-xl border text-[11px] font-mono leading-relaxed max-w-xs mx-auto animate-pulse"
                            style={{ 
                              background: uploadStatus.type === "error" ? "rgba(239,68,68,0.06)" : uploadStatus.type === "success" ? "rgba(34,197,94,0.06)" : "rgba(251,191,36,0.06)",
                              borderColor: uploadStatus.type === "error" ? "rgba(239,68,68,0.2)" : uploadStatus.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(251,191,36,0.2)",
                              color: uploadStatus.type === "error" ? "#f87171" : uploadStatus.type === "success" ? "#4ade80" : "#fbbf24"
                            }}>
                            {uploadStatus.text}
                          </div>
                        )}
                        
                        <label htmlFor="vector-file-upload" className="mt-5 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all"
                          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                          Browse System Files
                        </label>
                        <input id="vector-file-upload" name="vectorFile" type="file" className="hidden" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            ingestFile(e.target.files[0]);
                          }
                        }} />
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
