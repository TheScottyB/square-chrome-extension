import { BulkOperationManager } from '@/agents/bulk/BulkOperationManager';
import { BulkOperationStatus, BulkOperationItem } from '@/agents/types';

export interface BulkOperationUIState {
  operations: BulkOperationStatus[];
  currentOperationId?: string;
  isActive: boolean;
  currentOperation?: {
    type: string;
    status: string;
    progress: number;
    total: number;
    executionStrategy: string;
  };
  queue: BulkOperationItem[];
  stats: {
    queued: number;
    completed: number;
    failed: number;
    active: number;
  };
  errors: Array<{
    taskId: string;
    message: string;
    timestamp: Date;
    details?: any;
  }>;
}

export class BulkOperationStateManager {
  private manager: BulkOperationManager;
  private state: BulkOperationUIState;
  private updateInterval: number | null = null;
  private onStateUpdateCallback?: () => void;

  constructor(manager: BulkOperationManager) {
    this.manager = manager;
    this.state = {
      operations: [],
      errors: [],
      isActive: false,
      queue: [],
      stats: {
        queued: 0,
        completed: 0,
        failed: 0,
        active: 0
      }
    };
  }

  public getState(): BulkOperationUIState {
    return { ...this.state };
  }

  public setStateUpdateCallback(callback: () => void): void {
    this.onStateUpdateCallback = callback;
  }

  public startPeriodicUpdates(): void {
    this.updateInterval = window.setInterval(() => {
      this.updateState();
    }, 1000);
  }

  public stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public async updateState(): Promise<void> {
    try {
      // Update state from manager
      const operations = this.manager.listOperations();
      const queue: any[] = []; // Mock queue - not implemented in manager
      const stats = { pending: 0, completed: 0, failed: 0, running: 0 }; // Mock stats

      this.state.queue = queue;
      this.state.stats = {
        queued: stats.pending || 0,
        completed: stats.completed || 0,
        failed: stats.failed || 0,
        active: stats.running || 0
      };

      // Check if there's an active operation
      if (operations.length > 0) {
        const operation = operations[0];
        this.state.isActive = operation.status === 'running' || operation.status === 'paused';
        this.state.currentOperation = {
          type: operation.config?.operationType || 'unknown',
          status: operation.status,
          progress: operation.progress.completedItems || 0,
          total: operation.progress.totalItems || 0,
          executionStrategy: operation.config?.executionStrategy || 'sequential'
        };
        
        // Update real-time stats from the operation
        this.state.stats = {
          queued: operation.progress.totalItems - operation.progress.completedItems - operation.progress.failedItems - operation.progress.skippedItems,
          completed: operation.progress.completedItems,
          failed: operation.progress.failedItems,
          active: operation.status === 'running' ? 1 : 0
        };
      } else {
        this.state.isActive = false;
        this.state.currentOperation = undefined;
      }

      // Notify UI that state has been updated
      if (this.onStateUpdateCallback) {
        this.onStateUpdateCallback();
      }
    } catch (error) {
      console.error('Failed to update bulk operation state:', error);
    }
  }

  public addError(taskId: string, message: string, details?: any): void {
    this.state.errors.push({
      taskId,
      message,
      timestamp: new Date(),
      details
    });

    // Keep only last 50 errors
    if (this.state.errors.length > 50) {
      this.state.errors = this.state.errors.slice(-50);
    }

    // Notify UI of error update
    if (this.onStateUpdateCallback) {
      this.onStateUpdateCallback();
    }
  }

  public clearErrors(): void {
    this.state.errors = [];
    if (this.onStateUpdateCallback) {
      this.onStateUpdateCallback();
    }
  }

  public async retryFailedTasks(): Promise<void> {
    try {
      // Mock retry failed tasks - not implemented in manager
      console.log('Retrying failed tasks (mock implementation)');
      await this.updateState();
    } catch (error) {
      console.error('Failed to retry failed tasks:', error);
      this.addError('system', `Failed to retry failed tasks: ${error}`, error);
    }
  }

  public clearQueue(): void {
    // Mock clear queue - not implemented in manager
    console.log('Clearing queue (mock implementation)');
    this.updateState();
  }

  public async pauseOperation(): Promise<void> {
    try {
      const operations = this.manager.listOperations();
      const activeOp = operations.find(op => op.status === 'running');
      if (activeOp) {
        await this.manager.pauseOperation(activeOp.id);
      }
      await this.updateState();
    } catch (error) {
      console.error('Failed to pause operation:', error);
      this.addError('system', `Failed to pause operation: ${error}`, error);
    }
  }

  public async resumeOperation(): Promise<void> {
    try {
      const operations = this.manager.listOperations();
      const pausedOp = operations.find(op => op.status === 'paused');
      if (pausedOp) {
        await this.manager.resumeOperation(pausedOp.id);
      }
      await this.updateState();
    } catch (error) {
      console.error('Failed to resume operation:', error);
      this.addError('system', `Failed to resume operation: ${error}`, error);
    }
  }

  public async cancelOperation(): Promise<void> {
    try {
      const operations = this.manager.listOperations();
      const activeOp = operations.find(op => op.status === 'running' || op.status === 'paused');
      if (activeOp) {
        await this.manager.cancelOperation(activeOp.id);
      }
      await this.updateState();
    } catch (error) {
      console.error('Failed to cancel operation:', error);
      this.addError('system', `Failed to cancel operation: ${error}`, error);
    }
  }
}
