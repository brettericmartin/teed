#!/usr/bin/env npx tsx
/**
 * Product Library Agent Runner
 *
 * CLI entry point for executing product collection agents.
 *
 * Usage:
 *   npx tsx lib/productLibrary/agents/runner.ts --full
 *   npx tsx lib/productLibrary/agents/runner.ts --resume
 *   npx tsx lib/productLibrary/agents/runner.ts --category golf
 *   npx tsx lib/productLibrary/agents/runner.ts --category golf --brand Callaway
 *   npx tsx lib/productLibrary/agents/runner.ts --full --provider anthropic
 *   npx tsx lib/productLibrary/agents/runner.ts --full --dry-run
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import type { Category } from '../schema';
import type { AIProvider } from './aiClient';
import {
  ProductLibraryExecutor,
  type ExecutorConfig,
  type AgentResult,
} from './executor';
import {
  getProgress,
  canResume,
  getExecutionSummary,
  type ExecutionProgress,
  type TaskState,
} from './stateStore';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// =============================================================================
// CLI Argument Parsing
// =============================================================================

interface CLIOptions {
  full: boolean;
  resume: boolean;
  category?: Category;
  brand?: string;
  provider: AIProvider;
  concurrency: number;
  dryRun: boolean;
  help: boolean;
  status: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    full: false,
    resume: false,
    provider: 'openai',
    concurrency: 3,
    dryRun: false,
    help: false,
    status: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--full':
      case '-f':
        options.full = true;
        break;
      case '--resume':
      case '-r':
        options.resume = true;
        break;
      case '--category':
      case '-c':
        options.category = args[++i] as Category;
        break;
      case '--brand':
      case '-b':
        options.brand = args[++i];
        break;
      case '--provider':
      case '-p':
        options.provider = args[++i] as AIProvider;
        break;
      case '--concurrency':
        options.concurrency = parseInt(args[++i], 10);
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--status':
      case '-s':
        options.status = true;
        break;
    }
  }

  return options;
}

// =============================================================================
// Output Formatting
// =============================================================================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function progressBar(percent: number, width = 30): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

function printHeader(title: string): void {
  console.log('\n' + '═'.repeat(50));
  console.log(`  ${title}`);
  console.log('═'.repeat(50));
}

function printProgress(progress: ExecutionProgress, currentTask?: TaskState): void {
  // Clear previous output (move cursor up and clear lines)
  process.stdout.write('\x1B[2K\x1B[1A'.repeat(6) + '\x1B[2K');

  const bar = progressBar(progress.percentComplete);
  const eta = formatDuration(progress.estimatedRemainingMs);

  console.log(`\n${bar} ${progress.completed}/${progress.total} (${progress.percentComplete}%)`);
  console.log(`  Running: ${progress.running} | Pending: ${progress.pending} | Failed: ${progress.failed}`);
  console.log(`  Products: ${progress.productsCollected} | Avg: ${formatDuration(progress.avgTaskDuration)}/task`);
  console.log(`  ETA: ${eta} remaining`);

  if (currentTask) {
    console.log(`  Current: ${currentTask.brand} (${currentTask.category})`);
  } else {
    console.log('  Current: --');
  }
}

function printHelp(): void {
  console.log(`
Product Library Agent Runner

Deploys AI agents to collect product data for the product library.

USAGE:
  npx tsx lib/productLibrary/agents/runner.ts [OPTIONS]

OPTIONS:
  --full, -f           Run all categories and brands (110 agents)
  --resume, -r         Resume interrupted execution
  --category, -c       Run specific category (e.g., golf, tech)
  --brand, -b          Run specific brand (requires --category)
  --provider, -p       AI provider: openai (default) or anthropic
  --concurrency        Number of parallel agents (default: 3)
  --dry-run, -d        Test mode - no API calls
  --status, -s         Show current execution status
  --help, -h           Show this help message

EXAMPLES:
  # Full execution with OpenAI
  npx tsx lib/productLibrary/agents/runner.ts --full

  # Resume interrupted run
  npx tsx lib/productLibrary/agents/runner.ts --resume

  # Single category
  npx tsx lib/productLibrary/agents/runner.ts --category golf

  # Single brand
  npx tsx lib/productLibrary/agents/runner.ts --category golf --brand Callaway

  # Use Claude instead of GPT-4
  npx tsx lib/productLibrary/agents/runner.ts --full --provider anthropic

  # Dry run (test without API calls)
  npx tsx lib/productLibrary/agents/runner.ts --full --dry-run

CATEGORIES:
  golf, tech, fashion, makeup, outdoor, photography,
  gaming, music, fitness, travel, edc
`);
}

function printStatus(): void {
  const hasState = canResume();

  if (!hasState) {
    console.log('\nNo active or resumable execution found.');
    console.log('Run with --full to start a new execution.\n');
    return;
  }

  const progress = getProgress();
  const summary = getExecutionSummary();

  printHeader('Execution Status');

  if (summary) {
    console.log(`  Execution ID: ${summary.executionId}`);
    console.log(`  Duration: ${formatDuration(summary.duration)}`);
  }

  console.log(`\n  Progress:`);
  console.log(`    Total tasks: ${progress.total}`);
  console.log(`    Completed: ${progress.completed}`);
  console.log(`    Failed: ${progress.failed}`);
  console.log(`    Pending: ${progress.pending}`);
  console.log(`    Running: ${progress.running}`);

  console.log(`\n  Metrics:`);
  console.log(`    Products collected: ${progress.productsCollected}`);
  console.log(`    Avg task duration: ${formatDuration(progress.avgTaskDuration)}`);

  if (progress.pending > 0 || progress.running > 0) {
    console.log(`\n  Run with --resume to continue.`);
  }

  console.log('');
}

// =============================================================================
// Main Execution
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    return;
  }

  if (options.status) {
    printStatus();
    return;
  }

  // Validate options
  if (!options.full && !options.resume && !options.category) {
    console.log('Error: Must specify --full, --resume, or --category\n');
    printHelp();
    process.exit(1);
  }

  if (options.brand && !options.category) {
    console.log('Error: --brand requires --category\n');
    process.exit(1);
  }

  // Check for API keys
  if (!options.dryRun) {
    if (options.provider === 'openai' && !process.env.OPENAI_API_KEY) {
      console.error('Error: OPENAI_API_KEY not set in environment');
      process.exit(1);
    }
    if (options.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      console.error('Error: ANTHROPIC_API_KEY not set in environment');
      process.exit(1);
    }
  }

  // Build executor config
  const config: Partial<ExecutorConfig> = {
    concurrency: options.concurrency,
    provider: options.provider,
    resume: options.resume,
    dryRun: options.dryRun,
  };

  if (options.category) {
    config.categories = [options.category];
  }

  if (options.brand) {
    config.brands = [options.brand];
  }

  // Print header
  printHeader('Product Library Agent Runner');
  console.log(`  Provider: ${options.provider}`);
  console.log(`  Concurrency: ${options.concurrency}`);
  console.log(`  Dry run: ${options.dryRun}`);

  if (options.category) {
    console.log(`  Category: ${options.category}`);
    if (options.brand) {
      console.log(`  Brand: ${options.brand}`);
    }
  } else {
    console.log(`  Mode: ${options.resume ? 'Resume' : 'Full'}`);
  }

  console.log('');

  // Create executor
  const executor = new ProductLibraryExecutor(config);

  // Set up progress callback
  let lastProgressTime = 0;
  executor.onProgress((progress, currentTask) => {
    const now = Date.now();
    // Throttle updates to every 500ms
    if (now - lastProgressTime > 500) {
      printProgress(progress, currentTask);
      lastProgressTime = now;
    }
  });

  // Handle graceful shutdown
  let shutdownRequested = false;
  process.on('SIGINT', () => {
    if (shutdownRequested) {
      console.log('\nForce quitting...');
      process.exit(1);
    }
    console.log('\nGracefully shutting down (press Ctrl+C again to force)...');
    shutdownRequested = true;
    executor.pause();
  });

  // Run
  try {
    console.log('Starting execution...\n\n\n\n\n'); // Space for progress output

    const summary = await executor.run();

    // Final summary
    printHeader('Execution Complete');
    console.log(`  Execution ID: ${summary.executionId}`);
    console.log(`  Duration: ${formatDuration(summary.duration)}`);
    console.log(`  Tasks completed: ${summary.tasksCompleted}`);
    console.log(`  Tasks failed: ${summary.tasksFailed}`);
    console.log(`  Products collected: ${summary.productsCollected}`);
    console.log(`  Variants collected: ${summary.variantsCollected}`);
    console.log(`  Tokens used: ${summary.tokensUsed.toLocaleString()}`);
    console.log('');

    if (summary.tasksFailed > 0) {
      console.log(`  Note: ${summary.tasksFailed} tasks failed. Run with --resume to retry.\n`);
    }

    process.exit(summary.tasksFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\nExecution failed:', error);
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
