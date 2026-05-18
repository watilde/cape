---
type: input
---

# Project Standards

## Coding Standards
- [Language/runtime]: [e.g., TypeScript strict mode, prefer immutability, modules ≤200 lines]
- [Architectural constraint]: [e.g., Separate business logic from presentation/transport concerns]
- [Input validation policy]: [e.g., Validate all external inputs at system boundaries]
- [Style/comment policy]: [e.g., Comment only when logic is non-obvious]

## Testing Expectations
- **Unit**: [What to unit test — e.g., core logic, calculations, isolated module behaviour]
- **Integration**: [What to integration test — e.g., cross-module contracts, persistence round-trips]
- **End-to-End**: [What to E2E test — e.g., critical user journeys against acceptance criteria]
- [Regression policy]: [e.g., Automate regression checks; manual QA must include reproducibility steps]

## Tooling
- **Language**: [e.g., TypeScript 5.x]
- **Test runner**: [e.g., Vitest / Jest / pytest]
- **Linter**: [e.g., ESLint / Ruff]
- **CI**: [e.g., GitHub Actions]
- **Key commands**: [e.g., `npm run lint`, `npm test`, `npm run build`]
