import { createInterface } from 'readline'
import { join } from 'path'
import { existsSync } from 'fs'

const LANG_MAP: Record<string, string> = {
  en: 'English', english: 'English',
  ja: 'Japanese', japanese: 'Japanese',
  fr: 'French', french: 'French',
  de: 'German', german: 'German',
  es: 'Spanish', spanish: 'Spanish',
  zh: 'Chinese', chinese: 'Chinese',
  ko: 'Korean', korean: 'Korean',
  pt: 'Portuguese', portuguese: 'Portuguese',
}

function resolveLanguage(raw: string): string {
  return LANG_MAP[raw.toLowerCase()] ?? raw
}

function getArg(args: string[], name: string): string | undefined {
  for (const arg of args) {
    if (arg.startsWith(`${name}=`)) return arg.slice(name.length + 1)
  }
  const idx = args.indexOf(name)
  return idx !== -1 ? args[idx + 1] : undefined
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function runSession(
  workflow: Awaited<ReturnType<typeof import('../../mastra/workflows/cape-session.js').capeSessionWorkflow['createRun']>>,
  taskId: string,
  objective: string,
  language: string,
): Promise<void> {
  const line = '='.repeat(54)
  console.log(`\n${line}`)
  console.log('  CAPE Session')
  console.log(line)
  console.log(`  Task     : ${taskId}`)
  console.log(`  Objective: ${objective}`)
  console.log(`  Language : ${language}`)
  console.log(`  Agents   : CM(Opening) -> POA -> DA -> DevA -> CM(Retrospective)`)
  console.log(`${line}\n`)

  await workflow.start({ inputData: { taskId, objective, language } })

  console.log(`\n${line}`)
  console.log('  Session complete!')
  console.log('  Artifacts -> cape/5_sessions/')
  console.log(`${line}\n`)
}

export async function start(args: string[]): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set.')
    process.exit(1)
  }

  const capeDir = join(process.cwd(), 'cape')
  if (!existsSync(capeDir)) {
    console.error('Error: cape/ directory not found. Run `cape init` first.')
    process.exit(1)
  }

  if (!process.env.CAPE_PROMPT_DIR) {
    process.env.CAPE_PROMPT_DIR = capeDir
  }

  const language = resolveLanguage(getArg(args, '--lang') ?? 'en')
  const fixedObjective = getArg(args, '--objective')
  const { capeSessionWorkflow } = await import('../../mastra/workflows/cape-session.js')

  // --objective flag: run once and exit
  if (fixedObjective) {
    const taskId = getArg(args, '--task') ?? `task-${Date.now()}`
    const run = await capeSessionWorkflow.createRun()
    try {
      await runSession(run, taskId, fixedObjective, language)
    } catch (err) {
      console.error('\nSession failed:', err)
      process.exit(1)
    }
    return
  }

  // Interactive loop: prompt for objective after each session
  console.log('\n  CAPE — interactive mode  (empty line to quit)\n')
  let sessionIndex = 0

  while (true) {
    const objective = await prompt('Objective: ')
    if (!objective) {
      console.log('  Goodbye.')
      break
    }

    sessionIndex++
    const taskId = `task-${Date.now()}`
    const run = await capeSessionWorkflow.createRun()
    try {
      await runSession(run, taskId, objective, language)
    } catch (err) {
      console.error('\nSession failed:', err)
      const again = await prompt('Continue with a new session? [Y/n]: ')
      if (again.toLowerCase() === 'n') break
    }
  }
}
