"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import OnboardingWizard from "./onboarding/OnboardingWizard";
import ProfileTab from "./components/ProfileTab";
import SettingsTab from "./components/SettingsTab";
import DashboardTab from "./components/DashboardTab";
import { LayoutDashboard, Map, Link2, BarChart3, Terminal, Settings, User, Bell, Search } from "lucide-react";


import VectorTab from "./components/VectorTab";
import IntegrationsTab from "./components/IntegrationsTab";
import AnalyticsTab from "./components/AnalyticsTab";
import RoadmapTab from "./components/RoadmapTab";
import AgentTab from "./components/AgentTab";
import DatabaseTab from "./components/DatabaseTab";
import DebuggerTab from "./components/DebuggerTab";

import { API_BASE_URL } from "./config";
import { isPlaceholder } from "./firebase";

type Tab = "dashboard" | "roadmaps" | "agent" | "database" | "vector" | "integrations" | "analytics" | "debugger" | "settings" | "profile";

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

interface TelemetryRow {
  id: string;
  event: string;
  status: "success" | "warning" | "error";
  duration: number;
  timestamp: string;
}

interface IngestedDocument {
  id: number;
  name: string;
  source_type: string;
  topic?: string;
  upload_date: string;
  content?: string;
}

interface RoadmapSubNode {
  id: string;
  title: string;
  description: string;
  checklist: string[];
}

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  subNodes: RoadmapSubNode[];
}

