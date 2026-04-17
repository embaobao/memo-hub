import { Command } from 'commander';
import { AutoMemoryExtractor } from './extractor.js';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';
/**
 * Load session data from file
 */
function loadSession(sessionPath) {
    try {
        const content = readFileSync(sessionPath, 'utf-8');
        const data = JSON.parse(content);
        // Extract tool usage from messages
        const toolCalls = [];
        const filesAccessed = new Set();
        if (data.messages) {
            for (const msg of data.messages) {
                if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
                    for (const tc of msg.tool_calls) {
                        if (tc.function && tc.function.name) {
                            const args = JSON.parse(tc.function.arguments || '{}');
                            if (args.path)
                                filesAccessed.add(args.path);
                            toolCalls.push({
                                name: tc.function.name,
                                arguments: args,
                                result: undefined,
                            });
                        }
                    }
                }
            }
        }
        // Count tools
        const toolCounts = new Map();
        for (const tc of toolCalls) {
            toolCounts.set(tc.name, (toolCounts.get(tc.name) || 0) + 1);
        }
        const topTools = Array.from(toolCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
        return {
            sessionId: data.session_id || data.id || 'unknown',
            timestamp: data.session_start || data.timestamp || new Date().toISOString(),
            messages: (data.messages || []).map((msg) => {
                // Extract tool call info
                let toolCall;
                if (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
                    const tc = msg.tool_calls[0];
                    if (tc.function && tc.function.name) {
                        toolCall = {
                            name: tc.function.name,
                            arguments: JSON.parse(tc.function.arguments || '{}'),
                            result: undefined,
                        };
                    }
                }
                return {
                    role: msg.role,
                    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                    timestamp: msg.timestamp || new Date().toISOString(),
                    toolCall,
                };
            }),
            toolUsage: {
                totalCalls: toolCalls.length,
                topTools,
                filesAccessed: Array.from(filesAccessed),
            },
            totalTokens: data.totalTokens || 0,
        };
    }
    catch (error) {
        console.error(`Error loading session: ${error}`);
        return null;
    }
}
/**
 * List available sessions
 */
function listSessions(sessionsDir) {
    if (!existsSync(sessionsDir)) {
        return [];
    }
    const files = readdirSync(sessionsDir)
        .filter((f) => f.endsWith('.json') || f.endsWith('.ndjson'))
        .map((f) => join(sessionsDir, f));
    return files;
}
/**
 * Prompt for input
 */
function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
/**
 * Main CLI
 */
