import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// CAPE_PROMPT_DIR overrides the default prompt directory
const PROMPT_ROOT = process.env.CAPE_PROMPT_DIR ?? join(__dirname, "../../..", "prompt");

function load(relativePath: string): string {
  try {
    return readFileSync(join(PROMPT_ROOT, relativePath), "utf-8").trim();
  } catch {
    return `[doc not found: ${relativePath}]`;
  }
}

export const docs = {
  // 0_team
  protocol: load("0_team/0_protocol.md"),
  culture: load("0_team/1_culture .md"),
  dor: load("0_team/2_dor.md"),
  dod: load("0_team/3_dod.md"),

  // 1_product
  poaRole: load("1_product/0_role.md"),
  mvv: load("1_product/1_mvv.md"),
  persona: load("1_product/2_persona.md"),
  milestone: load("1_product/3_milestone.md"),
  backlog: load("1_product/4_backlog.md"),

  // 2_design
  daRole: load("2_design/0_role.md"),
  designPrinciple: load("2_design/1_principle.md"),
  brand: load("2_design/2_brand.md"),

  // 3_development
  devaRole: load("3_development/0_role.md"),
  architecture: load("3_development/1_architecture.md"),
  guideline: load("3_development/2_guideline.md"),

  // 4_orchestration
  soaRole: load("4_orchestration/0_role.md"),
};

/** Shared preamble injected into every agent */
export const sharedContext = `
${docs.protocol}

---

${docs.culture}

---

${docs.dor}

---

${docs.dod}
`.trim();

export const productContext = `
${docs.mvv}

---

${docs.persona}

---

${docs.milestone}
`.trim();