interface RoadmapTrack {
  title: string;
  icon: string;
  accent: string;
  description: string;
  nodes: RoadmapNode[];
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
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
// Onboarding flow state
const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
const [onboardingStep, setOnboardingStep] = useState<number>(1);
const [onboardingData, setOnboardingData] = useState<any>({});
const [profileExists, setProfileExists] = useState<boolean>(true);
const [roadmap, setRoadmap] = useState<any[]>([]);
const [profileData, setProfileData] = useState<any | null>(null);
const [selectedRoadmapTrack, setSelectedRoadmapTrack] = useState<string>("calibrated");
const [activeDetailSubNode, setActiveDetailSubNode] = useState<RoadmapSubNode | null>(null);
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

const staticRoadmaps: Record<string, RoadmapTrack> = {
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

  // Daily planner states
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [plannerLoading, setPlannerLoading] = useState(false);

  // Tab 2: Cognitive Agent Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentThinkingStep, setAgentThinkingStep] = useState(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Derive messages from active session
  const activeSession = chatSessions.find((s) => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  // Tab 3: Database Explorer States
  const [telemetryTable, setTelemetryTable] = useState<TelemetryRow[]>([
    { id: "TX-901", event: "auth/session-authorized", status: "success", duration: 12, timestamp: "21:11:05" },
    { id: "TX-902", event: "postgres/pool-connected", status: "success", duration: 8, timestamp: "21:11:06" },
    { id: "TX-903", event: "gateway/health-query", status: "success", duration: 15, timestamp: "21:11:15" },
    { id: "TX-904", event: "vector/qdrant-ping-failure", status: "warning", duration: 120, timestamp: "21:11:22" },
  ]);
  const [dbChecking, setDbChecking] = useState(false);

  // Theme State
  const [theme, setTheme] = useState("dark");

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

  // Tab 4: Vector Embeddings States
  const [vectorQuery, setVectorQuery] = useState("");
  const [vectorResults, setVectorResults] = useState<any[]>([]);
  const [vectorSearching, setVectorSearching] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<IngestedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);


  // YouTube Transcript Ingestion States
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeIngesting, setYoutubeIngesting] = useState(false);
  const [youtubeResult, setYoutubeResult] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // GitHub Repository Ingestion States
  const [githubUrl, setGithubUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [githubIngesting, setGithubIngesting] = useState(false);
  const [githubResult, setGithubResult] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Study Buddy & YouTube Video Notes States
  const [selectedDoc, setSelectedDoc] = useState<IngestedDocument | null>(null);
  const [selectedDocLoading, setSelectedDocLoading] = useState(false);
  const [docNotes, setDocNotes] = useState("");
  const [studyTab, setStudyTab] = useState<"notes" | "chat">("notes");
  const [docChatHistory, setDocChatHistory] = useState<{ id: string; sender: "user" | "assistant"; text: string; citations?: string[]; beginner_explanation?: string }[]>([]);
  const [docChatQuery, setDocChatQuery] = useState("");
  const [docChatLoading, setDocChatLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  // Tab 5: Settings States
  const [activeModel, setActiveModel] = useState("gemini-3.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [debugMode, setDebugMode] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("You are Antigravity, a professional agentic developer working inside the AI-Engineer-OS platform.");

  // Apply theme to document (Enforced Light/Beige Theme)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, [theme]); // Kept dependency to avoid hooks warning

  // Theme is locked to light/beige
  useEffect(() => {}, []);
  useEffect(() => {}, [theme]);

  const toggleTheme = () => {
    addLog("Dark mode has been removed. Theme is locked to beige.", "info");
  };

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
        fetchDailyTasks();
        fetchUploadedDocuments();
        fetchChatSessions();
      } else {
        setLogs((prev) => [
          ...prev,
          { text: "[WARNING] RESTRICTED ACCESS: Developer authentication credentials required.", type: "error" }
        ]);
      }
    }
  }, [user, authLoading]);

  // Sync Vector Tab documents fetch
  useEffect(() => {
    if (user) {
      if (activeTab === "vector") {
        fetchUploadedDocuments();
      } else if (activeTab === "agent") {
        fetchChatSessions();
      }
    }
  }, [activeTab, user]);

  // Scroll Chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentThinking]);





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

  // Vector Tab: Fetch Stored PDF Documents from Database
  const fetchUploadedDocuments = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/rag/documents`, {
        headers: {
          "Authorization": `Bearer ${user.uid}`
        }
      });
      if (res.ok) {
        const data = (await res.json()) as IngestedDocument[];
        setUploadedDocs(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch uploaded documents:", err);
    }
  };

  // Fetch Document details including its full content
  const fetchDocumentDetails = async (docId: number) => {
    if (!user) return;
    setSelectedDocLoading(true);
    addLog(`[RAG] Loading document details for ID: #${docId}...`, "info");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/rag/document/${docId}`, {
        headers: {
          "Authorization": `Bearer ${user.uid}`
        }
      });
      if (res.ok) {
        const data = (await res.json()) as IngestedDocument;
        setSelectedDoc(data);
        const storedNotes = localStorage.getItem(`aios_notes_${docId}`);
        setDocNotes(storedNotes || "");
        setDocChatHistory([]);
        setDocChatQuery("");
        setStudyTab("notes");
        addLog(`[SUCCESS] Loaded study buddy context for "${data.name}".`, "success");
      } else {
        addLog(`[ERROR] Failed to retrieve document contents: ${res.statusText}`, "error");
      }
    } catch (err: any) {
      console.error("Failed to load document:", err);
      addLog(`[ERROR] Fetching document failed: ${err.message || err}`, "error");
    } finally {
      setSelectedDocLoading(false);
    }
  };

  // Notes Change Handler
  const handleNotesChange = (text: string) => {
    setDocNotes(text);
    if (selectedDoc) {
      localStorage.setItem(`aios_notes_${selectedDoc.id}`, text);
    }
  };

  // AI Summarize Notes Generator
  const generateAISummary = async () => {
    if (!user || !selectedDoc || summarizing) return;
    setSummarizing(true);
    addLog(`[YOUTUBE] Triggering AI Video Summarization...`, "info");
    try {
      const prompt = "Generate a comprehensive, high-fidelity, structured summary of this video's transcript. Break it down into key concepts, key takeaways, and a structured outline. Keep it in beautiful Markdown format with clear sections.";
      const res = await fetch(`${API_BASE_URL}/api/v1/rag/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.uid}`
        },
        body: JSON.stringify({
          query: prompt,
          limit: 5,
          document_id: selectedDoc.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        const summaryText = data.answer;
        const updatedNotes = docNotes 
          ? `${docNotes}\n\n---\n### 🤖 AI Video Summary\n${summaryText}` 
          : `### 🤖 AI Video Summary\n${summaryText}`;
        handleNotesChange(updatedNotes);
        addLog(`[SUCCESS] AI Summary appended to notes successfully!`, "success");
      } else {
        addLog(`[ERROR] AI Summary failed: ${res.statusText}`, "error");
      }
    } catch (err: any) {
      console.error("Failed to generate AI summary:", err);
      addLog(`[ERROR] AI Summary generation failed: ${err.message || err}`, "error");
    } finally {
      setSummarizing(false);
    }
  };

  // Chat query specialized for single video
  const handleDocChatSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDoc || !docChatQuery.trim() || docChatLoading) return;

    const query = docChatQuery.trim();
    setDocChatQuery("");
    
    const userMsgId = `user-${Date.now()}`;
    const userMessage = { id: userMsgId, sender: "user" as const, text: query };
    setDocChatHistory(prev => [...prev, userMessage]);
    setDocChatLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/rag/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.uid}`
        },
        body: JSON.stringify({
          query: query,
          limit: 5,
          document_id: selectedDoc.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsgId = `assistant-${Date.now()}`;
        const citations = data.citations || [];
        
        setDocChatHistory(prev => [
          ...prev, 
          { 
            id: assistantMsgId, 
            sender: "assistant" as const, 
            text: data.answer, 
            citations,
            beginner_explanation: data.beginner_explanation
          }
        ]);
      } else {
        addLog(`[ERROR] AI Chat error: ${res.statusText}`, "error");
      }
    } catch (err: any) {
      console.error("Failed to query doc chat:", err);
      addLog(`[ERROR] AI Chat failed: ${err.message || err}`, "error");
    } finally {
      setDocChatLoading(false);
    }
  };

  // Vector Tab: Upload PDF File directly as binary multipart data
  const uploadPdfFile = (file: File) => {
    if (!user) return;

    // 1. File Type check
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setUploadStatus({ text: "❌ Validation failed: Only PDF files (.pdf) are allowed.", type: "error" });
      addLog(`[ERROR] File validation failed: '${file.name}' is not a PDF.`, "error");
      return;
    }

    // 2. File Size check (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadStatus({ text: "❌ Validation failed: File size exceeds the 10MB limit.", type: "error" });
      addLog(`[ERROR] File size validation failed: '${file.name}' exceeds the 10MB safety boundary.`, "error");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus({ text: `Initializing upload for '${file.name}'...`, type: "info" });
    addLog(`[VECTOR] Uploading PDF document: '${file.name}' (${(file.size / 1024).toFixed(1)} KB)...`, "info");

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/v1/upload-pdf`);
    xhr.setRequestHeader("Authorization", `Bearer ${user.uid}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
        setUploadStatus({ text: `Uploading PDF document: ${percent}%...`, type: "info" });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { message?: string };
          addLog(`[SUCCESS] PDF '${file.name}' uploaded: ${data.message || "Stored on backend."}`, "success");
          setUploadStatus({ text: `✓ PDF '${file.name}' uploaded successfully!`, type: "success" });
          fetchUploadedDocuments();
        } catch (e) {
          addLog(`[SUCCESS] PDF uploaded, but failed to parse response.`, "success");
          setUploadStatus({ text: `✓ PDF uploaded successfully!`, type: "success" });
        }
      } else {
        let errDetail = "Upload rejected by backend.";
        try {
          const data = JSON.parse(xhr.responseText);
          errDetail = data.detail || errDetail;
        } catch (e) {}
        addLog(`[ERROR] PDF upload failed: ${errDetail}`, "error");
        setUploadStatus({ text: `❌ Upload failed: ${errDetail}`, type: "error" });
      }
      setUploading(false);
      setUploadProgress(0);
    };

    xhr.onerror = () => {
      addLog("[ERROR] Network boundary error during PDF upload.", "error");
      setUploadStatus({ text: "❌ Connection error: Could not reach backend upload gateway.", type: "error" });
      setUploading(false);
      setUploadProgress(0);
    };

    xhr.send(formData);
  };

  // Router for Drag-and-Drop and Browse actions
  const handleIncomingFile = (file: File) => {
    if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
      uploadPdfFile(file);
    } else {
      ingestFile(file);
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
            fetchUploadedDocuments();
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

  // YouTube Transcript Ingestion Pipeline
  const ingestYoutubeVideo = async () => {
    if (!user || !youtubeUrl.trim()) return;

    const url = youtubeUrl.trim();

    // Basic URL validation
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
      setYoutubeResult({ text: "❌ Invalid URL: Please enter a valid YouTube video URL.", type: "error" });
      addLog("[ERROR] YouTube URL validation failed. URL must be from youtube.com or youtu.be.", "error");
      return;
    }

    setYoutubeIngesting(true);
    setYoutubeResult({ text: "🔄 Extracting transcript from YouTube video...", type: "info" });
    addLog(`[YOUTUBE] Initiating transcript extraction for: ${url}`, "info");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/rag/ingest-youtube`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.uid}`
        },
        body: JSON.stringify({ url })
      });

      if (res.ok) {
        const data = await res.json();
        const title = data.video_metadata?.title || "Unknown Video";
        const channel = data.video_metadata?.channel || "Unknown Channel";
        const wordCount = data.word_count?.toLocaleString() || "0";
        const chunks = data.chunks_count || 0;

        setYoutubeResult({
          text: `✅ Transcript Extracted — "${title}" by ${channel}\n📝 ${wordCount} words processed • ${chunks} chunks created • Knowledge stored successfully`,
          type: "success"
        });
        addLog(`[SUCCESS] YouTube transcript ingested: "${title}" — ${wordCount} words, ${chunks} chunks stored.`, "success");
        setYoutubeUrl("");
        fetchUploadedDocuments();
      } else {
        let errDetail = "Failed to process YouTube video.";
        try {
          const errData = await res.json();
          errDetail = errData.detail || errDetail;
        } catch (e) {}
        setYoutubeResult({ text: `❌ ${errDetail}`, type: "error" });
        addLog(`[ERROR] YouTube ingestion failed: ${errDetail}`, "error");
      }
    } catch (err: any) {
      setYoutubeResult({ text: "❌ Connection error: Could not reach backend API.", type: "error" });
      addLog("[ERROR] Network error during YouTube transcript ingestion.", "error");
    } finally {
      setYoutubeIngesting(false);
    }
  };

  // GitHub Repository Ingestion Pipeline
  const ingestGithubRepo = async () => {
    if (!user || !githubUrl.trim()) return;

    const url = githubUrl.trim();

    // Basic URL validation
    if (!url.includes("github.com")) {
      setGithubResult({ text: "❌ Invalid URL: Please enter a valid GitHub repository URL.", type: "error" });
      addLog("[ERROR] GitHub URL validation failed. URL must be from github.com.", "error");
      return;
    }

    setGithubIngesting(true);
    setGithubResult({ text: "🔄 Connecting and fetching repository documentation zipball...", type: "info" });
    addLog(`[GITHUB] Connecting to repository: ${url}`, "info");

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/rag/ingest-github`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.uid}`
        },
        body: JSON.stringify({ url, token: githubToken || undefined })
      });

      if (res.ok) {
        const data = await res.json();
        const filesIndexed = data.files_indexed || 0;
        const chunksCreated = data.chunks_created || 0;

        setGithubResult({
          text: `✅ Repository Processed Successfully!\n🐙 Files Indexed: ${filesIndexed}\n📝 Chunks Created: ${chunksCreated}\n⚡ Stored in Qdrant Vector Search`,
          type: "success"
        });
        addLog(`[SUCCESS] GitHub repo ingested: ${filesIndexed} documentation files indexed, ${chunksCreated} chunks stored.`, "success");
        setGithubUrl("");
        setGithubToken("");
        fetchUploadedDocuments();
      } else {
        let errDetail = "Failed to ingest GitHub repository.";
        try {
          const errData = await res.json();
          errDetail = errData.detail || errDetail;
        } catch (e) {}
        setGithubResult({ text: `❌ ${errDetail}`, type: "error" });
        addLog(`[ERROR] GitHub ingestion failed: ${errDetail}`, "error");
      }
    } catch (err: any) {
      setGithubResult({ text: "❌ Connection error: Could not reach backend API.", type: "error" });
      addLog("[ERROR] Network error during GitHub repo ingestion.", "error");
    } finally {
      setGithubIngesting(false);
    }
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
      handleIncomingFile(file);
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
        <div className="fixed inset-0 z-50 flex grid grid-cols-1 md:grid-cols-2" style={{ background: "linear-gradient(90deg, #0b0c10 0%, #1a1543 40%, #f7f5ed 60%, #f7f5ed 100%)" }}>
          
          {/* Left Column - Brand & Illustration */}
          <div className="relative hidden md:flex flex-col justify-between p-8 lg:p-12 overflow-hidden bg-transparent">
            {/* Animated Background Gradients */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-full blur-[120px] opacity-40 animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full blur-[120px] opacity-30 animate-pulse pointer-events-none" style={{ animationDelay: "2s" }}></div>
            
            {/* Logo */}
            <div className="relative z-10 flex items-center gap-3 w-fit px-4 py-3 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-2xl mx-auto">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black text-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-inner">
                AI
              </div>
              <span className="text-white font-black text-2xl tracking-widest uppercase drop-shadow-md">AIOS</span>
            </div>

            {/* Illustration */}
            <div className="relative z-10 flex-1 flex items-center justify-center min-h-[300px]">
              <div className="relative group w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-blue-600 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
                <img 
                  src="/login_illustration.png" 
                  alt="AIOS Illustration" 
                  className="relative max-w-full max-h-[90%] object-contain mix-blend-lighten opacity-80 drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out z-10" 
                />
              </div>
            </div>

            {/* Footer Text */}
            <div className="relative z-10 space-y-6 p-6 md:p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center text-center mx-auto w-full">
              <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-[#a5b4fc] leading-tight tracking-tight drop-shadow-sm" style={{ fontFamily: "Georgia, serif" }}>
                One step at a time<br />
                — that's how every<br />
                AI expert began.
              </h1>
              <div className="flex flex-wrap justify-center items-center gap-3 opacity-90">
                <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-200 text-[11px] font-bold border border-indigo-500/30 uppercase tracking-wider backdrop-blur-md shadow-sm">Roadmaps</span>
                <span className="px-3.5 py-1.5 rounded-full bg-fuchsia-500/20 text-fuchsia-200 text-[11px] font-bold border border-fuchsia-500/30 uppercase tracking-wider backdrop-blur-md shadow-sm">Video Transcripts</span>
                <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-200 text-[11px] font-bold border border-cyan-500/30 uppercase tracking-wider backdrop-blur-md shadow-sm">Structured Learning</span>
              </div>
            </div>
          </div>

          {/* Right Column - Auth Form */}
          <div className="flex flex-col items-center justify-center p-8 bg-transparent overflow-y-auto">
            <div className="w-full max-w-md space-y-6 relative z-10">
              
              <div className="text-center md:text-left space-y-1.5">
                <h2 className="text-3xl font-bold text-slate-900">{isRegistering ? "Create an account" : "Welcome back"}</h2>
                <p className="text-sm text-slate-500">
                  {isRegistering ? "Already have an account? " : "New to AIOS? "}
                  <button onClick={() => setIsRegistering(!isRegistering)} className="text-blue-600 font-semibold hover:underline">
                    {isRegistering ? "Login instead" : "Register here"}
                  </button>
                </p>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={signInWithGoogle}
                  disabled={isPlaceholder}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </button>
                <button 
                  onClick={signInWithGithub}
                  disabled={isPlaceholder}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd"/></svg>
                  GitHub
                </button>
              </div>

              {/* Phone Button */}
              <button 
                onClick={() => alert("Phone login coming soon")}
                disabled={isPlaceholder}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
                </svg>
                Continue with Phone
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-400 font-medium">{isRegistering ? "or register with email" : "or sign in with email"}</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {!isRegistering ? (
                /* ---------------- LOGIN FORM ---------------- */
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert("Email login is UI only right now. Use bypass or social."); }}>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input type="email" placeholder="you@email.com" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1543] transition-all text-slate-900" />
                  </div>
                  
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                      <a href="#" className="text-xs font-semibold text-blue-600 hover:underline">Forgot password?</a>
                    </div>
                    <div className="relative">
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1543] transition-all text-slate-900" />
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-left">
                    <input type="checkbox" id="keep-signed-in" className="w-4 h-4 rounded border-slate-300 text-[#1a1543] focus:ring-[#1a1543]" />
                    <label htmlFor="keep-signed-in" className="text-sm font-medium text-slate-600">Keep me signed in</label>
                  </div>

                  <button type="submit" className="w-full py-3.5 bg-[#1a1543] hover:bg-[#282161] text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                    Sign In to AIOS <span>&rarr;</span>
                  </button>
                </form>
              ) : (
                /* ---------------- REGISTRATION FORM ---------------- */
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Registration is UI only right now."); }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input type="text" placeholder="John Doe" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1543] text-slate-900" required />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                      <input type="text" placeholder="@johndoe" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1543] text-slate-900" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                      <input type="tel" placeholder="+1 234 567 890" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1543] text-slate-900" required />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email ID</label>
                      <input type="email" placeholder="you@email.com" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1543] text-slate-900" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
                      <input type="date" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1543] text-slate-900" required />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                      <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1543] text-slate-900" required defaultValue="">
                        <option value="" disabled>Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1543] text-slate-900" required />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1543] text-slate-900" required />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3.5 bg-[#1a1543] hover:bg-[#282161] text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4">
                    Save and continue <span>&rarr;</span>
                  </button>
                </form>
              )}

              {isPlaceholder && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center flex flex-col gap-3 shadow-sm">
                  <p><strong>Demo Mode:</strong> Live auth is disabled. Use the bypass button below.</p>
                  <button onClick={signInMockDeveloper} className="mx-auto px-5 py-2 bg-amber-500 text-black hover:bg-amber-400 transition-colors rounded-lg font-bold">Bypass to Mock Sandbox</button>
                </div>
              )}

              <p className="text-xs text-center text-slate-400 mt-2">
                By {isRegistering ? "registering" : "signing in"} you agree to our <a href="#" className="underline hover:text-slate-600">Terms</a> and <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>
              </p>
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
          <aside className={`hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 transition-all duration-150 z-30 ${
            sidebarCollapsed ? "w-20" : "w-64"
          } bg-white border-r border-gray-200`}>
            
            {/* Sidebar Logo */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white shadow-sm flex-shrink-0 bg-blue-600">
                  AI
                </div>
                {(!sidebarCollapsed || mobileSidebarOpen) && (
                  <div>
                    <h1 className="text-base font-bold tracking-tight leading-none text-gray-900">
                      AIOS
                    </h1>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex w-7 h-7 rounded-lg items-center justify-center cursor-pointer transition-all border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              >
                {sidebarCollapsed ? "→" : "←"}
              </button>

              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              
              {([
                { id: "dashboard" as Tab, label: "Dashboard", icon: <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" /> },
                { id: "roadmaps" as Tab, label: "Roadmaps", icon: <Map className="w-[18px] h-[18px] flex-shrink-0" /> },
                { id: "integrations" as Tab, label: "Integrations", icon: <Link2 className="w-[18px] h-[18px] flex-shrink-0" /> },
                { id: "analytics" as Tab, label: "Analytics", icon: <BarChart3 className="w-[18px] h-[18px] flex-shrink-0" /> },
                { id: "debugger" as Tab, label: "AI Debugger", icon: <Terminal className="w-[18px] h-[18px] flex-shrink-0" /> },
                { id: "settings" as Tab, label: "Settings", icon: <Settings className="w-[18px] h-[18px] flex-shrink-0" /> },
                { id: "profile" as Tab, label: "Profile", icon: <User className="w-[18px] h-[18px] flex-shrink-0" /> },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-all cursor-pointer rounded-lg ${
                    activeTab === tab.id 
                      ? "bg-blue-50 text-blue-600 font-semibold" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  {(!sidebarCollapsed || mobileSidebarOpen) && <span>{tab.label}</span>}
                </button>
              ))}
            </nav>

            {/* User Card */}
            <div className="p-4 mt-auto border-t border-gray-100">
              <div className="flex items-center gap-3 overflow-hidden p-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 bg-gray-50/50">
                <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    "SA"
                  )}
                </div>
                {(!sidebarCollapsed || mobileSidebarOpen) && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate leading-tight text-gray-900">
                      Sai Anirudh
                    </p>
                    <p className="text-[10px] font-mono truncate leading-none mt-0.5 text-gray-400">
                      ai.anirudh@gmail.com
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ═══════ MAIN CONTENT AREA ═══════ */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* Header Bar */}
            <header className="h-16 sticky top-0 z-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-200">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="md:hidden p-1.5 rounded-lg cursor-pointer flex-shrink-0 text-gray-400 hover:bg-gray-50"
                  aria-label="Toggle Sidebar Menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    <span>workspace</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-500 font-bold">{activeTab}</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mt-0.5 flex items-center gap-2">
                    {activeTab === "dashboard" && "Dashboard"}
                    {activeTab === "roadmaps" && "Roadmaps"}
                    {activeTab === "integrations" && "Integrations"}
                    {activeTab === "analytics" && "Project Analytics"}
                    {activeTab === "settings" && "Settings"}
                    {activeTab === "profile" && "Developer Profile"}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="System Online"></span>
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Search Bar */}
                <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-400 text-xs w-64 hover:border-gray-300 transition-colors shadow-xs">
                  <Search className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  <span>Search workspace...</span>
                  <span className="ml-auto text-[9px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-400 font-mono shadow-xs">⌘K</span>
                </div>
                
                {/* Notification Bell */}
                <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center relative shadow-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                </button>

                {/* User Profile Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm border border-gray-200">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    "SA"
                  )}
                </div>
              </div>
            </header>

            {/* Dynamic Content Pane */}
            <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
              
              {/* ═══════ TAB 1: DASHBOARD ═══════ */}
              {activeTab === "dashboard" && (
                <DashboardTab
                  dailyTasks={dailyTasks}
                  plannerLoading={plannerLoading}
                  handleToggleDailyTask={handleToggleDailyTask}
                  profileData={profileData}
                  getLast7Days={getLast7Days}
                  roadmap={roadmap}
                  selectedRoadmapTrack={selectedRoadmapTrack}
                  setSelectedRoadmapTrack={setSelectedRoadmapTrack}
                  staticRoadmaps={staticRoadmaps}
                  activeDetailSubNode={activeDetailSubNode}
                  setActiveDetailSubNode={setActiveDetailSubNode}
                  checkedTasks={checkedTasks}
                  toggleChecklistTask={toggleChecklistTask}
                  logs={logs}
                  setLogs={setLogs}
                  addLog={addLog}
                  fetchStatus={fetchStatus}
                  fastapiOnline={fastapiOnline}
                  activeModel={activeModel}
                  user={user}
                  API_BASE_URL={API_BASE_URL}
                  fetchProfile={fetchProfile}
                  setShowBreatherModal={setShowBreatherModal}
                  setActiveTab={setActiveTab}
                />
              )}





              {/* ═══════ TAB: ROADMAPS ═══════ */}
              {activeTab === "roadmaps" && (
                <RoadmapTab
                  profileData={profileData}
                  roadmap={roadmap}
                  selectedRoadmapTrack={selectedRoadmapTrack}
                  setSelectedRoadmapTrack={setSelectedRoadmapTrack}
                  staticRoadmaps={staticRoadmaps}
                  activeDetailSubNode={activeDetailSubNode}
                  setActiveDetailSubNode={setActiveDetailSubNode}
                  checkedTasks={checkedTasks}
                  toggleChecklistTask={toggleChecklistTask}
                  addLog={addLog}
                  user={user}
                  API_BASE_URL={API_BASE_URL}
                  fetchProfile={fetchProfile}
                />
              )}

              {/* ═══════ TAB 2: COGNITIVE AGENT TERMINAL ═══════ */}
              {activeTab === "agent" && (
                <AgentTab
                  chatSessions={chatSessions}
                  activeSessionId={activeSessionId}
                  setActiveSessionId={setActiveSessionId}
                  startNewChat={startNewChat}
                  deleteChatSession={deleteChatSession}
                  messages={messages}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  handleSendMessage={handleSendMessage}
                  agentThinking={agentThinking}
                  agentThinkingStep={agentThinkingStep}
                  chatEndRef={chatEndRef}
                  parseMarkdownToReact={parseMarkdownToReact}
                  user={user}
                  addLog={addLog}
                />
              )}

              {/* ═══════ TAB 3: DATABASE EXPLORER ═══════ */}
              {activeTab === "database" && (
                <DatabaseTab
                  telemetryTable={telemetryTable}
                  dbChecking={dbChecking}
                  triggerDbCheck={triggerDbCheck}
                  insertMockTelemetry={insertMockTelemetry}
                />
              )}

              {/* ═══════ TAB 4: VECTOR RAG EXPLORER ═══════ */}
              {activeTab === "vector" && (
                <VectorTab
                  uploadedDocs={uploadedDocs}
                  selectedDoc={selectedDoc}
                  setSelectedDoc={setSelectedDoc}
                  selectedDocLoading={selectedDocLoading}
                  fetchDocumentDetails={fetchDocumentDetails}
                  dragActive={dragActive}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  uploadStatus={uploadStatus}
                  handleDrag={handleDrag}
                  handleDrop={handleDrop}
                  handleIncomingFile={handleIncomingFile}
                  vectorQuery={vectorQuery}
                  setVectorQuery={setVectorQuery}
                  vectorSearching={vectorSearching}
                  vectorResults={vectorResults}
                  handleVectorSearch={handleVectorSearch}
                  studyTab={studyTab}
                  setStudyTab={setStudyTab}
                  docNotes={docNotes}
                  handleNotesChange={handleNotesChange}
                  docChatHistory={docChatHistory}
                  docChatQuery={docChatQuery}
                  setDocChatQuery={setDocChatQuery}
                  handleDocChatSearch={handleDocChatSearch}
                  docChatLoading={docChatLoading}
                  summarizing={summarizing}
                  generateAISummary={generateAISummary}
                  parseMarkdownToReact={parseMarkdownToReact}
                  addLog={addLog}
                />
              )}

              {/* ═══════ TAB: INTEGRATIONS ═══════ */}
              {activeTab === "integrations" && (
                <IntegrationsTab
                  youtubeUrl={youtubeUrl}
                  setYoutubeUrl={setYoutubeUrl}
                  youtubeIngesting={youtubeIngesting}
                  youtubeResult={youtubeResult}
                  ingestYoutubeVideo={ingestYoutubeVideo}
                  githubUrl={githubUrl}
                  setGithubUrl={setGithubUrl}
                  githubToken={githubToken}
                  setGithubToken={setGithubToken}
                  githubIngesting={githubIngesting}
                  githubResult={githubResult}
                  ingestGithubRepo={ingestGithubRepo}
                />
              )}

              {/* ═══════ TAB 7: ANALYTICS ═══════ */}
              {activeTab === "analytics" && (
                <AnalyticsTab user={user} onProjectAdded={fetchProfile} />
              )}

              {/* ═══════ TAB 5: SETTINGS ═══════ */}
              {activeTab === "settings" && (<SettingsTab activeModel={activeModel} setActiveModel={setActiveModel} addLog={addLog} user={user} />)}

              {/* ═══════ TAB 6: PROFILE ═══════ */}
              {activeTab === "profile" && (
                <ProfileTab user={user} />
              )}

              {/* ═══════ TAB 8: AI DEBUGGER ═══════ */}
              {activeTab === "debugger" && (
                <DebuggerTab user={user} parseMarkdownToReact={parseMarkdownToReact} addLog={addLog} />
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
