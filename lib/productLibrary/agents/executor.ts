/**
 * Product Library Agent Executor
 *
 * Core execution engine that orchestrates brand agents with concurrency control,
 * state management, and result processing.
 */

import type { Category } from '../schema';
import { CATEGORY_CONFIGS, processAgentResults } from './orchestrator';
import {
  collectBrandProducts,
  type AIProvider,
  type CollectionResult,
} from './aiClient';
import {
  loadExecutionState,
  createExecutionState,
  setExecutionPhase,
  loadTasks,
  initializeTasks,
  startTask,
  completeTask,
  failTask,
  getNextPendingTasks,
  resetFailedTasks,
  getProgress,
  getExecutionSummary,
  canResume,
  clearExecutionState,
  type TaskState,
  type ExecutionState,
  type ExecutionProgress,
  type ExecutionSummary,
} from './stateStore';

// =============================================================================
// Types
// =============================================================================

export interface ExecutorConfig {
  concurrency: number;
  provider: AIProvider;
  categories?: Category[];
  brands?: string[];
  resume: boolean;
  dryRun: boolean;
  maxRetries: number;
}

export interface AgentResult {
  taskId: string;
  category: Category;
  brand: string;
  success: boolean;
  products: number;
  variants: number;
  tokensUsed: number;
  duration: number;
  error?: string;
}

export type ProgressCallback = (progress: ExecutionProgress, currentTask?: TaskState) => void;

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: ExecutorConfig = {
  concurrency: 3,
  provider: 'openai',
  resume: false,
  dryRun: false,
  maxRetries: 3,
};

// =============================================================================
// Concurrency Pool
// =============================================================================

