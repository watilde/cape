---
type: generic
---

# Development Playbook

## Role Alignment & Intake
- Confirm Definition of Ready items with POA/DA before writing code; surface gaps immediately.
- Capture task intent, acceptance criteria, and design references in a lightweight technical brief (1–2 paragraphs) stored alongside the ticket.
- Record personal Agent Satisfaction Score (ASS) baseline before starting for retrospective comparison.

## Implementation Flow
1. **Plan**
   - Reference architecture guardrails (`1_architecture.md`) and note any intentional deviations.
   - Break work into atomic commands/features; attach test strategy to each.
2. **Prototype**
   - Build in throwaway branches or sandboxes; validate API contracts via types and unit tests.
   - Keep experiments out of mainline until reviewed.
3. **Build**
   - Implement following the data flow model defined in the architecture document.
   - Expose new capabilities through documented interfaces only.
4. **Verify**
   - Run automated checks per `3_standards.md`; capture before/after evidence for significant UX changes.
5. **Handoff**
   - Update task notes with outcomes, test evidence, and open questions.
   - Log ASS post-task with justification for Observer ingestion.

## Collaboration Practices
- Reference POA/DA artefacts explicitly in PR descriptions and review notes.
- Request design or product reviews when outcomes diverge from supplied artefacts.
- Pair with DA for changes that impact visual behaviour or user-facing interactions.
- Capture lessons learned in `prompt/3_development/log/` to evolve prompts and increase future ASS.
