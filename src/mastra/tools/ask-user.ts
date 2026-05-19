import { createTool } from "@mastra/core/tools";
import { createInterface } from "readline";
import { z } from "zod";

export const askUserTool = createTool({
  id: "ask_user",
  description:
    "Ask the human executor a clarifying question and wait for their answer. " +
    "Use only when critical information is missing and cannot be reasonably inferred. " +
    "Ask one specific question at a time.",
  inputSchema: z.object({
    question: z.string().describe("The specific question to ask"),
  }),
  outputSchema: z.object({ answer: z.string() }),
  execute: async ({ question }: { question: string }) => {
    return new Promise<{ answer: string }>((resolve) => {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      process.stdout.write(`\n\n❓ ${question}\n  → `);
      rl.once("line", (answer) => {
        rl.close();
        process.stdout.write("\n");
        resolve({ answer: answer.trim() });
      });
    });
  },
});
