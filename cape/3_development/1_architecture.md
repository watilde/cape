---
type: input
---

# Architecture

## System North Star
[One paragraph describing the core architectural goals and constraints for this product. What must the architecture guarantee? What tradeoffs are explicitly accepted?]

## Process / Layer Architecture
- **[Layer 1]** (e.g., `src/server/`): [Responsibility. What it owns. What it must never do.]
- **[Layer 2]** (e.g., `src/api/`): [Responsibility. Boundary conditions.]
- **[Layer 3]** (e.g., `src/client/`): [Responsibility. How it interacts with other layers.]

## Core Modules
1. **[Module 1 Name]**
   - [What it owns and how it stores/manages state]
   - [Key operations or patterns it exposes]
   - [Concurrency or isolation model, if relevant]

2. **[Module 2 Name]**
   - [Purpose and responsibility]
   - [Interaction pattern with other modules]

3. **[Module 3 Name]**
   - [Purpose and responsibility]
   - [State management approach]

4. **[Module 4 Name]**
   - [Purpose — e.g., extensibility, plugins, integrations]
   - [Isolation and security model]

5. **[Module 5 Name]**
   - [Persistence approach — local, remote, sync strategy]
   - [Format and serialization choices]

## Data & Event Flow
1. [Step 1: How user intent enters the system]
2. [Step 2: How it is processed]
3. [Step 3: How state is updated]
4. [Step 4: How the UI or output is updated]
5. [Step 5: How observability or logging is captured]

## Non-Functional Guardrails
- **Security**: [Security constraints and policies]
- **Performance**: [Performance targets and techniques]
- **Offline/Resilience**: [Behaviour when external services are unavailable]
- **Testing**: [Testing strategy — unit, integration, e2e]
- **Telemetry**: [What is logged, where, and for what purpose]

## Evolution Roadmap
- **Phase 1 (MVP)**: [Core stabilization goals]
- **Phase 2**: [First expansion — what new capability is introduced]
- **Phase 3**: [Maturity — extensibility or scalability targets]

Respect these guardrails when proposing technical solutions; deviations require explicit rationale and traceability back to product principles.
