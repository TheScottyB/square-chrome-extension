import { AgentContext, AgentResult, AgentTask } from '../types';

/**
 * Bulk Operation Manager
 * Handles batch processing and bulk operations across agents
 */
export class BulkOperationManager {
  private context: AgentContext;
  private agents: Map<string, any>;
  private activeOperations: Map<string, BulkOperation> = new Map();

  constructor(context: AgentContext, agents: Map<string, any>) {
    this.context = context;
    this.agents = agents;
  }

  /**
   * Execute bulk operation with progress tracking
   */
  async executeBulkOperation(operation: BulkOperationConfig): Promise<BulkOperationResult> {
    const operationId = this.generateOperationId();
    const bulkOp = new BulkOperation(operationId, operation, this.agents);
    
    this.activeOperations.set(operationId, bulkOp);
    
    try {
      const result = await bulkOp.execute();
      return result;
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  /**
   * Get status of active bulk operations
   */
  getActiveOperations(): BulkOperationStatus[] {
    return Array.from(this.activeOperations.values()).map(op => op.getStatus());
  }

  /**
   * Cancel a bulk operation
   */
  cancelOperation(operationId: string): boolean {
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      operation.cancel();
      return true;
    }
    return false;
  }

  /**
   * Cleanup completed operations
   */
  cleanup(): void {
    // Clean up any completed operations
    for (const [id, operation] of this.activeOperations) {
      if (operation.isCompleted()) {
        this.activeOperations.delete(id);
      }
    }
  }

  private generateOperationId(): string {
    return `bulk-op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Individual bulk operation handler
 */
class BulkOperation {
  private id: string;
  private config: BulkOperationConfig;
  private agents: Map<string, any>;
  private status: BulkOperationStatus;
  private cancelled = false;
  private results: AgentResult[] = [];

  constructor(id: string, config: BulkOperationConfig, agents: Map<string, any>) {
    this.id = id;
    this.config = config;
    this.agents = agents;
    this.status = {
      id,
      type: config.type,
      totalItems: config.items.length,
      processedItems: 0,
      successCount: 0,
      failureCount: 0,
      status: 'pending',
      startTime: Date.now()
    };
  }

  async execute(): Promise<BulkOperationResult> {
    this.status.status = 'running';
    this.status.startTime = Date.now();

    const batchSize = this.config.batchSize || 5;
    const items = this.config.items;

    try {
      // Process items in batches
      for (let i = 0; i < items.length; i += batchSize) {
        if (this.cancelled) {
          this.status.status = 'cancelled';
          break;
        }

        const batch = items.slice(i, i + batchSize);
        await this.processBatch(batch);

        // Add delay between batches
        if (i + batchSize < items.length && this.config.delayBetweenBatches) {
          await this.delay(this.config.delayBetweenBatches);
        }
      }

      this.status.status = this.cancelled ? 'cancelled' : 'completed';
      this.status.endTime = Date.now();

      return {
        success: this.status.successCount > 0,
        operationId: this.id,
        totalItems: this.status.totalItems,
        successCount: this.status.successCount,
        failureCount: this.status.failureCount,
        results: this.results,
        duration: this.status.endTime - this.status.startTime
      };

    } catch (error) {
      this.status.status = 'failed';
      this.status.endTime = Date.now();
      throw error;
    }
  }

  private async processBatch(batch: any[]): Promise<void> {
    const promises = batch.map(item => this.processItem(item));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      this.status.processedItems++;
      
      if (result.status === 'fulfilled' && result.value.success) {
        this.status.successCount++;
        this.results.push(result.value);
      } else {
        this.status.failureCount++;
        const error = result.status === 'rejected' 
          ? result.reason 
          : (result.value as AgentResult).error;
        
        this.results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          data: { item: batch[index] }
        });
      }

      // Call progress callback if provided
      if (this.config.onProgress) {
        this.config.onProgress(this.getStatus());
      }
    });
  }

  private async processItem(item: any): Promise<AgentResult> {
    const agent = this.agents.get(this.config.agentType);
    
    if (!agent) {
      throw new Error(`Agent not found: ${this.config.agentType}`);
    }

    // Execute the appropriate operation based on type
    switch (this.config.type) {
      case 'seo-bulk-update':
        return await agent.handleSEOUpdate({ seoData: item });
      
      case 'catalog-bulk-sync':
        return await agent.synchronizeCatalog({ items: [item] });
      
      case 'inventory-bulk-update':
        return await agent.updateInventory({ quantities: { [item.id]: item.quantity } });
      
      case 'pricing-bulk-update':
        return await agent.updatePricing({ prices: { [item.id]: item.price } });
      
      default:
        throw new Error(`Unknown bulk operation type: ${this.config.type}`);
    }
  }

  cancel(): void {
    this.cancelled = true;
  }

  getStatus(): BulkOperationStatus {
    return { ...this.status };
  }

  isCompleted(): boolean {
    return ['completed', 'failed', 'cancelled'].includes(this.status.status);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Type definitions
export interface BulkOperationConfig {
  type: 'seo-bulk-update' | 'catalog-bulk-sync' | 'inventory-bulk-update' | 'pricing-bulk-update';
  agentType: string;
  items: any[];
  batchSize?: number;
  delayBetweenBatches?: number;
  onProgress?: (status: BulkOperationStatus) => void;
}

export interface BulkOperationStatus {
  id: string;
  type: string;
  totalItems: number;
  processedItems: number;
  successCount: number;
  failureCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
}

export interface BulkOperationResult {
  success: boolean;
  operationId: string;
  totalItems: number;
  successCount: number;
  failureCount: number;
  results: AgentResult[];
  duration: number;
}
