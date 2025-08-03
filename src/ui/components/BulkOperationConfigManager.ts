import { BulkOperationConfig } from '@/agents/types';
import { BulkOperationManager } from '@/agents/bulk/BulkOperationManager';

export class BulkOperationConfigManager {
  private manager: BulkOperationManager;

  constructor(manager: BulkOperationManager) {
    this.manager = manager;
  }

  public getCurrentConfiguration(): BulkOperationConfig {
    const strategySelect = this.getElementById('bulk-execution-strategy-select') as HTMLSelectElement;
    const batchSizeInput = this.getElementById('bulk-batch-size') as HTMLInputElement;
    const delayInput = this.getElementById('bulk-delay') as HTMLInputElement;
    const maxRetriesInput = this.getElementById('bulk-max-retries') as HTMLInputElement;
    const continueOnErrorCheckbox = this.getElementById('bulk-continue-on-error') as HTMLInputElement;
    const detailedLoggingCheckbox = this.getElementById('bulk-detailed-logging') as HTMLInputElement;

    return {
      id: `config-${Date.now()}`,
      name: 'Bulk Operation',
      operationType: 'custom',
      executionStrategy: (strategySelect?.value as any) || 'sequential',
      batchSize: parseInt(batchSizeInput?.value || '5'),
      errorHandling: {
        strategy: 'skip-errors',
        maxRetries: parseInt(maxRetriesInput?.value || '3'),
        retryDelay: parseInt(delayInput?.value || '1000')
      },
      timeouts: {
        taskTimeout: 30000,
        batchTimeout: 300000,
        totalTimeout: 3600000
      }
    };
  }

  public updateConfiguration(): void {
    const config = this.getCurrentConfiguration();
    // Mock update configuration - not implemented in manager
    console.log('Updating configuration (mock implementation)', config);
  }

  public updateExecutionStrategy(strategy: string): void {
    const config = this.getCurrentConfiguration();
    config.executionStrategy = strategy as any;
    // Mock update configuration - not implemented in manager
    console.log('Updating execution strategy (mock implementation)', strategy);
  }

  public getCustomOperationConfig(): { filter: any; params: any } {
    const filterCriteria = this.getTextAreaValue('bulk-filter-criteria');
    const operationParams = this.getTextAreaValue('bulk-operation-params');
    
    let filter = {};
    let params = {};

    try {
      if (filterCriteria) {
        filter = JSON.parse(filterCriteria);
      }
    } catch (error) {
      console.error('Invalid filter criteria JSON:', error);
      throw new Error('Invalid filter criteria format. Please use valid JSON.');
    }

    try {
      if (operationParams) {
        params = JSON.parse(operationParams);
      }
    } catch (error) {
      console.error('Invalid operation parameters JSON:', error);
      throw new Error('Invalid operation parameters format. Please use valid JSON.');
    }

    return { filter, params };
  }

  public createConfigForOperation(type: string, params: any = {}): BulkOperationConfig {
    const config = this.getCurrentConfiguration();
    config.operationType = type as any;
    config.name = `${type} Operation`;
    return config;
  }

  public createCustomOperationConfig(): BulkOperationConfig {
    const config = this.getCurrentConfiguration();
    const { filter, params } = this.getCustomOperationConfig();
    
    config.operationType = 'custom';
    config.name = 'Custom Operation';
    
    return config;
  }

  private getElementById(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  private getTextAreaValue(id: string): string {
    const element = this.getElementById(id) as HTMLTextAreaElement;
    return element?.value?.trim() || '';
  }
}
