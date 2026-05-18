import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { cmAgent } from "../agents/cm.js";
import { poaAgent } from "../agents/poa.js";
import { daAgent } from "../agents/da.js";
import { devaAgent } from "../agents/deva.js";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_ROOT = process.env.CAPE_PROMPT_DIR ?? join(__dirname, "../../../../../prompt");
const SESSION_PAIR_DIR = join(PROMPT_ROOT, "5_sessions/pair");
const SESSION_RETRO_DIR = join(PROMPT_ROOT, "5_sessions/retrospective");

/** Saves the retrospective as a KPT markdown file. */
function saveRetrospectiveMd(dir: string, taskId: string, objective: string, rawText: string): void {
  const parsed = parseJson(rawText);
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);
  const timePart = now.toTimeString().slice(0, 5).replace(":", "-");
  const filename = `${datePart}_${timePart}_${taskId}.md`;

  const conversation = parsed?.conversation as Array<{ speaker: string; text: string }> | undefined;
  const kpt = parsed?.kpt as { keep: string[]; problem: string[]; try: string[] } | undefined;

  const lines: string[] = [
    `# Retrospective — ${taskId}`,
    ``,
    `**Date**: ${datePart} ${timePart.replace("-", ":")}  `,
    `**Session**: ${taskId}  `,
    `**Objective**: ${objective}`,
    ``,
  ];

  if (Array.isArray(conversation)) {
    lines.push(`## Conversation`, ``);
    for (const turn of conversation) {
      lines.push(`**${turn.speaker}**: ${turn.text}`, ``);
    }
  }

  if (kpt) {
    lines.push(`## KPT`, ``);
    lines.push(`### Keep`, ``);
    for (const item of kpt.keep ?? []) lines.push(`- ${item}`);
    lines.push(``);
    lines.push(`### Problem`, ``);
    for (const item of kpt.problem ?? []) lines.push(`- ${item}`);
    lines.push(``);
    lines.push(`### Try`, ``);
    for (const item of kpt.try ?? []) lines.push(`- ${item}`);
    lines.push(``);
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), lines.join("\n"), "utf-8");
  process.stdout.write(`\n  Retrospective saved: cape/5_sessions/retrospective/${filename}\n`);
}

function saveArtifact(dir: string, taskId: string, label: string, content: string) {
  mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(join(dir, `${taskId}_${label}_${ts}.json`), content, "utf-8");
}

/** Reads the accumulated KPT history file, returns empty string if none. */
function readMergedKpt(dir: string): string {
  const path = join(dir, "kpt_merged.md");
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf-8");
}

/** Appends this session's KPT items to the merged KPT file. */
function updateMergedKpt(dir: string, taskId: string, objective: string, rawText: string): void {
  const parsed = parseJson(rawText);
  const kpt = parsed?.kpt as { keep: string[]; problem: string[]; try: string[] } | undefined;
  if (!kpt) return;

  const path = join(dir, "kpt_merged.md");
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);
  const timePart = now.toTimeString().slice(0, 5);

  let existing = existsSync(path) ? readFileSync(path, "utf-8") : "";

  // Parse existing sections or start fresh
  const keepItems: string[] = [];
  const problemItems: string[] = [];
  const tryItems: string[] = [];

  if (existing) {
    let section = "";
    for (const line of existing.split("\n")) {
      if (line.startsWith("## Keep")) { section = "keep"; continue; }
      if (line.startsWith("## Problem")) { section = "problem"; continue; }
      if (line.startsWith("## Try")) { section = "try"; continue; }
      if (line.startsWith("##") || line.startsWith("# ") || line.startsWith("_")) continue;
      if (line.startsWith("- ")) {
        if (section === "keep") keepItems.push(line.slice(2));
        if (section === "problem") problemItems.push(line.slice(2));
        if (section === "try") tryItems.push(line.slice(2));
      }
    }
  }

  // Append new items tagged with session
  for (const item of kpt.keep ?? []) keepItems.push(`[${taskId}] ${item}`);
  for (const item of kpt.problem ?? []) problemItems.push(`[${taskId}] ${item}`);
  for (const item of kpt.try ?? []) tryItems.push(`[${taskId}] ${item}`);

  const sessionCount = (existing.match(/\[.*?\]/g) ?? []).length === 0
    ? 1
    : new Set((existing.match(/\[([^\]]+)\]/g) ?? []).map(s => s.slice(1, -1))).size + 1;

  const lines: string[] = [
    `# Accumulated KPT — CAPE Sessions`,
    ``,
    `_Last updated: ${datePart} ${timePart} (${taskId}, ${sessionCount} session${sessionCount > 1 ? "s" : ""})_`,
    ``,
    `## Keep`,
    ``,
    ...keepItems.map(i => `- ${i}`),
    ``,
    `## Problem`,
    ``,
    ...problemItems.map(i => `- ${i}`),
    ``,
    `## Try`,
    ``,
    ...tryItems.map(i => `- ${i}`),
    ``,
  ];

  mkdirSync(dir, { recursive: true });
  writeFileSync(path, lines.join("\n"), "utf-8");
  process.stdout.write(`\n  Merged KPT updated: cape/5_sessions/retrospective/kpt_merged.md\n`);
}

