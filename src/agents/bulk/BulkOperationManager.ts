import { 
  BulkOperationConfig, 
  BulkOperationItem, 
  BulkOperationBatch, 
  BulkOperationStatus, 
  BulkOperationResult, 
  BulkOperationEvents,
  AgentTask,
  AgentResult,
  AgentContext
} from '../types';
import { DOMAgent } from '../base/DOMAgent';

/**
 * Manages bulk operations with sophisticated batch processing, error handling, and progress tracking
 */
export class BulkOperationManager {
  private operations = new Map<string, BulkOperationStatus>();
  private eventHandlers = new Map<string, BulkOperationEvents>();
  private activeOperations = new Set<string>();
  private pausedOperations = new Set<string>();
  private context: AgentContext;
  private agents: Map<string, DOMAgent>;

  constructor(context: AgentContext, agents: Map<string, DOMAgent>) {
    this.context = context;
    this.agents = agents;
  }

  /**
   * Create and start a new bulk operation
   */
  async createOperation(
    config: BulkOperationConfig,
    items: BulkOperationItem[],
    events: BulkOperationEvents
  ): Promise<string> {
    const operationId = this.generateId();
    const operation: BulkOperationStatus = {
      id: operationId,
      name: config.name,
      status: 'pending',
      startTime: Date.now(),
      progress: {
        totalItems: items.length,
        completedItems: 0,
        failedItems: 0,
        skippedItems: 0,
        currentBatch: 0,
        totalBatches: Math.ceil(items.length / (config.batchSize || 10)),
        percentage: 0
      },
      performance: {
        itemsPerSecond: 0,
        averageTaskTime: 0,
        errorRate: 0
      },
      batches: this.createBatches(operationId, items, config.batchSize || 10),
      config: { ...config, id: operationId }
    };

    this.operations.set(operationId, operation);
    this.eventHandlers.set(operationId, events);

    console.log(`📦 Created bulk operation: ${config.name} (${operationId}) with ${items.length} items`);
    return operationId;
  }

