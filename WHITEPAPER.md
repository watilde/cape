# CAPE: Collaborative Agents Prompt Engineering

**A Role-Based Multi-Agent Framework with Human Team Dynamics**

---

## Abstract

Large language models are increasingly capable of producing high-quality outputs in isolation, yet single-agent systems lack the specialization, accountability, and self-correction that human teams develop naturally over time. CAPE (Collaborative Agents Prompt Engineering) proposes a structured multi-agent framework that mirrors the dynamics of a real software product team. Four specialized agents — Product Owner, Designer, Developer, and a Cape Master facilitator — collaborate within a defined session protocol, produce structured artifacts, and improve their collaboration across sessions through a KPT-based retrospective system. This paper describes the design of the framework, its measurement model, and the architectural decisions behind its open-source CLI implementation.

---

## 1. Introduction

### 1.1 Problem

When a user prompts a general-purpose AI with a complex product task — "add dark mode to the app" — the model must simultaneously reason about business value, user experience, technical feasibility, and implementation specifics. This conflation of concerns degrades output quality in each dimension and leaves no mechanism for specialization, cross-checking, or learning between runs.

Human teams solve this through role specialization and structured collaboration: a product owner defines value, a designer specifies experience, a developer implements, and a facilitator keeps the process honest. The question CAPE addresses is: *can these dynamics be faithfully modeled in a multi-agent system, and does the structure yield better outcomes than a single capable agent?*

### 1.2 Approach

CAPE introduces four agent roles with strict role fidelity — agents are explicitly prohibited from drifting into each other's domains. A session follows a linear handoff protocol: CM (Opening) → POA → DA → DevA → CM (Retrospective). Each agent receives only the outputs it needs from upstream agents, reducing context noise while enforcing cross-referencing. After each session, the Cape Master facilitates a structured retrospective that produces KPT (Keep / Problem / Try) items, which are accumulated in a merged history file read at the opening of subsequent sessions. This creates a feedback loop across sessions that progressively informs the team's behavior.

---

## 2. Framework Design

### 2.1 Agent Roles

CAPE defines four agent roles, each with a strict scope boundary:

| Agent | Role | Domain |
|-------|------|--------|
| **CM** | Cape Master | Process facilitation, DoR checking, KPT retrospective |
| **POA** | Product Owner Agent | Business value, acceptance criteria, prioritization |
| **DA** | Designer Agent | UX rationale, component specifications, brand adherence |
| **DevA** | Developer Agent | Technical architecture, implementation, file generation |

Role fidelity is enforced at the prompt level: each agent's instructions explicitly state what it must not do. POA does not propose technical solutions; DA does not override business requirements; DevA does not reprioritize the backlog; CM does not produce domain outputs of any kind.

### 2.2 The Cape Master

The Cape Master (CM) is the Scrum Master analog of the system. It appears twice in each session:

**Opening** — CM reads the objective, checks it against Definition of Ready criteria, identifies session-specific risks, and gives each agent a tailored coaching note. If historical KPT data exists from prior sessions, CM explicitly references recurring Problems and unresolved Tries in its coaching.

**Retrospective** — After all domain agents have produced their outputs, CM facilitates a structured conversation among the full team. Each agent reflects on their contribution, surfaces friction, and proposes improvements. CM derives a KPT from the conversation and computes satisfaction metrics.

This dual-appearance structure mirrors how a skilled Scrum Master sets context before a sprint and extracts learning after it.

### 2.3 Session Protocol

Every agent message conforms to a structured JSON envelope:

```json
{
  "agent": "AgentName",
  "role": "RoleDescription",
  "task_id": "unique_task_identifier",
  "voice": "Casual first-person reflection in session language",
  "output": "Domain-specific content",
  "references": ["AgentName"],
  "confidence": 4,
  "ass": {
    "score": 4,
    "positive": "What worked well",
    "improvement": "What to improve",
    "context_adequate": true
  }
}
```

The `voice` field is a deliberate design choice: it produces a casual, first-person reflection that is surfaced in the terminal during streaming, making the session feel like a team conversation rather than a pipeline of API calls. The `references` field enforces explicit acknowledgment of upstream outputs rather than implicit consumption.

### 2.4 Prompt Asset System

Each project using CAPE maintains a `cape/` directory that serves as the context repository for agents. Files are organized by domain:

