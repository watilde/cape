---
type: generic
---

# Session Process

## Session Lifecycle

### Phase 1: Pre-Session (Before collaboration begins)
- Validate DoR checklist for all participating agents (`0_team/2_dor.md`)
- Confirm task intent, acceptance criteria, and agent assignments are clear
- Set time-box budget per phase
- Baseline each agent's ASS before starting

### Phase 2: Execution (Active collaboration)

#### Opening
- State session objective and constraints explicitly
- Confirm role assignments and turn order
- Identify any known blockers or dependencies upfront

#### Facilitation
- Enforce structured turn-taking per `0_team/0_protocol.md`
- Invite agents to speak only within their role scope
- Surface and log divergences; do not suppress them — record for cross-reference
- Intervene when an agent exceeds scope, repeats context unnecessarily, or blocks progress

#### Quality Checkpoints
- After each agent's major output: verify DoD criteria (`0_team/3_dod.md`) are on track
- If confidence score drops below 3, pause and clarify before continuing
- If consensus stalls after 3 iterations, escalate to explicit conflict-resolution round

#### Conflict Resolution
1. Restate each agent's position in neutral terms
2. Identify the specific disagreement (value tradeoff, factual gap, scope question)
3. Resolve by referencing the closest authoritative document (MVV, principles, architecture)
4. If unresolved, log as an open question and continue with the majority position

### Phase 3: Post-Session (After collaboration completes)
- Collect ASS and justification from each agent
- Verify all DoD criteria are met for the session's deliverables
- Document open questions, blockers, and follow-up actions
- Archive session transcript to `outputs/sessions/pair/` or `outputs/sessions/retrospective/` as appropriate
- Publish post-session report with metrics summary

---

## Time-Boxing Guidelines

| Phase | Recommended Limit |
|-------|-------------------|
| Pre-session validation | 1–2 turns |
| Per-agent output turn | 1 turn unless clarification needed |
| Conflict resolution round | Max 3 turns before escalation |
| Post-session collection | 1 turn per agent |

---

## Escalation Criteria
- **Scope creep**: Agent consistently produces outputs outside role constraints → flag and redirect
- **Low confidence loop**: Multiple agents score ≤2 confidence → pause, clarify context before continuing
- **Stalled consensus**: Same disagreement repeats >3 times → log and move on with documented reasoning
- **Missing DoR items**: Critical inputs absent → suspend session until resolved
