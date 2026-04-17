#!/usr/bin/env node

import { AutoMemoryExtractor } from './dist/extractor.js'
import { readFileSync } from 'fs'

const config = {
  cliPath: '/Users/embaobao/workspace/memory-system-cli',
  importanceThreshold: 0.5,
  duplicateThreshold: 0.95,
}

const sessionPath = process.argv[2] || '~/.hermes/sessions/session_20260417_195907_8d9514.json'

console.log(`\n🧪 Testing Memory Extractor`)
console.log(`Session: ${sessionPath}`)
console.log(`Config:`, config)
console.log()

// Load session
try {
  const content = readFileSync(sessionPath.replace('~', process.env.HOME || ''), 'utf-8')
  const data = JSON.parse(content)

  console.log('✅ Session loaded')
  console.log(`Session ID: ${data.session_id}`)
  console.log(`Total messages: ${data.messages?.length || 0}`)
  console.log()

  // Extract tool usage
  const toolCalls = []
  const filesAccessed = new Set()

  if (data.messages) {
    for (const msg of data.messages) {
      if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
        for (const tc of msg.tool_calls) {
          if (tc.function && tc.function.name) {
            const args = JSON.parse(tc.function.arguments || '{}')
            if (args.path) filesAccessed.add(args.path)

            toolCalls.push({
              name: tc.function.name,
              arguments: args,
              result: undefined,
            })
          }
        }
      }
    }
  }

  console.log(`Tool calls: ${toolCalls.length}`)
  console.log(`Files accessed: ${filesAccessed.size}`)
  console.log(`Sample tools: ${toolCalls.slice(0, 5).map(t => t.name).join(', ')}`)

  const extractor = new AutoMemoryExtractor(config)

  // Create session data
  const sessionData = {
    sessionId: data.session_id || 'unknown',
    timestamp: data.session_start || new Date().toISOString(),
    messages: (data.messages || []).map((msg) => {
      let toolCall
      if (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        const tc = msg.tool_calls[0]
        if (tc.function && tc.function.name) {
          toolCall = {
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments || '{}'),
            result: undefined,
          }
        }
      }

      return {
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        timestamp: msg.timestamp || new Date().toISOString(),
        toolCall,
      }
    }),
    toolUsage: {
      totalCalls: toolCalls.length,
      topTools: toolCalls.slice(0, 10),
      filesAccessed: Array.from(filesAccessed),
    },
    totalTokens: 0,
  }

  console.log()
  console.log('🔍 Analyzing session...')
  console.log()

  const result = await extractor.extract(sessionData)

  console.log('✅ Extraction complete!')
  console.log()
  console.log('📊 Results:')
  console.log(`  GBrain: ${result.gbrainAdded} added, ${result.updated} updated, ${result.skipped} skipped`)
  console.log(`  ClawMem: ${result.clawmemAdded} added, ${result.updated} updated, ${result.skipped} skipped`)
  console.log(`  Time: ${result.processingTime}ms`)
  console.log()

  if (result.changes.length > 0) {
    console.log('📝 Changes:')
    result.changes.slice(0, 10).forEach((change, idx) => {
      console.log(`  [${idx + 1}] ${change.target} | ${change.action} | ${change.identifier.substring(0, 60)}`)
    })
    if (result.changes.length > 10) {
      console.log(`  ... and ${result.changes.length - 10} more changes`)
    }
  }

} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}