class ConcurrencyPool {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrent: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return;
    }

    return new Promise(resolve => {
      this.queue.push(() => {
        this.running++;
        resolve();
      });
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  getStatus(): { running: number; waiting: number } {
    return {
      running: this.running,
      waiting: this.queue.length,
    };
  }
}

// =============================================================================
// Executor Class
// =============================================================================

export class ProductLibraryExecutor {
  private config: ExecutorConfig;
  private pool: ConcurrencyPool;
  private state: ExecutionState | null = null;
  private paused = false;
  private progressCallback?: ProgressCallback;

  constructor(config: Partial<ExecutorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pool = new ConcurrencyPool(this.config.concurrency);
  }

  /**
   * Set progress callback for real-time updates
   */
  onProgress(callback: ProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * Initialize execution - either resume or start fresh
   */
  async initialize(): Promise<void> {
    if (this.config.resume && canResume()) {
      console.log('[Executor] Resuming previous execution...');
      this.state = loadExecutionState();

      // Reset any tasks that were running when interrupted
      const tasks = loadTasks();
      let resetCount = 0;
      for (const task of tasks) {
        if (task.status === 'running') {
          task.status = 'pending';
          resetCount++;
        }
      }
      if (resetCount > 0) {
        const { saveTasks } = await import('./stateStore');
        saveTasks(tasks);
        console.log(`[Executor] Reset ${resetCount} interrupted tasks to pending`);
      }
    } else {
      // Start fresh
      if (canResume()) {
        console.log('[Executor] Clearing previous execution state...');
        clearExecutionState();
      }

      // Determine which categories to process
      const categories: Category[] = this.config.categories || [
        'golf',
        'tech',
        'fashion',
        'makeup',
        'outdoor',
        'photography',
        'gaming',
        'music',
        'fitness',
        'travel',
        'edc',
      ];

      // Build task list from category configs
      const categoryBrands: Array<{ category: Category; brand: string }> = [];

      for (const category of categories) {
        const config = CATEGORY_CONFIGS[category];
        if (!config) continue;

        let brands = config.priorityBrands;

        // Filter by specific brands if provided
        if (this.config.brands && this.config.brands.length > 0) {
          brands = brands.filter(b =>
            this.config.brands!.some(
              fb => fb.toLowerCase() === b.toLowerCase()
            )
          );
        }

        for (const brand of brands) {
          categoryBrands.push({ category, brand });
        }
      }

      // Initialize state and tasks
      this.state = createExecutionState(
        this.config.provider,
        categories,
        this.config.concurrency
      );
      initializeTasks(categoryBrands);

      console.log(
        `[Executor] Initialized ${categoryBrands.length} tasks across ${categories.length} categories`
      );
    }

    setExecutionPhase('running');
  }

  /**
   * Execute a single brand agent
   */
  async executeBrand(task: TaskState): Promise<AgentResult> {
    const startTime = Date.now();

    // Mark task as started
    startTask(task.id);

    // Report progress
    if (this.progressCallback) {
      this.progressCallback(getProgress(), task);
    }

    // Dry run - simulate execution
    if (this.config.dryRun) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockProducts = Math.floor(Math.random() * 10) + 5;
      const mockVariants = mockProducts * 3;

      completeTask(task.id, mockProducts, mockVariants, 0);

      return {
        taskId: task.id,
        category: task.category,
        brand: task.brand,
        success: true,
        products: mockProducts,
        variants: mockVariants,
        tokensUsed: 0,
        duration: Date.now() - startTime,
      };
    }

    // Real execution
    try {
      const result: CollectionResult = await collectBrandProducts(
        task.category,
        task.brand,
        { provider: this.config.provider }
      );

      // Count variants
      const variantCount = result.products.reduce(
        (sum, p) => sum + (p.variants?.length || 0),
        0
      );

      // Save to library
      if (result.products.length > 0) {
        processAgentResults(task.category, task.brand, result.products);
      }

      // Mark complete
      completeTask(
        task.id,
        result.products.length,
        variantCount,
        result.tokensUsed
      );

      return {
        taskId: task.id,
        category: task.category,
        brand: task.brand,
        success: true,
        products: result.products.length,
        variants: variantCount,
        tokensUsed: result.tokensUsed,
        duration: result.duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[Executor] Failed to collect ${task.brand} (${task.category}):`,
        errorMessage
      );

      failTask(task.id, errorMessage);

      return {
        taskId: task.id,
        category: task.category,
        brand: task.brand,
        success: false,
        products: 0,
        variants: 0,
        tokensUsed: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Run execution loop
   */
  async run(): Promise<ExecutionSummary> {
    await this.initialize();

    console.log('[Executor] Starting execution...');
    console.log(`[Executor] Provider: ${this.config.provider}`);
    console.log(`[Executor] Concurrency: ${this.config.concurrency}`);
    console.log(`[Executor] Dry run: ${this.config.dryRun}`);

    const results: AgentResult[] = [];

    // Process pending tasks
    while (!this.paused) {
      const pendingTasks = getNextPendingTasks(this.config.concurrency);

      if (pendingTasks.length === 0) {
        // Check for retryable failed tasks
        const resetCount = resetFailedTasks(this.config.maxRetries);
        if (resetCount > 0) {
          console.log(`[Executor] Reset ${resetCount} failed tasks for retry`);
          continue;
        }

        // No more work
        break;
      }

      // Execute tasks concurrently
      const taskPromises = pendingTasks.map(async task => {
        await this.pool.acquire();
        try {
          const result = await this.executeBrand(task);
          results.push(result);

          // Report progress after completion
          if (this.progressCallback) {
            this.progressCallback(getProgress());
          }

          return result;
        } finally {
          this.pool.release();
        }
      });

      await Promise.all(taskPromises);
    }

    // Mark execution complete
    setExecutionPhase(this.paused ? 'paused' : 'completed');

    const summary = getExecutionSummary();
    if (!summary) {
      throw new Error('Failed to generate execution summary');
    }

    console.log('[Executor] Execution complete!');
    console.log(`[Executor] Tasks: ${summary.tasksCompleted} completed, ${summary.tasksFailed} failed`);
    console.log(`[Executor] Products: ${summary.productsCollected}`);
    console.log(`[Executor] Tokens: ${summary.tokensUsed}`);
    console.log(`[Executor] Duration: ${Math.round(summary.duration / 1000)}s`);

    return summary;
  }

  /**
   * Run a single brand (for testing)
   */
  async runSingleBrand(
    category: Category,
    brand: string
  ): Promise<AgentResult> {
    this.config.categories = [category];
    this.config.brands = [brand];
    this.config.resume = false;

    await this.initialize();

    const tasks = loadTasks();
    const task = tasks.find(
      t => t.category === category && t.brand.toLowerCase() === brand.toLowerCase()
    );

    if (!task) {
      throw new Error(`Task not found for ${brand} in ${category}`);
    }

    const result = await this.executeBrand(task);
    setExecutionPhase('completed');

    return result;
  }

  /**
   * Pause execution
   */
  pause(): void {
    console.log('[Executor] Pausing execution...');
    this.paused = true;
  }

  /**
   * Get current progress
   */
  getProgress(): ExecutionProgress {
    return getProgress();
  }

  /**
   * Get execution summary
   */
  getSummary(): ExecutionSummary | null {
    return getExecutionSummary();
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Run full execution with default settings
 */
export async function runFullExecution(
  config: Partial<ExecutorConfig> = {}
): Promise<ExecutionSummary> {
  const executor = new ProductLibraryExecutor(config);
  return executor.run();
}

/**
 * Run single brand for testing
 */
export async function runSingleBrand(
  category: Category,
  brand: string,
  config: Partial<ExecutorConfig> = {}
): Promise<AgentResult> {
  const executor = new ProductLibraryExecutor(config);
  return executor.runSingleBrand(category, brand);
}

/**
 * Resume interrupted execution
 */
export async function resumeExecution(
  config: Partial<ExecutorConfig> = {}
): Promise<ExecutionSummary> {
  const executor = new ProductLibraryExecutor({ ...config, resume: true });
  return executor.run();
}