  /**
   * Start executing a bulk operation
   */
  async startOperation(operationId: string): Promise<BulkOperationResult> {
    const operation = this.operations.get(operationId);
    const events = this.eventHandlers.get(operationId);

    if (!operation || !events) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (this.activeOperations.has(operationId)) {
      throw new Error(`Operation ${operationId} is already running`);
    }

    try {
      this.activeOperations.add(operationId);
      operation.status = 'running';
      operation.startTime = Date.now();

      events.onStart(operation);
      console.log(`🚀 Starting bulk operation: ${operation.name}`);

      const result = await this.executeOperation(operation, events);
      
      operation.status = result.success ? 'completed' : 'failed';
      operation.endTime = Date.now();
      
      events.onComplete(result);
      console.log(`✅ Bulk operation completed: ${operation.name} - ${result.summary.successful}/${result.summary.totalProcessed} successful`);
      
      return result;

    } catch (error) {
      operation.status = 'failed';
      operation.endTime = Date.now();
      
      const failedResult: BulkOperationResult = {
        operationId,
        success: false,
        status: operation,
        summary: {
          totalProcessed: operation.progress.completedItems + operation.progress.failedItems,
          successful: operation.progress.completedItems,
          failed: operation.progress.failedItems,
          skipped: operation.progress.skippedItems,
          executionTime: (operation.endTime || Date.now()) - (operation.startTime || Date.now())
        },
        details: {
          batches: operation.batches,
          errors: this.collectAllErrors(operation.batches),
          performance: operation.performance
        }
      };

      events.onComplete(failedResult);
      console.error(`❌ Bulk operation failed: ${operation.name} - ${error}`);
      
      return failedResult;

    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  /**
   * Pause a running operation
   */
  async pauseOperation(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    const events = this.eventHandlers.get(operationId);

    if (!operation || !events) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (!this.activeOperations.has(operationId)) {
      throw new Error(`Operation ${operationId} is not running`);
    }

    this.pausedOperations.add(operationId);
    operation.status = 'paused';
    events.onPause(operation);
    
    console.log(`⏸️ Paused bulk operation: ${operation.name}`);
  }

  /**
   * Resume a paused operation
   */
  async resumeOperation(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    const events = this.eventHandlers.get(operationId);

    if (!operation || !events) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (!this.pausedOperations.has(operationId)) {
      throw new Error(`Operation ${operationId} is not paused`);
    }

    this.pausedOperations.delete(operationId);
    operation.status = 'running';
    events.onResume(operation);
    
    console.log(`▶️ Resumed bulk operation: ${operation.name}`);
  }

  /**
   * Cancel an operation
   */
  async cancelOperation(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    const events = this.eventHandlers.get(operationId);

    if (!operation || !events) {
      throw new Error(`Operation ${operationId} not found`);
    }

    operation.status = 'cancelled';
    operation.endTime = Date.now();
    
    this.activeOperations.delete(operationId);
    this.pausedOperations.delete(operationId);
    
    events.onCancel(operation);
    console.log(`🛑 Cancelled bulk operation: ${operation.name}`);
  }

  /**
   * Get operation status
   */
  getOperationStatus(operationId: string): BulkOperationStatus | undefined {
    return this.operations.get(operationId);
  }

  /**
   * List all operations
   */
  listOperations(): BulkOperationStatus[] {
    return Array.from(this.operations.values());
  }

  /**
   * Execute the bulk operation
   */
  private async executeOperation(
    operation: BulkOperationStatus,
    events: BulkOperationEvents
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const executionTimes: number[] = [];

    // Execute batches based on strategy
    switch (operation.config.executionStrategy) {
      case 'parallel':
        await this.executeParallel(operation, events, executionTimes);
        break;
      case 'sequential':
        await this.executeSequential(operation, events, executionTimes);
        break;
      case 'rate-limited':
        await this.executeRateLimited(operation, events, executionTimes);
        break;
    }

    const endTime = Date.now();
    const totalExecutionTime = endTime - startTime;

    // Calculate final performance metrics
    const totalProcessed = operation.progress.completedItems + operation.progress.failedItems;
    operation.performance = {
      itemsPerSecond: totalProcessed / (totalExecutionTime / 1000),
      averageTaskTime: executionTimes.length > 0 ? 
        executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length : 0,
      errorRate: totalProcessed > 0 ? operation.progress.failedItems / totalProcessed : 0
    };

    return {
      operationId: operation.id,
      success: operation.progress.failedItems === 0,
      status: operation,
      summary: {
        totalProcessed,
        successful: operation.progress.completedItems,
        failed: operation.progress.failedItems,
        skipped: operation.progress.skippedItems,
        executionTime: totalExecutionTime
      },
      details: {
        batches: operation.batches,
        errors: this.collectAllErrors(operation.batches),
        performance: operation.performance
      }
    };
  }

  /**
   * Execute batches in parallel
   */
  private async executeParallel(
    operation: BulkOperationStatus,
    events: BulkOperationEvents,
    executionTimes: number[]
  ): Promise<void> {
    const promises = operation.batches.map(batch => 
      this.executeBatch(batch, operation, events, executionTimes)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Execute batches sequentially
   */
  private async executeSequential(
    operation: BulkOperationStatus,
    events: BulkOperationEvents,
    executionTimes: number[]
  ): Promise<void> {
    for (const batch of operation.batches) {
      if (this.pausedOperations.has(operation.id)) {
        await this.waitForResume(operation.id);
      }

      if (operation.status === 'cancelled') {
        break;
      }

      await this.executeBatch(batch, operation, events, executionTimes);

      // Stop on error if configured
      if (operation.config.errorHandling.strategy === 'stop-on-error' && batch.status === 'failed') {
        console.warn(`🛑 Stopping operation due to batch failure: ${batch.id}`);
        break;
      }
    }
  }

  /**
   * Execute batches with rate limiting
   */
  private async executeRateLimited(
    operation: BulkOperationStatus,
    events: BulkOperationEvents,
    executionTimes: number[]
  ): Promise<void> {
    const rateLimit = operation.config.rateLimit!;
    const delayMs = 1000 / rateLimit.requestsPerSecond;

    for (const batch of operation.batches) {
      if (this.pausedOperations.has(operation.id)) {
        await this.waitForResume(operation.id);
      }

      if (operation.status === 'cancelled') {
        break;
      }

      const batchStart = Date.now();
      await this.executeBatch(batch, operation, events, executionTimes);
      
      const batchTime = Date.now() - batchStart;
      const remainingDelay = delayMs - batchTime;
      
      if (remainingDelay > 0) {
        await this.delay(remainingDelay);
      }

      // Stop on error if configured
      if (operation.config.errorHandling.strategy === 'stop-on-error' && batch.status === 'failed') {
        console.warn(`🛑 Stopping rate-limited operation due to batch failure: ${batch.id}`);
        break;
      }
    }
  }

  /**
   * Execute a single batch
   */
  private async executeBatch(
    batch: BulkOperationBatch,
    operation: BulkOperationStatus,
    events: BulkOperationEvents,
    executionTimes: number[]
  ): Promise<void> {
    batch.status = 'processing';
    batch.startTime = Date.now();
    operation.progress.currentBatch = operation.batches.indexOf(batch) + 1;

    console.log(`🔄 Processing batch ${batch.id} with ${batch.items.length} items`);

    for (const item of batch.items) {
      if (this.pausedOperations.has(operation.id) || operation.status === 'cancelled') {
        break;
      }

      const itemStart = Date.now();
      
      try {
        // Pre-validation
        if (operation.config.validation?.preValidation) {
          const isValid = operation.config.validation.preValidation(item.data);
          if (!isValid) {
            console.warn(`⚠️ Item ${item.id} failed pre-validation, skipping`);
            operation.progress.skippedItems++;
            batch.progress.skipped++;
            continue;
          }
        }

        const result = await this.executeItem(item, operation);
        const itemTime = Date.now() - itemStart;
        executionTimes.push(itemTime);

        // Post-validation
        if (operation.config.validation?.postValidation) {
          const isValid = operation.config.validation.postValidation(result);
          if (!isValid) {
            result.success = false;
            result.error = 'Post-validation failed';
          }
        }

        batch.results.push(result);

        if (result.success) {
          operation.progress.completedItems++;
          batch.progress.completed++;
          console.log(`✅ Item ${item.id} completed successfully`);
        } else {
          operation.progress.failedItems++;
          batch.progress.failed++;
          batch.errors.push({
            itemId: item.id,
            error: result.error || 'Unknown error',
            retryCount: result.retryCount || 0
          });
          
          events.onError({
            itemId: item.id,
            error: result.error || 'Unknown error',
            retryCount: result.retryCount || 0
          });
          
          console.error(`❌ Item ${item.id} failed: ${result.error}`);
        }

        events.onItemComplete(item, result);

      } catch (error) {
        const itemTime = Date.now() - itemStart;
        executionTimes.push(itemTime);
        
        operation.progress.failedItems++;
        batch.progress.failed++;
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        batch.errors.push({
          itemId: item.id,
          error: errorMessage,
          retryCount: 0
        });

        events.onError({
          itemId: item.id,
          error: errorMessage,
          retryCount: 0
        });

        console.error(`❌ Item ${item.id} threw error: ${errorMessage}`);
      }

      // Update progress percentage
      const totalProcessed = operation.progress.completedItems + operation.progress.failedItems + operation.progress.skippedItems;
      operation.progress.percentage = Math.round((totalProcessed / operation.progress.totalItems) * 100);
      
      events.onProgress(operation.progress);
    }

    batch.status = batch.progress.failed > 0 ? 'failed' : 'completed';
    batch.endTime = Date.now();
    
    events.onBatchComplete(batch);
    console.log(`🏁 Batch ${batch.id} completed: ${batch.progress.completed}/${batch.items.length} successful`);
  }

  /**
   * Execute a single item
   */
  private async executeItem(item: BulkOperationItem, operation: BulkOperationStatus): Promise<AgentResult> {
    const task: AgentTask = {
      id: `bulk-${operation.id}-${item.id}`,
      type: this.mapOperationTypeToTaskType(operation.config.operationType),
      priority: item.priority || 'medium',
      data: item.data,
      maxRetries: operation.config.errorHandling.maxRetries,
      retryCount: 0,
      timeout: operation.config.timeouts.taskTimeout,
      batchId: item.id
    };

    // Route to appropriate agent based on operation type
    const agent = this.selectAgent(operation.config.operationType);
    if (!agent) {
      return {
        success: false,
        error: `No suitable agent found for operation type: ${operation.config.operationType}`
      };
    }

    return await agent.executeTask(task);
  }

  /**
   * Select appropriate agent for operation type
   */
  private selectAgent(operationType: BulkOperationConfig['operationType']): DOMAgent | null {
    switch (operationType) {
      case 'seo-update':
        return this.agents.get('seo') || null;
      case 'navigation':
        return this.agents.get('navigation') || null;
      case 'catalog-sync':
        return this.agents.get('catalog') || null;
      case 'validation':
        return this.agents.get('validation') || null;
      case 'image-search':
        return this.agents.get('image-search') || null;
      case 'data-extraction':
        return this.agents.get('extraction') || null;
      case 'form-filling':
        return this.agents.get('form') || null;
      case 'image-processing':
        return this.agents.get('image') || null;
      default:
        return Array.from(this.agents.values())[0] || null;
    }
  }

  /**
   * Map operation type to agent task type
   */
  private mapOperationTypeToTaskType(operationType: BulkOperationConfig['operationType']): AgentTask['type'] {
    const mapping: Record<BulkOperationConfig['operationType'], AgentTask['type']> = {
      'seo-update': 'seo-update',
      'navigation': 'navigate',
      'catalog-sync': 'catalog-sync',
      'validation': 'validation',
      'image-search': 'image-search',
      'data-extraction': 'extract-data',
      'form-filling': 'fill-form',
      'image-processing': 'manage-images',
      'custom': 'custom'
    };
    
    return mapping[operationType] || 'custom';
  }

  /**
   * Create batches from items
   */
  private createBatches(operationId: string, items: BulkOperationItem[], batchSize: number): BulkOperationBatch[] {
    const batches: BulkOperationBatch[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batchItems = items.slice(i, i + batchSize);
      const batch: BulkOperationBatch = {
        id: `batch-${operationId}-${Math.floor(i / batchSize) + 1}`,
        parentOperationId: operationId,
        items: batchItems,
        status: 'pending',
        progress: {
          total: batchItems.length,
          completed: 0,
          failed: 0,
          skipped: 0
        },
        results: [],
        errors: []
      };
      
      batches.push(batch);
    }
    
    return batches;
  }

  /**
   * Collect all errors from batches
   */
  private collectAllErrors(batches: BulkOperationBatch[]): Array<{
    itemId: string;
    batchId: string;
    error: string;
    retryCount: number;
  }> {
    const allErrors: Array<{ itemId: string; batchId: string; error: string; retryCount: number }> = [];
    
    for (const batch of batches) {
      for (const error of batch.errors) {
        allErrors.push({
          itemId: error.itemId,
          batchId: batch.id,
          error: error.error,
          retryCount: error.retryCount
        });
      }
    }
    
    return allErrors;
  }

  /**
   * Wait for operation to be resumed
   */
  private async waitForResume(operationId: string): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.pausedOperations.has(operationId)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Cleanup completed operations
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const operationsToRemove: string[] = [];

    for (const [id, operation] of this.operations) {
      if (operation.endTime && (now - operation.endTime) > maxAge) {
        operationsToRemove.push(id);
      }
    }

    for (const id of operationsToRemove) {
      this.operations.delete(id);
      this.eventHandlers.delete(id);
      this.activeOperations.delete(id);
      this.pausedOperations.delete(id);
    }

    if (operationsToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${operationsToRemove.length} old bulk operations`);
    }
  }
}
