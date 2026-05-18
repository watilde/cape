import { createInterface } from 'readline'
import { existsSync, mkdirSync, readdirSync, readFileSync, copyFileSync, statSync, writeFileSync } from 'fs'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'
import { Agent } from '@mastra/core/agent'
import { anthropic } from '@ai-sdk/anthropic'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Works from both src/cli/commands/ (tsx) and dist/cli/commands/ (compiled)
const TEMPLATE_DIR = join(__dirname, '../../../cape')

const INPUT_FILES = [
  '1_product/1_mvv.md',
  '1_product/2_persona.md',
  '1_product/3_milestone.md',
  '1_product/4_backlog.md',
  '2_design/1_principle.md',
  '2_design/2_brand.md',
  '3_development/1_architecture.md',
  '3_development/3_standards.md',
]

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function gatherAnswers(): Promise<Record<string, string>> {
  console.log('Answer in natural language — be as specific as you like.\n')
  return {
    app:        await prompt('What are you building? Describe the app.\n> '),
    users:      await prompt('\nWho are the main users?\n> '),
    problem:    await prompt('\nWhat problem does it solve?\n> '),
    stack:      await prompt('\nWhat is the tech stack? (language, framework, platform)\n> '),
    design:     await prompt('\nWhat does the visual design feel like? (colors, aesthetic, personality)\n> '),
    features:   await prompt('\nWhat are the 3-5 most important features for v1?\n> '),
  }
}

const FILE_SCHEMAS: Record<string, string> = {
  '1_product/1_mvv.md': 'Mission (one sentence), Vision (one sentence), 3 Values with descriptions, Target Market (primary users + core need), Product Positioning (differentiators), Success Vision (short/medium/long-term), Status/Platform/Philosophy',
  '1_product/2_persona.md': 'Primary Persona (profile, pain points, core needs, success scenarios), Secondary Persona, Tertiary Persona, Shared Characteristics (common pain points, goals, value proposition)',
  '1_product/3_milestone.md': 'Release Philosophy, v1.0.0 with core features + success criteria, v2.0.0, v3.0.0, Definition of Done, Success Measurement',
  '1_product/4_backlog.md': 'Priority level table, 2 Epics with user stories (US-001 to US-005) in Given/When/Then format with acceptance criteria, Definition of Done',
  '2_design/1_principle.md': 'Core Philosophy (one sentence), 4 Design Values with definition + application + design questions, Decision Framework (priority order), Anti-Patterns to Avoid, Success Indicators',
  '2_design/2_brand.md': 'Brand Identity, Color Palette (core + neutral + accent colors with hex codes), Typography (fonts + CSS usage), Voice & Tone (brand voice traits + tone by context)',
  '3_development/1_architecture.md': 'System North Star (goals + tradeoffs), Layer Architecture, 5 Core Modules with responsibilities, Data & Event Flow (step by step), Non-Functional Guardrails (security, performance, offline, testing, telemetry), Evolution Roadmap',
  '3_development/3_standards.md': 'Coding Standards (language rules, architectural constraints, validation policy, comment policy), Testing Expectations (unit/integration/e2e), Tooling (language, test runner, linter, CI, key commands)',
}

async function generateInputFiles(answers: Record<string, string>, dest: string): Promise<void> {
  const context = `App: ${answers.app}
Target users: ${answers.users}
Problem solved: ${answers.problem}
Tech stack: ${answers.stack}
Design aesthetic: ${answers.design}
v1 features: ${answers.features}`

  const agent = new Agent({
    id: 'cape-init',
    name: 'CAPE Init Agent',
    instructions: `You are a technical writer setting up a new CAPE project.
Generate a single documentation file based on the product description. All content must be in English.
Be specific and concrete — no placeholder text like [Value] or [Description].`,
    model: anthropic('claude-haiku-4-5-20251001'),
  })

  let written = 0
  const pending = new Set(Object.keys(FILE_SCHEMAS))

  process.stdout.write(`  Generating (0/${pending.size})`)

  await Promise.all(
    Object.entries(FILE_SCHEMAS).map(async ([relPath, schema]) => {
      const userPrompt = `## Product Information\n${context}\n\n## Task\nGenerate the file "${relPath}" with these sections: ${schema}.\n\nOutput the file in exactly this format:\n\n<file path="${relPath}">\n---\ntype: input\n---\n\n[content]\n</file>\n\nEvery listed section must appear as a markdown heading. No generic placeholders.`

      const result = await agent.generate([{ role: 'user', content: userPrompt }])
      const match = result.text.match(/<file path="[^"]+">([\s\S]*?)<\/file>/)
      if (match) {
        const fullPath = join(dest, relPath)
        mkdirSync(dirname(fullPath), { recursive: true })
        writeFileSync(fullPath, match[1].trimStart(), 'utf-8')
        written++
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(`  Generating (${written}/${pending.size}) — done: ${relPath}`)
      }
    })
  )

  process.stdout.write('\n\n')

  if (written === 0) {
    console.warn('  Warning: no files were generated. Fill in cape/ manually.')
  }
}

function copyRecursive(src: string, dest: string, collected: string[]): void {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    if (statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath, collected)
    } else if (!entry.startsWith('.')) {
      copyFileSync(srcPath, destPath)
      if (entry.endsWith('.md')) collected.push(destPath)
    }
  }
}

function getType(filePath: string): string | null {
  const content = readFileSync(filePath, 'utf-8')
  const match = content.match(/^---\s*\ntype:\s*(\w+)/)
  return match ? match[1] : null
}

export async function init(args: string[]): Promise<void> {
  const force = args.includes('--force')
  const dest = join(process.cwd(), 'cape')

  if (existsSync(dest) && !force) {
    console.error('cape/ already exists. Use --force to overwrite.')
    process.exit(1)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set.')
    process.exit(1)
  }

  const line = '='.repeat(54)
  console.log(`\n${line}`)
  console.log('  CAPE Init')
  console.log(`${line}\n`)

  const answers = await gatherAnswers()

  console.log('\nCopying framework files...')
  const copiedFiles: string[] = []
  copyRecursive(TEMPLATE_DIR, dest, copiedFiles)

  console.log('\nGenerating project files from your answers...\n')
  await generateInputFiles(answers, dest)

  const genericFiles = copiedFiles.filter(f => getType(f) === 'generic')
  if (genericFiles.length > 0) {
    console.log('Framework files (do not modify):')
    for (const f of genericFiles) console.log(`  ${relative(process.cwd(), f)}`)
  }

  console.log(`\n${line}`)
  console.log('  cape/ initialized successfully!')
  console.log(`${line}\n`)
}
