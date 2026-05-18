# CAPE: Collaborative Agents Prompt Engineering  

## Framework Overview
**CAPE (Collaborative Agents Prompt Engineering with Human Team Dynamics)** is a role-based multi-agent framework that emulates human team collaboration.  
The framework emphasizes **context-efficient communication**, **retrospective learning**, and **evolutionary prompt management**.  

A central novelty of CAPE is the introduction of the **Agent Satisfaction Score (ASS)** as the primary evaluation metric.  
This metric captures how well each agent perceives it has fulfilled its role, enabling team-like self-reflection and continuous improvement.

---

## Prompt Asset Index
- `0_team/0_protocol.md`: Communication contract covering role fidelity, turn-taking, and required JSON message envelope.
- `0_team/1_culture.md`: Team culture statement outlining mission, values, collaboration norms, and success definitions.
- `0_team/2_dor.md`: Definition of Ready checklists for POA, DA, DevA, and shared prerequisites.
- `0_team/3_dod.md`: Definition of Done checklist per agent plus cross-agent review gate.
- `1_product/0_role.md`: Product Owner Agent charter with mission, responsibilities, constraints, and self-check questions.
- `1_product/1_mvv.md`: Mission, vision, values, positioning, and success horizons for the product.
- `1_product/2_persona.md`: Primary, secondary, and tertiary personas with needs, pain points, and success scenarios.
- `1_product/3_milestone.md`: Multi-release roadmap detailing themes, feature sets, and success criteria.
- `1_product/4_backlog.md`: Placeholder for prioritized backlog (currently empty).
- `2_design/0_role.md`: Designer Agent role definition mirroring mission, scope, and evaluation prompts.
- `2_design/1_principle.md`: Design principles and decision framework for the product's interface and experience.
- `2_design/2_brand.md`: Brand guidelines for color palette, typography, voice, and positioning.
- `3_development/0_role.md`: Developer Agent role definition encapsulating responsibilities, constraints, and self-evaluation.
- `3_development/1_architecture.md`: Architecture overview, module breakdown, data flow, and non-functional guardrails.
- `3_development/2_guideline.md`: Development playbook covering implementation flow and collaboration practices.
- `3_development/3_standards.md`: Project-specific coding standards, testing expectations, and tooling configuration.
- `4_orchestration/0_role.md`: Session Orchestrator Agent brief blending facilitation, measurement, and documentation duties.
- `4_orchestration/1_process.md`: Session lifecycle — pre-session validation, facilitation rules, conflict resolution, and post-session archiving.
- `4_orchestration/2_metrics.md`: Metrics definitions (ASS, SV, ST, and secondary metrics), success thresholds, and JSON logging format.
- `5_sessions/pair/`: Session artefact staging area (empty).
- `5_sessions/retrospective/`: Retrospective archive staging area (empty).

Use these assets as the single source of truth when orchestrating CAPE sessions; fill the placeholders before attempting full-fidelity simulations.

---

## Spec

### File Types

Every file carries a `type` field in its YAML frontmatter:

| Type | Meaning | Action |
|------|---------|--------|
| `generic` | Framework definition — part of CAPE itself | Do not modify unless extending the framework |
| `input` | Project-specific — must be filled in | Replace all `[...]` placeholders before running sessions |

**Quick reference by folder:**

| Folder | `0_role.md` | Content files |
|--------|-------------|---------------|
| `0_team/` | — | `generic` (all 4 files) |
| `1_product/` | `generic` | `input` (all 4 files) |
| `2_design/` | `generic` | `input` (both files) |
| `3_development/` | `generic` | `1_architecture.md` → `input`, `2_guideline.md` → `generic`, `3_standards.md` → `input` |
| `4_orchestration/` | `generic` | `generic` (all files) |

---

### Agents

| Abbr | Name | Domain |
|------|------|--------|
| POA | Product Owner Agent | Business requirements, prioritization, value |
| DA | Designer Agent | UI/UX, wireframes, design rationale |
| DevA | Developer Agent | Architecture, implementation, code |
| SOA | Session Orchestrator Agent | Facilitation, metrics, session documentation |

### Message Format

Every agent message MUST conform to this JSON envelope (full contract in `0_team/0_protocol.md`):

```json
{
  "agent": "AgentName",
  "role": "RoleDescription",
  "task_id": "unique_task_identifier",
  "output": "Main content of the message",
  "references": ["AgentName1", "AgentName2"],
  "confidence": "1–5 self-reported confidence score"
}
```

### Folder Structure

```
cape/
├── 0_team/              # Shared contracts (all agents)
│   ├── 0_protocol.md    # Communication rules and message format
│   ├── 1_culture.md     # Team values and collaboration norms
│   ├── 2_dor.md         # Definition of Ready per agent
│   └── 3_dod.md         # Definition of Done per agent
│
├── 1_product/           # POA domain
│   ├── 0_role.md
│   ├── 1_mvv.md
│   ├── 2_persona.md
│   ├── 3_milestone.md
│   └── 4_backlog.md
│
├── 2_design/            # DA domain
│   ├── 0_role.md
│   ├── 1_principle.md
│   └── 2_brand.md
│
├── 3_development/       # DevA domain
│   ├── 0_role.md
│   ├── 1_architecture.md
│   ├── 2_guideline.md
│   └── 3_standards.md
│
└── 4_orchestration/     # SOA domain
    ├── 0_role.md
    ├── 1_process.md
    └── 2_metrics.md
```

