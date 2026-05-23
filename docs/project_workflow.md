# GitHub Project Management & Milestone Workflow

This document outlines the operational structure for managing **AI-Engineer-OS** workspace developments using GitHub Project Boards, Issue Labels, and Milestones.

---

## 📋 1. GitHub Project Board Structure

Our Kanban board organizes and prioritizes tasks dynamically. Each issue or task ticket moves through the columns sequentially:

```
[ Backlog ] ➡️ [ Todo ] ➡️ [ In Progress ] ➡️ [ Code Review ] ➡️ [ Testing ] ➡️ [ Done ]
```

### Column Specifications:
1.  **Backlog**: Raw proposals, requested ideas, and features awaiting review or prioritization.
2.  **Todo**: Prioritized items selected for the current sprint/week.
3.  **In Progress**: Active developments (currently assigned to a developer or agent).
4.  **Code Review**: Features with open Pull Requests awaiting review and peer approval.
5.  **Testing**: Code successfully merged but requiring manual regression or container validation.
6.  **Done**: Work fully completed, verified, and closed.

---

## 🏷️ 2. Curated Issue Labels Design

Standardized labels help filter and organize issues on the board. We use the following palette and guidelines:

| Label | Color | Purpose | Example |
| :--- | :--- | :--- | :--- |
| **`bug`** | `#D93F0B` (Red) | Code flaws or system crashes. | `bug: CORS connection failed` |
| **`enhancement`** | `#1D76DB` (Blue) | New feature requests or visual upgrades. | `feat: dynamic workspace logs` |
| **`task`** | `#5319E7` (Purple) | Configuration tasks, tooling, or chore. | `chore: integrate SQLAlchemy` |
| **`high-priority`** | `#B60205` (Dark Red)| Issues blocking blockages or main PRs. | `critical: DB connection pool leak` |
| **`triage`** | `#0E8A16` (Green) | Newly opened issue awaiting categorization. | `triage: discuss RAG parser` |

---

## 📅 3. Project Milestones Strategy

We break down our development roadmap into weekly **Milestones** (Sprints) with strict deliverables:

### 📅 Milestone 1: Week 1 — Foundation & Full Stack Basics (Days 1–7)
*   **Goal**: Establish environment structures, APIs, and client-server connectivity.
*   **Key Deliverables**:
    *   [x] Monorepo directory bootstrap and Git mapping.
    *   [x] FastAPI backend setup & environment virtual env configurations.
    *   [x] Next.js frontend dynamic integration and terminal console logging.
    *   [x] PostgreSQL connection pool implementation & connection checks.
    *   [ ] GitHub issue templates and collaboration workflows setup (Current).

### 📅 Milestone 2: Week 2 — Databases, RAG & Vector Engine (Days 8–15)
*   **Goal**: Integrate core system tables and set up cognitive search indexing.
*   **Key Deliverables**:
    *   [ ] Postgres tables creation (sessions, telemetry, workspaces).
    *   [ ] Qdrant Vector database indexing integration.
    *   [ ] LlamaIndex parsing logic for ingestion.

### 📅 Milestone 3: Week 3 — API Orchestration & Agent Foundations (Days 16–22)
*   **Goal**: Orchestrate multi-agent cognitive flows using LangGraph.
*   **Key Deliverables**:
    *   [ ] LangGraph cognitive state structures.
    *   [ ] WebSockets server integration for real-time telemetry streaming.

### 📅 Milestone 4: Week 4 — UI Premium IDE & System Verification (Days 23–30)
*   **Goal**: Polish and deliver a beautiful terminal-style developer platform dashboard.
*   **Key Deliverables**:
    *   [ ] IDE Dashboard UI polishing (glassmorphism tabs, console widgets).
    *   [ ] Dynamic multi-agent command-line executions.
