import { Mastra } from "@mastra/core/mastra";
import { poaAgent } from "./agents/poa.js";
import { daAgent } from "./agents/da.js";
import { devaAgent } from "./agents/deva.js";
import { cmAgent } from "./agents/cm.js";
import { capeSessionWorkflow } from "./workflows/cape-session.js";

export const mastra = new Mastra({
  agents: { poaAgent, daAgent, devaAgent, cmAgent },
  workflows: { capeSessionWorkflow },
});
