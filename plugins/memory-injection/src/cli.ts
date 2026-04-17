import { Command } from 'commander'
import { MemoryInjector } from './injector.js'
import { InjectorConfig } from './config.js'
import * as readline from 'readline'

/**
 * Prompt for input
 */
function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

/**
 * Main CLI
 */
const program = new Command()
  .name('memory-injector')
  .description('Inject memories into Hermes sessions')
  .version('1.0.0')

  // Inject command
  .command('inject')
  .description('Inject memories based on context')
  .option('-m, --message <text>', "User's initial message")
  .option('-w, --working-dir <path>', 'Working directory')
  .option('-p, --project <name>', 'Project name')
  .option('--project-path <path>', 'Project path')
  .option('--language <language>', 'Project language')
  .option('-t, --tools <list>', 'Available tools (comma-separated)')
  .option('--max-total <number>', 'Maximum total memories', '10')
  .option('--max-gbrain <number>', 'Maximum GBrain memories', '5')
  .option('--max-clawmem <number>', 'Maximum ClawMem memories', '5')
  .option('--min-relevance <number>', 'Minimum relevance (0-1)', '0.6')
  .option('--dry-run', 'Preview injection without writing')
  .action(async (options) => {
    const config: InjectorConfig = {
      cliPath: '/Users/embaobao/workspace/memory-system-cli',
      maxResults: 10,
      maxTotalMemories: parseInt(options.maxTotal),
      maxGBrainMemories: parseInt(options.maxGbrain),
      maxClawMemMemories: parseInt(options.maxClawmem),
      minRelevance: parseFloat(options.minRelevance),
      strategy: 'hybrid',
    }

    // Build context
    const context = {
      userMessage: options.message || await askQuestion('Enter user message: '),
      workingDirectory: options.workingDir,
      projectContext: options.project ? {
        name: options.project,
        path: options.projectPath || '',
        language: options.language,
      } : undefined,
      tools: options.tools ? options.tools.split(',').map((t: string) => t.trim()) : [],
    }

    console.log('\n🔍 Analyzing context and searching memories...\n')

    const injector = new MemoryInjector(config)

    try {
      const result = await injector.inject(context)

      console.log('✅ Injection complete!\n')
      console.log(`📊 Statistics:`)
      console.log(`   Total injected: ${result.injected}`)
      console.log(`   GBrain: ${result.breakdown.gbrain}`)
      console.log(`   ClawMem: ${result.breakdown.clawmem}`)
      console.log(`   Strategy: ${result.strategy}`)
      console.log(`   Time: ${result.processingTime}ms`)

      console.log('\n💡 Memory block ready for injection into session')

      if (options.dryRun) {
        console.log('\n📋 Dry run mode - memory block saved to session memory file')
      }
    } catch (error) {
      console.log(`\n❌ Injection failed: ${error}`)
    }
  })

  // Test command
  .command('test')
  .description('Test injection with sample context')
  .action(async () => {
    const config: InjectorConfig = {
      cliPath: '/Users/embaobao/workspace/memory-system-cli',
      maxResults: 10,
      maxTotalMemories: 10,
      maxGBrainMemories: 5,
      maxClawMemMemories: 5,
      minRelevance: 0.6,
      strategy: 'hybrid',
    }

    console.log('\n🧪 Running test injection...\n')

    const injector = new MemoryInjector(config)

    // Test context
    const context = {
      userMessage: 'Help me debug this TypeScript error in the payment service',
      workingDirectory: '/Users/embaobao/workspace/payment-service',
      projectContext: {
        name: 'payment-service',
        path: '/Users/embaobao/workspace/payment-service',
        language: 'typescript',
      },
      tools: ['read_file', 'write_file', 'terminal', 'search_files'],
    }

    try {
      const result = await injector.inject(context)

      console.log('✅ Test complete!\n')
      console.log(`📊 Results:`)
      console.log(`   Total injected: ${result.injected}`)
      console.log(`   GBrain: ${result.breakdown.gbrain}`)
      console.log(`   ClawMem: ${result.breakdown.clawmem}`)
      console.log(`   Time: ${result.processingTime}ms`)
    } catch (error) {
      console.log(`\n❌ Test failed: ${error}`)
    }
  })

  // Stats command
  .command('stats')
  .description('Show injector statistics')
  .action(() => {
    console.log('Memory Injector Statistics\n')

    // Show configuration
    console.log('📋 Configuration:')
    console.log('   CLI Path: /Users/embaobao/workspace/memory-system-cli')
    console.log('   Max Results: 10')
    console.log('   Max Total Memories: 10')
    console.log('   Max GBrain Memories: 5')
    console.log('   Max ClawMem Memories: 5')
    console.log('   Min Relevance: 0.6')
    console.log('   Strategy: hybrid')
  })

// Run CLI
program.parse(process.argv)