/** Streams an agent call, printing tokens in real-time, and returns the full text. */
async function streamAgent(agent: Agent, label: string, prompt: string): Promise<string> {
  process.stdout.write(`\n┌─ ${label} ${"─".repeat(Math.max(0, 50 - label.length))}\n`);
  const output = await agent.stream([{ role: "user", content: prompt }]);
  let fullText = "";
  const reader = output.textStream.getReader();
  process.stdout.write("│ ");
  let prev = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += value;
    for (const ch of value) {
      if (prev === "\\") {
        if      (ch === "n")  { process.stdout.write("\n│ "); }
        else if (ch === "t")  { process.stdout.write("    "); }
        else if (ch === "\\") { process.stdout.write("\\"); }
        else if (ch === '"')  { process.stdout.write('"'); }
        else                  { process.stdout.write("\\" + ch); }
        prev = "";
        continue;
      }
      if (ch === "\\") { prev = ch; continue; }
      prev = ch;
      if (ch === "\n") process.stdout.write("\n│ ");
      else process.stdout.write(ch);
    }
  }
  if (prev === "\\") process.stdout.write("\\");
  process.stdout.write(`\n└${"─".repeat(51)}\n`);
  return fullText;
}

/** Extracts and parses the JSON block from raw agent output. */
function parseJson(rawText: string): Record<string, unknown> | null {
  try {
    const match = rawText.match(/```json\s*([\s\S]*?)```/) ?? rawText.match(/(\{[\s\S]*\})/);
    if (!match) return null;
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/** Prints the agent's voice field as an inline quote. */
function printVoice(agentId: string, rawText: string): void {
  const parsed = parseJson(rawText);
  const voice = parsed?.voice as string | undefined;
  if (!voice) return;
  process.stdout.write(`\n💬 ${agentId}: "${voice}"\n`);
}

/** Renders the Cape Master opening brief to the terminal. */
function printCMOpening(rawText: string): void {
  const parsed = parseJson(rawText);
  if (!parsed) return;
  const voice = parsed.voice as string | undefined;
  const out = parsed.output as Record<string, unknown> | undefined;
  if (!out) return;

  const dor = out.dor_check as { passed: boolean; concerns: string[] } | undefined;
  const watchOut = out.watch_out as string[] | undefined;
  const coaching = out.coaching_notes as Record<string, string> | undefined;

  process.stdout.write("\n" + "═".repeat(54) + "\n");
  process.stdout.write("  🧢 Cape Master — Session Opening\n");
  process.stdout.write("═".repeat(54) + "\n");
  if (voice) process.stdout.write(`\n  💬 "${voice}"\n`);
  if (dor) {
    const dorIcon = dor.passed ? "✅" : "⚠️ ";
    process.stdout.write(`\n  ${dorIcon} DoR: ${dor.passed ? "passed" : "concerns found"}\n`);
    for (const c of dor.concerns ?? []) process.stdout.write(`     · ${c}\n`);
  }
  if (watchOut?.length) {
    process.stdout.write(`\n  👀 Watch out:\n`);
    for (const w of watchOut) process.stdout.write(`     · ${w}\n`);
  }
  if (coaching) {
    process.stdout.write(`\n  🎯 Coaching notes:\n`);
    for (const [agent, note] of Object.entries(coaching)) {
      process.stdout.write(`     ${agent.padEnd(5)} → ${note}\n`);
    }
  }
  process.stdout.write("\n" + "═".repeat(54) + "\n");
}

/** Renders the Cape Master retrospective conversation to the terminal. */
function printConversation(rawText: string): void {
  const parsed = parseJson(rawText);
  const conversation = parsed?.conversation as Array<{ speaker: string; text: string }> | undefined;
  if (!Array.isArray(conversation)) return;

  const speakerLabel: Record<string, string> = {
    CM:   "🧢 Cape Master",
    POA:  "🟡 POA",
    DA:   "🟣 DA",
    DevA: "🟢 DevA",
  };

  process.stdout.write("\n" + "═".repeat(54) + "\n");
  process.stdout.write("  🧢 Cape Master — Retrospective\n");
  process.stdout.write("═".repeat(54) + "\n\n");
  for (const turn of conversation) {
    const label = speakerLabel[turn.speaker] ?? turn.speaker;
    process.stdout.write(`${label}\n  ${turn.text}\n\n`);
  }
  process.stdout.write("═".repeat(54) + "\n");
}

// ── Schemas ────────────────────────────────────────────────────────────────────

const sessionInput  = z.object({ taskId: z.string(), objective: z.string(), language: z.string().default("English") });
const cmOpenOutput  = z.object({ cmOpenOutput: z.string() });
const poaOutput     = z.object({ poaOutput: z.string() });
const daOutput      = z.object({ daOutput: z.string() });
const devaOutput    = z.object({ devaOutput: z.string() });
const cmRetroOutput = z.object({ cmRetroOutput: z.string() });

// ── Step 0: Cape Master — Opening ──────────────────────────────────────────────
const cmOpenStep = createStep({
  id: "cm-open",
  inputSchema: sessionInput,
  outputSchema: cmOpenOutput,
  execute: async ({ inputData }) => {
    const { taskId, objective, language } = inputData;

    const kptHistory = readMergedKpt(SESSION_RETRO_DIR);
    const kptSection = kptHistory
      ? `\n## Historical KPT (from previous sessions)\n\nUse this to inform your coaching. Flag recurring Problems that haven't been addressed. Acknowledge Tries that were adopted.\n\n${kptHistory}\n`
      : "";

    const prompt = `
Task ID: ${taskId}
Session language: ${language}

## Objective
${objective}
${kptSection}
Phase: Session Opening

Review the objective, check DoR readiness, and open the session as Cape Master.
All voice and conversation text must be in ${language}.
Output strictly as the JSON format for Phase 1 (opening) in your instructions.
`.trim();

    const text = await streamAgent(cmAgent, "CM (Cape Master — Opening)", prompt);
    printCMOpening(text);
    saveArtifact(SESSION_PAIR_DIR, taskId, "0_cm_open", JSON.stringify({ raw: text }, null, 2));
    return { cmOpenOutput: text };
  },
});

// ── Step 1: POA ────────────────────────────────────────────────────────────────
const poaStep = createStep({
  id: "poa",
  inputSchema: cmOpenOutput,
  outputSchema: poaOutput,
  execute: async ({ inputData, getInitData }) => {
    const { taskId, objective, language } = getInitData<typeof sessionInput._type>();
    const { cmOpenOutput: cmOpenText } = inputData;

    const prompt = `
Task ID: ${taskId}
Session language: ${language}

## Objective
${objective}

## Cape Master's Session Brief (read before you start)
${cmOpenText}

Produce your Product Owner output for this task. Include:
- Business value statement
- Acceptance criteria (Given-When-Then format)
- Priority rationale
- User impact measurement approach

Your "voice" field must be in ${language}.
Output strictly as the JSON format defined in your instructions.
`.trim();

    const text = await streamAgent(poaAgent, "POA (Product Owner Agent)", prompt);
    printVoice("POA", text);
    saveArtifact(SESSION_PAIR_DIR, taskId, "1_poa", JSON.stringify({ raw: text }, null, 2));
    return { poaOutput: text };
  },
});

// ── Step 2: DA ─────────────────────────────────────────────────────────────────
const daStep = createStep({
  id: "da",
  inputSchema: poaOutput,
  outputSchema: daOutput,
  execute: async ({ inputData, getInitData, getStepResult }) => {
    const { taskId, objective, language } = getInitData<typeof sessionInput._type>();
    const { poaOutput: poaText } = inputData;
    const cmOpenText = getStepResult<typeof cmOpenOutput._type>("cm-open")?.cmOpenOutput ?? "";

    const prompt = `
Task ID: ${taskId}
Session language: ${language}

## Objective
${objective}

## Cape Master's Session Brief
${cmOpenText}

## POA Output (reference)
${poaText}

Produce your Designer output. Include:
- Design rationale
- UX approach following Gridpark's code-first + playful productivity principles
- Component/interaction specifications
- Apply brand: Violet #B197FC, Navy #1C2541, JetBrains Mono for code

Your "voice" field must be in ${language}.
Output strictly as the JSON format defined in your instructions.
`.trim();

    const text = await streamAgent(daAgent, "DA (Designer Agent)", prompt);
    printVoice("DA", text);
    saveArtifact(SESSION_PAIR_DIR, taskId, "2_da", JSON.stringify({ raw: text }, null, 2));
    return { daOutput: text };
  },
});

// ── Step 3: DevA ───────────────────────────────────────────────────────────────
const devaStep = createStep({
  id: "deva",
  inputSchema: daOutput,
  outputSchema: devaOutput,
  execute: async ({ inputData, getInitData, getStepResult }) => {
    const { taskId, objective, language } = getInitData<typeof sessionInput._type>();
    const { daOutput: daText } = inputData;
    const cmOpenText = getStepResult<typeof cmOpenOutput._type>("cm-open")?.cmOpenOutput ?? "";
    const poaText = getStepResult<typeof poaOutput._type>("poa")?.poaOutput ?? "";

    const prompt = `
Task ID: ${taskId}
Session language: ${language}

## Objective
${objective}

## Cape Master's Session Brief
${cmOpenText}

## POA Output (reference)
${poaText}

## DA Output (reference)
${daText}

Produce your Developer output. Include:
- Technical approach aligned with Electron + React + TypeScript architecture
- File paths under src/renderer/ or src/lib/
- State management decisions (db.ts vs Redux slice)
- Core code snippet(s)
- Test strategy

Your "voice" field must be in ${language}.
Output strictly as the format defined in your instructions (Plan JSON + Implementation files).
`.trim();

    const text = await streamAgent(devaAgent, "DevA (Developer Agent)", prompt);
    printVoice("DevA", text);

    const projectRoot = process.env.CAPE_PROJECT_DIR ?? process.cwd();
    const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
    let match;
    const written: string[] = [];
    while ((match = fileRegex.exec(text)) !== null) {
      const [, relPath, content] = match;
      const fullPath = join(projectRoot, relPath);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, content.trimStart(), "utf-8");
      written.push(relPath);
    }
    if (written.length > 0) {
      process.stdout.write("\n  Files written:\n");
      for (const f of written) process.stdout.write(`    + ${f}\n`);
    }

    saveArtifact(SESSION_PAIR_DIR, taskId, "3_deva", JSON.stringify({ raw: text, files: written }, null, 2));
    return { devaOutput: text };
  },
});

// ── Step 4: Cape Master — Retrospective ────────────────────────────────────────
const cmRetroStep = createStep({
  id: "cm-retro",
  inputSchema: devaOutput,
  outputSchema: cmRetroOutput,
  execute: async ({ inputData, getInitData, getStepResult }) => {
    const { taskId, objective, language } = getInitData<typeof sessionInput._type>();
    const { devaOutput: devaText } = inputData;
    const cmOpenText = getStepResult<typeof cmOpenOutput._type>("cm-open")?.cmOpenOutput ?? "";
    const poaText    = getStepResult<typeof poaOutput._type>("poa")?.poaOutput ?? "";
    const daText     = getStepResult<typeof daOutput._type>("da")?.daOutput ?? "";

    const prompt = `
Task ID: ${taskId}
Session language: ${language}

## Objective
${objective}

Phase: Retrospective

## Your Opening Notes (from the start of this session)
${cmOpenText}

## POA Output
${poaText}

## DA Output
${daText}

## DevA Output (plan + implementation)
${devaText}

Facilitate the retrospective as Cape Master.
Reference your opening concerns — did they materialize?
Note what was actually implemented by DevA.
Generate an honest team conversation with real reflections from POA, DA, and DevA.
All conversation text must be in ${language}.
Output strictly as the JSON format for Phase 2 (retrospective) in your instructions.
`.trim();

    const text = await streamAgent(cmAgent, "CM (Cape Master — Retrospective)", prompt);
    printConversation(text);
    saveRetrospectiveMd(SESSION_RETRO_DIR, taskId, objective, text);
    updateMergedKpt(SESSION_RETRO_DIR, taskId, objective, text);
    saveArtifact(SESSION_RETRO_DIR, taskId, "retro", JSON.stringify({ raw: text }, null, 2));
    return { cmRetroOutput: text };
  },
});

// ── Workflow ───────────────────────────────────────────────────────────────────
export const capeSessionWorkflow = createWorkflow({
  id: "cape-session",
  inputSchema: sessionInput,
  outputSchema: cmRetroOutput,
})
  .then(cmOpenStep)
  .then(poaStep)
  .then(daStep)
  .then(devaStep)
  .then(cmRetroStep);

capeSessionWorkflow.commit();

export { cmOpenStep, poaStep, daStep, devaStep, cmRetroStep };
