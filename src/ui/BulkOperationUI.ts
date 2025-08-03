// Bulk Operations UI Controller - Refactored
import { BulkOperationManager } from '@/agents/bulk/BulkOperationManager';
import { BulkOperationEventHandler, BulkOperationEventHandlerCallbacks } from './components/BulkOperationEventHandler';
import { BulkOperationStateManager } from './components/BulkOperationStateManager';
import { BulkOperationDisplayManager } from './components/BulkOperationDisplayManager';
import { BulkOperationConfigManager } from './components/BulkOperationConfigManager';

export class BulkOperationUI implements BulkOperationEventHandlerCallbacks {
  private manager: BulkOperationManager;
  private stateManager: BulkOperationStateManager;
  private displayManager: BulkOperationDisplayManager;
  private configManager: BulkOperationConfigManager;
  private eventHandler: BulkOperationEventHandler;

  constructor(manager: BulkOperationManager) {
    this.manager = manager;
    this.stateManager = new BulkOperationStateManager(manager);
    this.displayManager = new BulkOperationDisplayManager();
    this.configManager = new BulkOperationConfigManager(manager);
    this.eventHandler = new BulkOperationEventHandler(manager, this.configManager, this.stateManager, this);

    this.stateManager.setStateUpdateCallback(() => this.updateDisplay());
    this.eventHandler.initialize();
    this.stateManager.startPeriodicUpdates();
  }

  public destroy(): void {
    this.stateManager.stopPeriodicUpdates();
  }

  // Event handler callback implementations
  public async onOperationStart(type: string, params?: any): Promise<void> {
    try {
      const config = this.configManager.createConfigForOperation(type, params);
await this.manager.startOperation(type);
      await this.stateManager.updateState();
    } catch (error) {
      console.error('Failed to start bulk operation:', error);
      this.stateManager.addError('system', `Failed to start ${type} operation: ${error}`, error);
    }
  }

  public async onCustomOperationStart(): Promise<void> {
    try {
      const config = this.configManager.createCustomOperationConfig();
const events = {
      onStart: () => {},
      onProgress: () => {},
      onBatchComplete: () => {},
      onItemComplete: () => {},
      onPause: () => {},
      onResume: () => {},
      onCancel: () => {},
      onComplete: () => {},
      onError: () => {}
    };
    const operationId = await this.manager.createOperation(config, [], events);
    await this.manager.startOperation(operationId);
      await this.stateManager.updateState();
    } catch (error) {
      console.error('Failed to start custom operation:', error);
      this.stateManager.addError('system', `Failed to start custom operation: ${error}`, error);
    }
  }

  public onOperationControl(action: 'pause' | 'resume' | 'cancel'): void {
    switch (action) {
      case 'pause':
        this.stateManager.pauseOperation();
        break;
      case 'resume':
        this.stateManager.resumeOperation();
        break;
      case 'cancel':
        this.stateManager.cancelOperation();
        break;
    }
  }

  public onQueueAction(action: 'clear' | 'retryFailed'): void {
    switch (action) {
      case 'clear':
        this.stateManager.clearQueue();
        break;
      case 'retryFailed':
        this.stateManager.retryFailedTasks();
        break;
    }
  }

  public onErrorAction(action: 'clear'): void {
    this.stateManager.clearErrors();
  }

  public async onAdvancedOperation(action: 'preview' | 'export'): Promise<void> {
    switch (action) {
      case 'preview':
        try {
          const config = this.configManager.getCurrentConfiguration();
const preview = { itemCount: 10, estimatedDuration: '5 minutes', operations: ['seo-update'] }; // Mock preview
          alert(`Operation Preview:\n\nAffected items: ${preview.itemCount}\nEstimated duration: ${preview.estimatedDuration}\nOperations: ${preview.operations.join(', ')}`);
        } catch (error) {
          console.error('Failed to preview operation:', error);
          this.stateManager.addError('system', `Failed to preview operation: ${error}`, error);
        }
        break;
      case 'export':
        try {
const results = { results: [] }; // Mock results
          const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bulk-operation-results-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Failed to export results:', error);
          this.stateManager.addError('system', `Failed to export results: ${error}`, error);
        }
        break;
    }
  }

  public onTabSwitch(tabName: string): void {
    this.displayManager.switchTab(tabName);
  }

  public onConfigurationChange(): void {
    this.configManager.updateConfiguration();
  }

  private updateDisplay(): void {
    this.displayManager.updateDisplay(this.stateManager.getState());
  }
}