```
cape/
├── 0_team/          # Shared protocol, culture, DoR, DoD
├── 1_product/       # MVV, personas, milestones, backlog
├── 2_design/        # Design principles, brand guidelines
├── 3_development/   # Architecture, coding standards, playbook
├── 4_orchestration/ # Process definitions, metrics
└── 5_sessions/
    ├── pair/        # Per-session raw artifacts (JSON)
    └── retrospective/  # Per-session KPT markdown + kpt_merged.md
```

Files carry a `type` frontmatter field: `generic` files define the CAPE framework itself and should not be modified; `input` files are project-specific and must be filled in before sessions. The `cape init` command generates all files interactively by asking the user questions in natural language and calling an LLM to translate answers into structured project context.

---

## 3. Continuous Learning via KPT

### 3.1 Per-Session Retrospective

Each session closes with a KPT structured as:

- **Keep** — what worked and should be repeated
- **Problem** — what caused friction, confusion, or rework
- **Try** — concrete action to attempt in the next session

These are persisted as a dated markdown file: `cape/5_sessions/retrospective/YYYY-MM-DD_HH-MM_<task-id>.md`

### 3.2 The Merged KPT File

A single accumulated file, `kpt_merged.md`, grows across sessions. Each item is tagged with its originating session ID:

```markdown
## Keep
- [task-001] Clear Given-When-Then acceptance criteria enabled DevA to implement confidently
- [task-002] DA component list produced before DevA started reduced rework

## Problem
- [task-001] Package dependencies written by DevA not installed automatically
- [task-002] DA specifications arrived after DevA had already begun

## Try
- [task-001] Auto-run npm install when package.json is modified by DevA
- [task-002] DA to finalize component list before DevA's planning step begins
```

At every session opening, CM reads this file and injects it into its prompt. It is instructed to flag recurring Problems that persist across sessions and acknowledge Tries that were adopted. This creates a lightweight long-term memory without requiring a vector database or external storage — the compression happens through the KPT structure itself.

### 3.3 Why KPT as the Compression Format

KPT is semantically dense: three categories cover the full space of retrospective insight in a format that remains actionable. Unlike a full conversation transcript, a KPT list accumulates linearly without growing stale — a Problem from session 1 that still appears in session 5 is a signal, not noise. The tagging system makes recurrence visible without requiring summarization.

---

## 4. Measurement Framework

### 4.1 Primary Metric: Agent Satisfaction Score (ASS)

The Agent Satisfaction Score is a self-reported Likert scale (1–5) that each agent assigns to its own contribution after every task. It is the primary quality signal in CAPE because it is role-relative: a DevA score of 4 means "I had the context and specs I needed to implement well," not "the feature is good." This makes it a leading indicator of collaboration quality rather than a lagging indicator of output correctness.

Derived metrics:

| Metric | Description | Target |
|--------|-------------|--------|
| **ASS** | Per-agent satisfaction score | ≥4.0 average |
| **SV** (Satisfaction Variance) | Variability across agents — indicates role imbalance | Decreasing over iterations |
| **ST** (Satisfaction Trend) | Trajectory of ASS across successive tasks | Positive slope |

### 4.2 Secondary Metrics

| Metric | Description |
|--------|-------------|
| **XRF** (Cross-Reference Frequency) | Count of explicit `references` fields — measures inter-agent awareness |
| **CI** (Consensus Iterations) | Dialogue turns needed before CM closes the retrospective |
| **TSR** (Task Success Rate) | Acceptance criteria fulfillment rate |
| **RR** (Reproducibility Rate) | Output consistency across repeated runs with identical input |
| **ETT** (Execution Time per Task) | Wall-clock time from session start to retrospective save |
| **CR** (Compression Ratio) | Input token length ÷ context passed to each agent |

### 4.3 Success Thresholds

| Metric | Threshold |
|--------|-----------|
| Average ASS | ≥4.0 |
| SV | Decreasing across iterations |
| TSR | ≥80% |
| RR | ≥90% |
| Token reduction vs. single-agent | ≥30% |

---

## 5. Implementation

### 5.1 Technology Stack

CAPE is implemented as an open-source Node.js CLI package:

