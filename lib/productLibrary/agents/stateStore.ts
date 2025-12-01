/**
 * State Store for Product Library Agent Execution
 *
 * Provides persistent storage for execution state and task progress.
 * Enables resume after interruption and tracks completed work.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import type { Category } from '../schema';
import type { AIProvider } from './aiClient';

// =============================================================================
// Types
// =============================================================================

export interface ExecutionState {
  executionId: string;
  startedAt: string;
  lastUpdatedAt: string;
  phase: 'initializing' | 'running' | 'paused' | 'completed' | 'failed';
  provider: AIProvider;
  config: {
    concurrency: number;
    categories: Category[];
  };
  metrics: {
    totalProducts: number;
    totalVariants: number;
    tokensUsed: number;
  };
}

export interface TaskState {
  id: string;
  category: Category;
  brand: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  attempts: number;
  productsCollected: number;
  tokensUsed: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
}

export interface ExecutionSummary {
  executionId: string;
  duration: number;
  tasksCompleted: number;
  tasksFailed: number;
  productsCollected: number;
  variantsCollected: number;
  tokensUsed: number;
}

// =============================================================================
// Configuration
// =============================================================================

const DATA_DIR = join(process.cwd(), 'lib', 'productLibrary', 'data');
const EXECUTION_DIR = join(DATA_DIR, '_execution');
const STATE_FILE = join(EXECUTION_DIR, 'state.json');
const TASKS_FILE = join(EXECUTION_DIR, 'tasks.json');

// =============================================================================
// Helpers
// =============================================================================

function ensureExecutionDir(): void {
  if (!existsSync(EXECUTION_DIR)) {
    mkdirSync(EXECUTION_DIR, { recursive: true });
  }
}

/**
 * Atomic write using temp file + rename pattern
 */
function atomicWrite(filePath: string, data: unknown): void {
  ensureExecutionDir();
  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tempPath, filePath);
}

function generateExecutionId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
  return `exec-${dateStr}-${timeStr}`;
}

// =============================================================================
// Execution State Management
// =============================================================================

/**
 * Load existing execution state or return null
 */
export function loadExecutionState(): ExecutionState | null {
  if (!existsSync(STATE_FILE)) {
    return null;
  }

  try {
    const content = readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(content) as ExecutionState;
  } catch (error) {
    console.error('[StateStore] Failed to load execution state:', error);
    return null;
  }
}

/**
 * Save execution state
 */
export function saveExecutionState(state: ExecutionState): void {
  state.lastUpdatedAt = new Date().toISOString();
  atomicWrite(STATE_FILE, state);
}

/**
 * Create new execution state
 */
export function createExecutionState(
  provider: AIProvider,
  categories: Category[],
  concurrency: number
): ExecutionState {
  const state: ExecutionState = {
    executionId: generateExecutionId(),
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    phase: 'initializing',
    provider,
    config: {
      concurrency,
      categories,
    },
    metrics: {
      totalProducts: 0,
      totalVariants: 0,
      tokensUsed: 0,
    },
  };

  saveExecutionState(state);
  return state;
}

/**
 * Update execution metrics
 */
export function updateExecutionMetrics(
  products: number,
  variants: number,
  tokens: number
): void {
  const state = loadExecutionState();
  if (!state) return;

  state.metrics.totalProducts += products;
  state.metrics.totalVariants += variants;
  state.metrics.tokensUsed += tokens;

  saveExecutionState(state);
}

/**
 * Set execution phase
 */
export function setExecutionPhase(
  phase: ExecutionState['phase']
): void {
  const state = loadExecutionState();
  if (!state) return;

  state.phase = phase;
  saveExecutionState(state);
}

// =============================================================================
// Task Management
// =============================================================================

/**
 * Load all tasks
 */
export function loadTasks(): TaskState[] {
  if (!existsSync(TASKS_FILE)) {
    return [];
  }

  try {
    const content = readFileSync(TASKS_FILE, 'utf-8');
    return JSON.parse(content) as TaskState[];
  } catch (error) {
    console.error('[StateStore] Failed to load tasks:', error);
    return [];
  }
}

/**
 * Save all tasks
 */
export function saveTasks(tasks: TaskState[]): void {
  atomicWrite(TASKS_FILE, tasks);
}

/**
 * Initialize tasks for a new execution
 */