const program = new Command()
    .name('memory-extractor')
    .description('Extract memories from Hermes sessions')
    .version('1.0.0')
    // Extract command
    .command('extract')
    .description('Extract memories from a session')
    .option('-s, --session <path>', 'Path to session file')
    .option('-d, --sessions-dir <path>', 'Sessions directory (default: ~/.hermes/sessions)')
    .option('-a, --all', 'Extract from all sessions')
    .option('-i, --importance <number>', 'Minimum importance threshold (0-1)', '0.5')
    .option('--dry-run', 'Preview extraction without writing')
    .action(async (options) => {
    const config = {
        cliPath: '/Users/embaobao/workspace/memory-system-cli',
        importanceThreshold: parseFloat(options.importance),
        duplicateThreshold: 0.95,
    };
    const sessionsDir = options.sessionsDir || '/Users/embaobao/.hermes/sessions';
    // Determine sessions to process
    let sessions = [];
    if (options.session) {
        sessions = [options.session];
    }
    else if (options.all) {
        sessions = listSessions(sessionsDir);
        if (sessions.length === 0) {
            console.log('No sessions found');
            return;
        }
    }
    else {
        // Interactive mode
        const allSessions = listSessions(sessionsDir);
        if (allSessions.length === 0) {
            console.log('No sessions found');
            return;
        }
        console.log('\nAvailable sessions:');
        allSessions.slice(0, 10).forEach((session, idx) => {
            console.log(`  [${idx}] ${session}`);
        });
        if (allSessions.length > 10) {
            console.log(`  ... and ${allSessions.length - 10} more`);
        }
        const choice = await askQuestion('\nSelect session # (or "all" for all sessions) [0]: ');
        if (choice.toLowerCase() === 'all') {
            sessions = allSessions;
        }
        else {
            const idx = parseInt(choice);
            if (idx >= 0 && idx < allSessions.length) {
                sessions = [allSessions[idx]];
            }
            else {
                console.log('Invalid choice');
                return;
            }
        }
    }
    // Confirm if processing multiple sessions
    if (sessions.length > 1 && !options.dryRun) {
        const confirm = await askQuestion(`Process ${sessions.length} sessions? (y/N): `);
        if (confirm.toLowerCase() !== 'y') {
            return;
        }
    }
    // Process sessions
    const extractor = new AutoMemoryExtractor(config);
    console.log(`\nProcessing ${sessions.length} session(s)...\n`);
    for (let i = 0; i < sessions.length; i++) {
        const sessionPath = sessions[i];
        console.log(`[${i + 1}/${sessions.length}] Processing ${sessionPath}`);
        const session = loadSession(sessionPath);
        if (!session) {
            console.log('  ⚠️  Failed to load session\n');
            continue;
        }
        if (options.dryRun) {
            console.log('  📋 Dry run mode - no changes will be made');
        }
        else {
            // Actual extraction
            try {
                const result = await extractor.extract(session);
                console.log('  ✅ Extraction complete');
                console.log(`     GBrain: ${result.gbrainAdded} added, ${result.updated} updated, ${result.skipped} skipped`);
                console.log(`     ClawMem: ${result.clawmemAdded} added, ${result.updated} updated, ${result.skipped} skipped`);
                console.log(`     Time: ${result.processingTime}ms`);
                // Show top changes
                if (result.changes.length > 0) {
                    console.log('\n  Top changes:');
                    result.changes.slice(0, 5).forEach(change => {
                        console.log(`    ${change.target} | ${change.action} | ${change.identifier.substring(0, 50)}`);
                    });
                    if (result.changes.length > 5) {
                        console.log(`    ... and ${result.changes.length - 5} more changes`);
                    }
                }
            }
            catch (error) {
                console.log(`  ❌ Extraction failed: ${error}`);
            }
        }
        console.log();
    }
    console.log('✨ All done!');
})
    // Watch command
    .command('watch')
    .description('Watch for new sessions and auto-extract')
    .option('-d, --sessions-dir <path>', 'Sessions directory (default: ~/.hermes/sessions)')
    .option('-i, --interval <seconds>', 'Check interval in seconds', '60')
    .action(async (options) => {
    const config = {
        cliPath: '/Users/embaobao/workspace/memory-system-cli',
        importanceThreshold: 0.5,
        duplicateThreshold: 0.95,
    };
    const sessionsDir = options.sessionsDir || '/Users/embaobao/.hermes/sessions';
    const interval = parseInt(options.interval);
    console.log(`Watching ${sessionsDir} for new sessions (every ${interval}s)...`);
    console.log('Press Ctrl+C to stop\n');
    const extractor = new AutoMemoryExtractor(config);
    const processedSessions = new Set(listSessions(sessionsDir));
    const checkForNewSessions = async () => {
        const currentSessions = listSessions(sessionsDir);
        for (const sessionPath of currentSessions) {
            if (!processedSessions.has(sessionPath)) {
                console.log(`\n🆕 New session: ${sessionPath}`);
                const session = loadSession(sessionPath);
                if (session) {
                    try {
                        const result = await extractor.extract(session);
                        console.log(`✅ Extracted ${result.gbrainAdded + result.clawmemAdded} memories`);
                    }
                    catch (error) {
                        console.log(`❌ Extraction failed: ${error}`);
                    }
                }
                processedSessions.add(sessionPath);
            }
        }
    };
    // Initial check
    await checkForNewSessions();
    // Periodic checks
    setInterval(checkForNewSessions, interval * 1000);
})
    // Stats command
    .command('stats')
    .description('Show extraction statistics')
    .action(async () => {
    console.log('Memory System Statistics\n');
    // Show GBrain stats
    console.log('📚 GBrain (General Knowledge)');
    try {
        const content = readFileSync('/Users/embaobao/workspace/memory-system-cli/tmp/gbrain-stats.json', 'utf-8');
        const data = JSON.parse(content);
        console.log(`  Total records: ${data.totalRecords || 'N/A'}`);
        console.log(`  Embedding model: ${data.embeddingModel || 'N/A'}`);
        console.log(`  Vector dimension: ${data.vectorDim || 'N/A'}`);
    }
    catch {
        console.log('  Stats not available');
    }
    console.log();
    // Show ClawMem stats
    console.log('💾 ClawMem (Code Memory)');
    try {
        const content = readFileSync('/Users/embaobao/workspace/memory-system-cli/tmp/clawmem-stats.json', 'utf-8');
        const data = JSON.parse(content);
        console.log(`  Total records: ${data.totalRecords || 'N/A'}`);
        console.log(`  Embedding model: ${data.embeddingModel || 'N/A'}`);
        console.log(`  Vector dimension: ${data.vectorDim || 'N/A'}`);
    }
    catch {
        console.log('  Stats not available');
    }
});
// Run CLI
program.parse(process.argv);
//# sourceMappingURL=cli.js.map