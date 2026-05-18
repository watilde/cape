#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { init } from './commands/init.js'
import { start } from './commands/start.js'

const envPath = join(process.cwd(), '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
}

const [, , command, ...args] = process.argv

switch (command) {
  case 'init':
    init(args)
    break
  case 'start':
    start(args)
    break
  default:
    console.log('Usage: cape <command> [options]')
    console.log('')
    console.log('Commands:')
    console.log('  init         Initialize a cape/ directory from the framework template')
    console.log('  start        Start a CAPE session')
    console.log('')
    console.log('Options:')
    console.log('  --task       Task ID (default: task-<timestamp>)')
    console.log('  --objective  Session objective (prompts interactively if omitted)')
    console.log('  --lang       Session language, e.g. ja, en, fr (default: English)')
    console.log('  --force      Overwrite existing cape/ directory (init only)')
    process.exit(command ? 1 : 0)
}
