#!/usr/bin/env tsx
/**
 * CAPE Session Runner
 *
 * Usage:
 *   npm run run:session -- --task "task-001" --objective "Add dark mode toggle"
 */

import { capeSessionWorkflow } from "./mastra/workflows/cape-session.js";

const args = process.argv.slice(2);
const taskId = args[args.indexOf("--task") + 1] ?? `task-${Date.now()}`;
const objIdx = args.indexOf("--objective");
const objective =
  objIdx !== -1
    ? args[objIdx + 1]
    : "Define, design, and implement a new feature for Gridpark.";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌  ANTHROPIC_API_KEY is not set.");
  process.exit(1);
}

console.log(`\n${"═".repeat(52)}`);
console.log(`  🏁  CAPE Session`);
console.log(`${"═".repeat(52)}`);
console.log(`  Task ID  : ${taskId}`);
console.log(`  Objective: ${objective}`);
console.log(`  Agents   : CM(Opening) -> POA -> DA -> DevA -> CM(Retrospective)`);
console.log(`${"═".repeat(52)}\n`);

const run = await capeSessionWorkflow.createRun();

try {
  await run.start({ inputData: { taskId, objective } });
  console.log(`\n${"═".repeat(52)}`);
  console.log(`  ✅  Session complete!`);
  console.log(`  📁  Artifacts → prompt/5_sessions/`);
  console.log(`${"═".repeat(52)}\n`);
} catch (err) {
  console.error("\n❌  Session failed:", err);
  process.exit(1);
}
