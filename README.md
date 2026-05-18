# CAPE

**Collaborative Agents Prompt Engineering** — a multi-agent AI framework that runs a full product session (Product Owner → Designer → Developer) with a Cape Master facilitating and retrospecting.

## Prerequisites

- Node.js 20+
- An Anthropic API key

## Install

```bash
npm install -g @watilde/cape
```

Or use locally:

```bash
npm install
npm run build
```

## Setup

Create a `.env` file in your project directory:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Then initialize CAPE in your project:

```bash
cd your-project
cape init
```

`cape init` asks a few questions about your app and generates the `cape/` directory with team context files that agents read during sessions.

## Run a session

```bash
cape start
```

You'll be prompted for an objective. After each session completes, you're prompted again — press Enter on an empty line to quit.

```
Objective: Add a dark mode toggle
...session runs...

Objective: Fix the login error on mobile
...session runs...

Objective:   ← empty Enter to quit
```

Or run a single session via flags:

```bash
cape start --objective "Add a dark mode toggle" --lang ja
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--objective` | (interactive) | Session objective |
| `--lang` | `en` | Output language (`en`, `ja`, `fr`, `de`, `es`, `zh`, `ko`, `pt`) |
| `--task` | `task-<timestamp>` | Custom task ID |

## Agents

| Agent | Role |
|-------|------|
| CM (Cape Master) | Opens session with DoR check + coaching; closes with KPT retrospective |
| POA | Product Owner — acceptance criteria, business value |
| DA | Designer — UX rationale, component specs |
| DevA | Developer — implementation plan + writes files to your project |

## Session output

- `cape/5_sessions/pair/` — raw agent artifacts (JSON)
- `cape/5_sessions/retrospective/` — per-session KPT markdown
- `cape/5_sessions/retrospective/kpt_merged.md` — accumulated KPT across all sessions (read by CM at next session opening)

## Environment variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Required |
| `CAPE_PROMPT_DIR` | Path to your `cape/` directory (auto-set by `cape start`) |
| `CAPE_PROJECT_DIR` | Root where DevA writes implementation files (defaults to `cwd`) |