- **Runtime**: Node.js 20+ / TypeScript / ES Modules
- **Agent orchestration**: [Mastra](https://mastra.ai) (`@mastra/core`) — provides `createStep`, `createWorkflow`, and streaming agent primitives
- **LLM provider**: Anthropic Claude via `@ai-sdk/anthropic`
  - Session agents: `claude-sonnet-4-6`
  - Init generation: `claude-haiku-4-5` (parallel calls for speed)
- **CLI**: Custom built (`bin/cape.js`), no framework dependency

### 5.2 Workflow Architecture

The session workflow is a linear Mastra pipeline where each step receives the previous step's output as `inputSchema` and can access all prior step outputs via `getStepResult`:

```
cmOpenStep → poaStep → daStep → devaStep → cmRetroStep
```

Each step streams the agent response to stdout in real time using a token-by-token reader with a state machine that handles JSON escape sequences (`\n`, `\t`, `\\`) to produce readable terminal output from raw JSON strings.

### 5.3 File Generation

DevA produces implementation files inside `<file path="...">` XML blocks. The workflow extracts these with a regex and writes them to `CAPE_PROJECT_DIR` (defaulting to `cwd`). This makes CAPE able to modify the user's actual project codebase as part of a session — not just produce plans.

### 5.4 Interactive Session Loop

`cape start` enters an interactive loop: after each session completes, the user is prompted for the next objective. An empty line exits. This eliminates the startup cost of repeated CLI invocations and keeps the session context in a single process, which is particularly relevant as the merged KPT file grows.

### 5.5 Language Support

All agent voice and conversation outputs are language-configurable via `--lang` (e.g., `--lang ja` for Japanese). The `language` field is injected into every agent prompt, ensuring consistent output language across the full session while keeping the prompt asset files themselves in English.

---

## 6. Key Design Decisions

**Linear handoff over parallel execution.** Agents run sequentially, not in parallel. This is intentional: each agent's output is meant to inform the next. DA should react to POA's acceptance criteria; DevA should react to DA's component specs. Parallelizing would eliminate this cross-referencing, which is a core protocol requirement.

**JSON as the inter-agent format.** Structured JSON envelopes enforce completeness (every field must be present) and enable deterministic parsing for terminal rendering, artifact storage, and metric extraction. The `voice` field within the envelope preserves a human-readable, informal register without sacrificing parsability.

**KPT over full transcript as long-term memory.** Injecting full retrospective transcripts into subsequent sessions would rapidly exhaust context budgets. KPT's three-category structure compresses an entire session's learning into ≤10 items, retaining the signal while discarding the noise.

**Cape Master as both opener and closer.** Using a single agent for both phases ensures continuity: CM's opening concerns are referenced explicitly in the retrospective, creating accountability within a session. A developer reading the retrospective can trace CM's prediction ("watch out for unclear data model requirements") against what actually happened.

**Role fidelity over generalism.** Each agent's instructions contain explicit prohibitions ("do not propose technical implementations," "do not override design rationale"). This is enforced through prompt design, not code. The cost is some rigidity; the benefit is that agents remain legible — their outputs are predictable given their role.

---

## 7. Future Work

- **Branching workflows**: Allow CM to detect low-DoR objectives and route to a clarification step before engaging domain agents.
- **Agent-driven prompt evolution**: Enable agents to propose edits to their own role files in `cape/` as a Try action, with CM reviewing before applying.
- **Benchmark suite**: Establish a reproducible task set to measure TSR and RR across framework versions and model upgrades.
- **Parallel DA/DevA tracks**: For tasks where design and development are independent (e.g., a backend-only feature), allow DA to be skipped or run concurrently with DevA.
- **Web UI**: A session viewer that renders the conversation, KPT, and metrics in a browser alongside the generated files.

---

## 8. Conclusion

CAPE demonstrates that imposing role structure, turn-taking protocol, and retrospective learning on a multi-agent system produces a qualitatively different interaction from both a single-agent prompt and an unstructured multi-agent conversation. The Cape Master role — absent from most multi-agent frameworks — is the mechanism through which process quality is maintained and learning is carried forward. The KPT-based memory system provides longitudinal continuity without architectural complexity. Whether this structure improves measurable task outcomes relative to a single capable model is an empirical question that the framework's metric system is designed to answer.

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| **ASS** | Agent Satisfaction Score — self-reported 1–5 Likert score per agent per task |
| **SV** | Satisfaction Variance — variability of ASS across agents |
| **ST** | Satisfaction Trend — ASS trajectory across successive sessions |
| **XRF** | Cross-Reference Frequency — count of explicit inter-agent references |
| **KPT** | Keep / Problem / Try — retrospective format |
| **DoR** | Definition of Ready — criteria a task must meet before a session begins |
| **DoD** | Definition of Done — criteria that must be met for a session to be considered complete |
| **Role fidelity** | Constraint that each agent operates strictly within its domain |
| **Cape Master** | The session facilitator agent; the Scrum Master analog in CAPE |