### Self-Evaluation Protocol

After every task, each agent MUST:

1. Report an ASS (1–5) with a one-sentence justification
2. Identify one positive and one improvement aspect of their own contribution
3. Confirm whether context was sufficient to perform their role

The SOA collects responses, computes SV and ST, and logs results per `4_orchestration/2_metrics.md`.  
Agents MUST interpret their own scores and propose concrete changes to their prompts or process before the next session.

---

## Core Principles

### 1. Human Team Dynamics Integration
- **Psychological Safety**: Agents can output divergent ideas without penalty.  
- **Constructive Conflict**: Differing outputs are compared and resolved collaboratively.  
- **Collective Intelligence**: System-level optimization emerges from role-specialized contributions.  
- **Learning Organization**: Retrospectives enable continuous adaptation and prompt evolution.  

### 2. Role-Based Context Allocation
- **Product Owner Agent (POA)**: Handles business requirements, prioritization, and value focus.  
- **Designer Agent (DA)**: Handles UI/UX principles, wireframes, and design rationale.  
- **Developer Agent (DevA)**: Handles technical architecture, implementation strategies, and code.  
- **Session Orchestrator Agent (SOA)**: Facilitates collaboration flow, enforces protocol compliance, and captures in-session metrics.
- **Facilitator Agent (FA)**: Handles process management, dialogue orchestration, and retrospective moderation.  
- **Observer Agent (OA)**: Handles benchmark execution, metric logging, and satisfaction aggregation.  

### 3. Retrospective Learning
- After each task, all agents participate in structured self-reflection.  
- The Observer Agent records metrics and survey results, but **improvement actions are initiated autonomously by the agents themselves**.  
- Satisfaction should progressively increase as the team self-organizes and adapts its collaboration patterns.  

### 4. Evolutionary Prompt Management
- **Prompt Assets**: Modular role-specific prompts stored under version control.  
- **Inheritance**: Successful prompts reused and adapted across iterations.  
- **Pattern Library**: Effective collaboration templates accumulated systematically.  
- **Knowledge Systematization**: Domain expertise embedded in reusable prompt modules.  

---

## Measurement Framework

### Primary Metric: Agent Satisfaction
- **Agent Satisfaction Score (ASS)**:  
  - After each task, each agent must self-report its satisfaction with task performance on a Likert scale (1–5).  
  - Agents must also provide a short justification for the score.  
- **Satisfaction Variance (SV)**: The variability of satisfaction across agents, indicating role imbalance.  
- **Satisfaction Trend (ST)**: The trajectory of satisfaction scores across successive tasks, indicating team maturity.  

### Secondary Metrics (Objective)
- **Token Usage per Agent (TU)**: Tracked from API usage logs.  
- **Compression Ratio (CR)**: Input length ÷ context passed to each agent.  
- **Consensus Iterations (CI)**: Number of dialogue turns required for agreement.  
- **Cross-Reference Frequency (XRF)**: Frequency of explicit references to other agents’ outputs.  
- **Task Success Rate (TSR)**: Benchmarked correctness (e.g., unit test pass rate).  
- **Reproducibility Rate (RR)**: Percentage of equivalent outputs under repeated runs.  
- **Execution Time per Task (ETT)**: Processing time from start to completion.  

---

## Implementation Guidelines
- **Role Prompts**: Current definitions live in `1_product/0_role.md`, `2_design/0_role.md`, `3_development/0_role.md`, and `4_orchestration/0_role.md`.  
- **Version Control**: All prompt assets are managed via Git.  
- **Structured Logging**: JSON logs are maintained for all interactions and metrics.  
- **Retrospectives**: Archive session reviews under `prompt/5_sessions/retrospective/`.  
- **Self-Organization Principle**: Agents must autonomously adjust their collaboration and prompts to improve satisfaction and task outcomes over successive iterations.  

See the canonical folder structure in the [Spec](#spec) section above.


## Success Criteria
- **≥4.0 average ASS** across tasks.  
- **Decreasing SV** across iterations, indicating balanced team satisfaction.  
- **≥80% Task Success Rate** on benchmarks.  
- **≥90% Reproducibility Rate**.  
- **≥30% Token Reduction** compared to single-agent baseline.  

---

## Self-Evaluation Protocol
After completing every task, each agent must answer the following survey:  

1. **Satisfaction Score**: On a scale of 1–5, how satisfied are you with your contribution to this task?  
2. **Positive Aspects**: What aspect of your role execution worked well?  
3. **Improvement Aspects**: What aspect could be improved in the next iteration?  
4. **Context Adequacy**: Did you feel you had sufficient and relevant context to perform your role?  

The Observer Agent records these responses as metrics (ASS, SV, ST).  
**Agents themselves must interpret the results and modify their prompts or strategies** to increase satisfaction in future iterations.