export function initializeTasks(
  categoryBrands: Array<{ category: Category; brand: string }>
): TaskState[] {
  const tasks: TaskState[] = categoryBrands.map(({ category, brand }, index) => ({
    id: `task-${index.toString().padStart(3, '0')}-${category}-${brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    category,
    brand,
    status: 'pending',
    attempts: 0,
    productsCollected: 0,
    tokensUsed: 0,
  }));

  saveTasks(tasks);
  return tasks;
}

/**
 * Update a single task
 */
export function updateTask(taskId: string, updates: Partial<TaskState>): void {
  const tasks = loadTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    console.warn(`[StateStore] Task not found: ${taskId}`);
    return;
  }

  tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
  saveTasks(tasks);
}

/**
 * Mark task as started
 */
export function startTask(taskId: string): void {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) return;

  task.status = 'running';
  task.startedAt = new Date().toISOString();
  task.attempts += 1;

  saveTasks(tasks);
}

/**
 * Mark task as completed
 */
export function completeTask(
  taskId: string,
  productsCollected: number,
  variantsCollected: number,
  tokensUsed: number
): void {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) return;

  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.productsCollected = productsCollected;
  task.tokensUsed = tokensUsed;

  if (task.startedAt) {
    task.duration = Date.now() - new Date(task.startedAt).getTime();
  }

  saveTasks(tasks);

  // Update execution metrics
  updateExecutionMetrics(productsCollected, variantsCollected, tokensUsed);
}

/**
 * Mark task as failed
 */
export function failTask(taskId: string, error: string): void {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) return;

  task.status = 'failed';
  task.error = error;
  task.completedAt = new Date().toISOString();

  if (task.startedAt) {
    task.duration = Date.now() - new Date(task.startedAt).getTime();
  }

  saveTasks(tasks);
}

/**
 * Get next pending tasks up to limit
 */
export function getNextPendingTasks(limit: number): TaskState[] {
  const tasks = loadTasks();
  return tasks.filter(t => t.status === 'pending').slice(0, limit);
}

/**
 * Get tasks that failed but can be retried
 */
export function getRetryableTasks(maxAttempts = 3): TaskState[] {
  const tasks = loadTasks();
  return tasks.filter(t => t.status === 'failed' && t.attempts < maxAttempts);
}

/**
 * Reset failed tasks to pending for retry
 */
export function resetFailedTasks(maxAttempts = 3): number {
  const tasks = loadTasks();
  let resetCount = 0;

  for (const task of tasks) {
    if (task.status === 'failed' && task.attempts < maxAttempts) {
      task.status = 'pending';
      task.error = undefined;
      resetCount++;
    }
  }

  if (resetCount > 0) {
    saveTasks(tasks);
  }

  return resetCount;
}

// =============================================================================
// Progress & Summary
// =============================================================================

export interface ExecutionProgress {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  running: number;
  skipped: number;
  percentComplete: number;
  productsCollected: number;
  avgTaskDuration: number;
  estimatedRemainingMs: number;
}

/**
 * Get current execution progress
 */
export function getProgress(): ExecutionProgress {
  const tasks = loadTasks();

  const completed = tasks.filter(t => t.status === 'completed');
  const failed = tasks.filter(t => t.status === 'failed');
  const pending = tasks.filter(t => t.status === 'pending');
  const running = tasks.filter(t => t.status === 'running');
  const skipped = tasks.filter(t => t.status === 'skipped');

  const totalDuration = completed.reduce((sum, t) => sum + (t.duration || 0), 0);
  const avgDuration = completed.length > 0 ? totalDuration / completed.length : 30000;

  const remainingTasks = pending.length + running.length;
  const estimatedRemaining = remainingTasks * avgDuration;

  return {
    total: tasks.length,
    completed: completed.length,
    failed: failed.length,
    pending: pending.length,
    running: running.length,
    skipped: skipped.length,
    percentComplete:
      tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
    productsCollected: completed.reduce((sum, t) => sum + t.productsCollected, 0),
    avgTaskDuration: Math.round(avgDuration),
    estimatedRemainingMs: Math.round(estimatedRemaining),
  };
}

/**
 * Generate final execution summary
 */
export function getExecutionSummary(): ExecutionSummary | null {
  const state = loadExecutionState();
  const tasks = loadTasks();

  if (!state) return null;

  const completed = tasks.filter(t => t.status === 'completed');
  const failed = tasks.filter(t => t.status === 'failed');

  const duration = Date.now() - new Date(state.startedAt).getTime();

  return {
    executionId: state.executionId,
    duration,
    tasksCompleted: completed.length,
    tasksFailed: failed.length,
    productsCollected: state.metrics.totalProducts,
    variantsCollected: state.metrics.totalVariants,
    tokensUsed: state.metrics.tokensUsed,
  };
}

/**
 * Check if there's an incomplete execution that can be resumed
 */
export function canResume(): boolean {
  const state = loadExecutionState();
  if (!state) return false;

  if (state.phase === 'completed' || state.phase === 'failed') {
    return false;
  }

  const tasks = loadTasks();
  const hasPending = tasks.some(t => t.status === 'pending' || t.status === 'running');

  return hasPending;
}

/**
 * Clear execution state for fresh start
 */
export function clearExecutionState(): void {
  if (existsSync(STATE_FILE)) {
    const fs = require('fs');
    fs.unlinkSync(STATE_FILE);
  }
  if (existsSync(TASKS_FILE)) {
    const fs = require('fs');
    fs.unlinkSync(TASKS_FILE);
  }
}
