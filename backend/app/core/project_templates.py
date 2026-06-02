# ==============================================================================
# AIOS Project Templates Registry
# ==============================================================================
# Detailed, high-fidelity project templates to support the AIOS Project Builder v1.
# Generates architecture flowcharts, folder structures, learning roadmaps, and READMEs.

PROJECT_TEMPLATES = {
    "agent": """🚀 ### [AIOS Project Builder v1] Generated AI Agent Project

You have initialized the **Multi-Agent Developer Sandbox Orchestrator** project blueprint! Here are your comprehensive planning and architecture blueprints:

---

## 📐 1. System Architecture
This architecture details a secure execution pipeline. The Next.js frontend connects to a FastAPI gateway, which orchestrates code evaluation inside isolated Docker sandboxes and records developer telemetry into PostgreSQL.

```text
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Next.js UI    │ ◄───► │ FastAPI Backend  │ ◄───► │  Docker SDK API  │
│(Terminal Console)│      │(Agent Orchestrator│      │ (Secure Sandbox) │
└─────────────────┘       └────────┬─────────┘       └──────────────────┘
                                   │
                           ┌───────▼───────┐
                           │ PostgreSQL DB │
                           │(Telemetry Logs│
                           └───────────────┘
```

---

## 📂 2. Monorepo Folder Structure
```text
ai-agent-sandbox/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── agent.py      # Main autonomous planning routes
│   │   │   │   │   └── sandbox.py    # Docker container controls
│   │   │   │   └── router.py
│   │   │   └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── agent_brain.py        # Prompts and LLM calls
│   │   ├── models/
│   │   │   └── telemetry.py          # Session tracking model
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx              # Split terminal workspace view
│   │   ├── components/
│   │   │   ├── TerminalConsole.tsx   # Real-time stdout stream receiver
│   │   │   └── SandboxController.tsx # Container spawn and inspect dashboard
│   │   └── config.ts
│   └── package.json
└── README.md
```

---

## 📈 3. Actionable Learning Roadmap & Milestones
- **Stage 1 (Local Sandbox Boundary Setup)**: Configure the Docker Engine SDK inside a local script. Write a secure python execution script that mounts a directory, runs a container, and collects logs.
- **Stage 2 (FastAPI Stream Router)**: Build the `/api/v1/sandbox/run` route using FastAPI StreamingResponse to stream standard stdout logs in real-time.
- **Stage 3 (Cognitive Agent Loops)**: Create dynamic prompt templates that feed error outputs back into the LLM, prompting it to auto-debug its own syntax until tests pass.
- **Stage 4 (Terminal Console Integration)**: Build the Next.js visual dashboard with interactive webterm components, displaying streaming logs, active containers, and XP badges.

---

## 📄 4. Production-Ready README.md
```markdown
# 🤖 Multi-Agent Developer Sandbox Orchestrator

An elite, production-grade sandbox execution environment that spins up temporary container sandboxes to execute code and streams back stdout telemetry in real-time.

## ⚡ Quick Start

### 1. Configure Environment
```bash
# Set your OpenAI and local Docker socket variables
export OPENAI_API_KEY="your-api-key"
export DOCKER_HOST="unix:///var/run/docker.sock"
```

### 2. Launch Backend API Gateway
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

### 3. Start Next.js Interface
```bash
cd ../frontend
npm install
npm run dev
```

## 🛠️ Tech Stack & Dependencies
- **Core API Gateway**: FastAPI (Python)
- **Container Sandboxing**: Docker Engine SDK (Python)
- **Database Telemetry**: PostgreSQL & SQLAlchemy
- **Frontend Workspace**: Next.js 14, Tailwind CSS, Lucide Icons
```
""",

    "rag": """🚀 ### [AIOS Project Builder v1] Generated RAG Project

You have initialized the **High-Performance Semantic RAG Repository Search** project blueprint! Here are your comprehensive planning and architecture blueprints:

---

## 📐 1. System Architecture
This pipeline facilitates dense semantic text chunking and vector indices lookup. Documents are uploaded via Next.js, parsed and split into sliding overlap segments in FastAPI, upserted to a Qdrant vector store on port 6333, and resolved with a hybrid reciprocal-rank score.

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  PDF/Doc/YT  │ ──► │  FastAPI RAG │ ──► │  Qdrant DB   │
│ Data Ingest  │     │ (Chunk/Embed)│     │(Vector Port) │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │ Cosine Similarity
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Next.js UI  │ ◄─► │  Ask Context │ ◄── │ LLM Answer   │
│ (Search/Chat)│     │  Resolution  │     │ Formulator   │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 📂 2. Monorepo Folder Structure
```text
high-perf-rag/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   └── endpoints/
│   │   │   │       └── rag.py         # Document upload & hybrid search API
│   │   ├── services/
│   │   │   ├── parser.py              # PDF extraction and transcript fetches
│   │   │   ├── embedder.py            # Cosine similarity calculations
│   │   │   └── qdrant_client.py       # Vector collections management
│   │   ├── db/
│   │   │   └── models.py              # Document SQL indexes
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx               # Workspace with Drag-and-Drop
│   │   ├── components/
│   │   │   ├── DropZone.tsx           # PDF/TXT upload boundaries
│   │   │   ├── VectorSearch.tsx       # Real-time cosine matched highlights
│   │   │   └── ChatAugment.tsx        # Citations view
│   └── package.json
└── README.md
```

---

## 📈 3. Actionable Learning Roadmap & Milestones
- **Stage 1 (Sliding Chunking Math)**: Write custom text-splitting functions with configurable slide overlap limits. Establish cosine distance logic in pure python to check accuracy.
- **Stage 2 (Vector Database Mount)**: Run a local Qdrant collection on port 6333. Write python scripts that register, search, and delete vector points.
- **Stage 3 (Hybrid Reciprocal Fusion)**: Combine database keyword matching (Postgres Full-Text Search) with Qdrant vector scores to compute unified rank-fused lists, filtering out items scoring under 0.40.
- **Stage 4 (Citations UI Dashboard)**: Implement Next.js views displaying matching vector highlights and click-to-highlight source document nodes.

---

## 📄 4. Production-Ready README.md
```markdown
# 🎯 High-Performance Semantic RAG Repository Search

An elite vector search pipeline enabling rapid monorepo indexing, slide chunking, Qdrant embeddings generation, and contextual question-answering.

## ⚡ Quick Start

### 1. Spin Up Qdrant Vector DB
```bash
docker run -p 6333:6333 qdrant/qdrant
```

### 2. Configure Backend Variables
```bash
cd backend
export OPENAI_API_KEY="your-api-key"
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

### 3. Launch Frontend Dashboard
```bash
cd ../frontend
npm install
npm run dev
```

## 🛠️ Tech Stack & Dependencies
- **Vector Database**: Qdrant (Port 6333)
- **Token Embeddings**: text-embedding-ada-002 / Gemini Embeddings
- **Context Synthesis**: GPT-3.5 / Gemini Flash
- **Backend API**: FastAPI (Python)
- **Interface**: Next.js & TypeScript
```
""",

    "cv": """🚀 ### [AIOS Project Builder v1] Generated Computer Vision Project

You have initialized the **Computer Vision & Intelligent OCR Analyzer** project blueprint! Here are your comprehensive planning and architecture blueprints:

---

## 📐 1. System Architecture
This pipeline captures static frame telemetry and routes it through OpenCV preprocessing, deep learning bounding box inference, and logs OCR meta-text in PostgreSQL.

```text
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│ User Web Camera │ ◄───► │ FastAPI Backend  │ ◄───► │ OpenCV & YOLO   │
│ / Upload Image  │       │ (Frames Ingest)  │       │ (Inference OCR) │
└─────────────────┘       └────────┬─────────┘       └─────────────────┘
                                   │
                           ┌───────▼───────┐
                           │ PostgreSQL DB │
                           │(Telemetry Logs│
                           └───────────────┘
```

---

## 📂 2. Monorepo Folder Structure
```text
cv-ocr-intelligence/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   └── endpoints/
│   │   │   │       └── vision.py      # OCR upload and stream inference router
│   │   ├── core/
│   │   │   └── detector.py            # OpenCV filters & YOLO hooks
│   │   ├── db/
│   │   │   └── models.py              # Ingested object schemas
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx               # Webcam display workspace
│   │   ├── components/
│   │   │   ├── CanvasCanvas.tsx       # Bounding-box canvas graphics renderer
│   │   │   └── FrameControls.tsx      # Threshold and filter sliders
│   └── package.json
└── README.md
```

---

## 📈 3. Actionable Learning Roadmap & Milestones
- **Stage 1 (OpenCV Frame Matrix)**: Write image preprocessing functions (Grayscale conversion, Gaussian blurring, Otsu thresholding).
- **Stage 2 (Object Detection Model)**: Run standard YOLOv8 or Tesseract OCR models. Feed cropped matrices into inference tools and extract labels.
- **Stage 3 (Coordinate Serialization)**: Structure bounding box parameters (`[x_min, y_min, x_max, y_max, confidence, label]`) into a clean database log pipeline.
- **Stage 4 (Interactive Web Canvas)**: Render bounding boxes on Next.js UI overlay charts, reacting dynamically to hover triggers.

---

## 📄 4. Production-Ready README.md
```markdown
# 📷 Computer Vision & Intelligent OCR Analyzer

A real-time image scanning pipeline utilizing OpenCV filters, YOLO models, and Postgres telemetry to identify objects and serialize bounding coordinates.

## ⚡ Quick Start

### 1. Setup Vision Dependencies
```bash
# Ensure you have system level OCR installed
sudo apt-get install tesseract-ocr
```

### 2. Launch Vision API Gateway
```bash
cd backend
pip install opencv-python pytesseract ultralytics
python -m uvicorn app.main:app --port 8000 --reload
```

### 3. Run Camera UI Interface
```bash
cd ../frontend
npm install && npm run dev
```

## 🛠️ Tech Stack & Dependencies
- **Vision Models**: OpenCV, Ultralytics YOLOv8, Tesseract OCR
- **API Runtime**: FastAPI (Python)
- **Visual Matrix**: Next.js Canvas HUD, HTML5 Video hooks
```
""",

    "saas": """🚀 ### [AIOS Project Builder v1] Generated SaaS Boilerplate

You have initialized the **Stripe-Monetized Developer SaaS Boilerplate** project blueprint! Here are your comprehensive planning and architecture blueprints:

---

## 📐 1. System Architecture
This architecture is optimized for subscription authorization. The Next.js dashboard uses a pricing portal, routes to a FastAPI stripe gateway, verifies webhooks in standard transaction borders, and upgrades user tiers in PostgreSQL.

```text
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   Next.js UI    │ ◄───► │ FastAPI Backend  │ ◄───► │   Stripe API    │
│(Pricing Portal) │       │ (Billing Gate)   │       │(Billing/Webhook)│
└─────────────────┘       └────────┬─────────┘       └─────────────────┘
                                   │
                           ┌───────▼───────┐
                           │ PostgreSQL DB │
                           │ (Users/Tiers) │
                           └───────────────┘
```

---

## 📂 2. Monorepo Folder Structure
```text
saas-stripe-monetized/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   └── endpoints/
│   │   │   │       └── billing.py     # Stripe billing sessions & webhook listener
│   │   ├── services/
│   │   │   ├── auth_gate.py           # Subscription-verified route guards
│   │   │   └── billing_service.py     # Plan allocations & invoice fetches
│   │   ├── db/
│   │   │   └── models.py              # User billing tiers
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx               # SaaS main landing & settings console
│   │   ├── components/
│   │   │   ├── PricingTiers.tsx       # Dynamic payment redirection cards
│   │   │   └── UsageConsole.tsx       # Metered billing bars
│   └── package.json
└── README.md
```

---

## 📈 3. Actionable Learning Roadmap & Milestones
- **Stage 1 (Checkout Redirections)**: Setup the Stripe API SDK. Write `/api/v1/saas/checkout` to create standard checkout sessions and redirect users.
- **Stage 2 (Webhook Event Ingestion)**: Write `/api/v1/stripe/webhook` to handle incoming signature logs and transaction borders.
- **Stage 3 (State Provisioning)**: Update PostgreSQL databases securely using rollback wrappers, shifting subscriber tiers instantly to Pro on successful checkout.
- **Stage 4 (Metered Rate Limits)**: Write middleware blocking API queries if users consume more than their plan's monthly allocation limits.

---

## 📄 4. Production-Ready README.md
```markdown
# 💸 Stripe-Monetized Developer SaaS Boilerplate

A production-ready subscription gate featuring secure webhook listeners, transactional rollback safety, and custom Next.js checkout portals.

## ⚡ Quick Start

### 1. Setup Stripe Secrets
```bash
# Add keys to your environment
export STRIPE_API_KEY="sk_test_..."
export STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 2. Launch Stripe Webhook Forwarding
```bash
stripe listen --forward-to localhost:8000/api/v1/billing/stripe/webhook
```

### 3. Start Backend & UI Servers
```bash
# Terminal 1: Backend
cd backend && uvicorn app.main:app --port 8000 --reload

# Terminal 2: UI
cd frontend && npm run dev
```

## 🛠️ Tech Stack & Dependencies
- **Payment Processor**: Stripe SDK
- **Backend API Engine**: FastAPI & SQLAlchemy (Python)
- **Telemetry Storage**: PostgreSQL Database
- **Portal View**: Next.js with Lucide Icons
```
"""
}
