---
type: generic
---

# Metrics

## Primary Metric: Agent Satisfaction Score (ASS)

### Definition
After each task, each agent self-reports how well it fulfilled its role.

### Collection
Each agent must answer:
1. **Score** (1–5 Likert): How satisfied are you with your contribution to this task?
2. **Positive**: What aspect of your role execution worked well?
3. **Improvement**: What could be improved in the next iteration?
4. **Context adequacy**: Did you have sufficient context to perform your role?

### Derived Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **ASS** | Per-agent satisfaction score | ≥4.0 average |
| **SV** (Satisfaction Variance) | Variability across agents — indicates role imbalance | Decreasing over iterations |
| **ST** (Satisfaction Trend) | Trajectory of ASS across successive tasks — indicates team maturity | Positive slope |

---

## Secondary Metrics (Objective)

| Metric | Description | How to Measure |
|--------|-------------|----------------|
| **TU** (Token Usage per Agent) | Context consumed per agent per task | API usage logs |
| **CR** (Compression Ratio) | Input length ÷ context passed to agent | Log at message boundary |
| **CI** (Consensus Iterations) | Turns required to reach agreement | Count from session transcript |
| **XRF** (Cross-Reference Frequency) | Explicit references to other agents' outputs | Count `references` fields in messages |
| **TSR** (Task Success Rate) | Correctness against acceptance criteria | Acceptance criteria checklist |
| **RR** (Reproducibility Rate) | Equivalent outputs on repeated runs | Replay with same inputs |
| **ETT** (Execution Time per Task) | Wall-clock time from start to completion | Timestamp delta |

---

## Success Thresholds

| Metric | Threshold |
|--------|-----------|
| Average ASS | ≥4.0 |
| SV | Decreasing across iterations |
| TSR | ≥80% |
| RR | ≥90% |
| Token reduction vs. single-agent | ≥30% |

---

## Logging

- Log all per-task metrics to `outputs/sessions/retrospective/` as JSON
- Format per entry:

```json
{
  "session_id": "unique_session_identifier",
  "task_id": "unique_task_identifier",
  "timestamp": "ISO-8601",
  "metrics": {
    "ass": { "POA": 4, "DA": 3, "DevA": 5, "SOA": 4 },
    "sv": 0.67,
    "ci": 3,
    "xrf": 5,
    "tsr": true,
    "ett_seconds": 142
  },
  "open_questions": [],
  "improvement_actions": []
}
```

---

## Using Metrics for Improvement

Agents must interpret their own scores and propose concrete changes:
- ASS < 4 → identify the gap (context, role clarity, collaboration pattern) and adjust prompt or process
- High SV → identify the agent with lowest score and adjust its inputs or role constraints
- Flat ST → trigger a team retrospective to surface systemic blockers
