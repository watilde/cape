import { createTool } from "@mastra/core/tools";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSION_DIR = join(
  __dirname,
  "../../../../../prompt/5_sessions",
);

export const sessionLoggerTool = createTool({
  id: "session-logger",
  description:
    "Saves CAPE session artifacts (agent outputs, metrics) to prompt/5_sessions/",
  inputSchema: z.object({
    type: z.enum(["pair", "retrospective"]),
    taskId: z.string(),
    content: z.string(),
  }),
  outputSchema: z.object({ path: z.string() }),
  execute: async ({ type, taskId, content }) => {
    const dir = join(SESSION_DIR, type);
    mkdirSync(dir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${taskId}_${ts}.json`;
    const fullPath = join(dir, filename);
    writeFileSync(fullPath, content, "utf-8");
    return { path: fullPath };
  },
});
