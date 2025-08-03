import { BulkOperationManager } from '@/agents/bulk/BulkOperationManager';
import { BulkOperationConfigManager } from './BulkOperationConfigManager';
import { BulkOperationStateManager } from './BulkOperationStateManager';

export interface BulkOperationEventHandlerCallbacks {
  onTabSwitch: (tabName: string) => void;
  onOperationStart: (type: string, params?: any) => Promise<void>;
  onCustomOperationStart: () => Promise<void>;
  onOperationControl: (action: 'pause' | 'resume' | 'cancel') => void;
  onQueueAction: (action: 'clear' | 'retryFailed') => void;
  onErrorAction: (action: 'clear') => void;
  onAdvancedOperation: (action: 'preview' | 'export') => Promise<void>;
  onConfigurationChange: () => void;
}

export class BulkOperationEventHandler {
  private manager: BulkOperationManager;
  private configManager: BulkOperationConfigManager;
  private stateManager: BulkOperationStateManager;
  private callbacks: BulkOperationEventHandlerCallbacks;

  constructor(
    manager: BulkOperationManager,
    configManager: BulkOperationConfigManager,
    stateManager: BulkOperationStateManager,
    callbacks: BulkOperationEventHandlerCallbacks
  ) {
    this.manager = manager;
    this.configManager = configManager;
    this.stateManager = stateManager;
    this.callbacks = callbacks;
  }

  public initialize(): void {
    this.setupTabEventListeners();
    this.setupQuickActionListeners();
    this.setupOperationControlListeners();
    this.setupQueueManagementListeners();
    this.setupErrorManagementListeners();
    this.setupAdvancedOperationListeners();
    this.setupConfigurationListeners();
  }

  private setupTabEventListeners(): void {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.getAttribute('data-tab');
        if (tabName) {
          this.callbacks.onTabSwitch(tabName);
        }
      });
    });
  }

  private setupQuickActionListeners(): void {
    const quickActions = [
      { id: 'bulk-seo-all', type: 'seo-update', params: { updateAllFields: true } },
      { id: 'bulk-images-all', type: 'image-search', params: { downloadImages: true } },
      { id: 'bulk-sync-catalog', type: 'catalog-sync', params: { fullSync: true } },
      { id: 'bulk-validate-all', type: 'validation', params: { comprehensive: true } }
    ];

    quickActions.forEach(({ id, type, params }) => {
      this.getElementById(id)?.addEventListener('click', () => {
        this.callbacks.onOperationStart(type, params);
      });
    });

    this.getElementById('start-custom-bulk')?.addEventListener('click', () => {
      this.callbacks.onCustomOperationStart();
    });
  }

  private setupOperationControlListeners(): void {
    const controls = [
      { id: 'bulk-pause', action: 'pause' as const },
      { id: 'bulk-resume', action: 'resume' as const },
      { id: 'bulk-cancel', action: 'cancel' as const }
    ];

    controls.forEach(({ id, action }) => {
      this.getElementById(id)?.addEventListener('click', () => {
        this.callbacks.onOperationControl(action);
      });
    });
  }

  private setupQueueManagementListeners(): void {
    this.getElementById('bulk-clear-queue')?.addEventListener('click', () => {
      this.callbacks.onQueueAction('clear');
    });

    this.getElementById('bulk-retry-failed')?.addEventListener('click', () => {
      this.callbacks.onQueueAction('retryFailed');
    });
  }

  private setupErrorManagementListeners(): void {
    this.getElementById('bulk-clear-errors')?.addEventListener('click', () => {
      this.callbacks.onErrorAction('clear');
    });
  }

  private setupAdvancedOperationListeners(): void {
    this.getElementById('bulk-preview-operation')?.addEventListener('click', () => {
      this.callbacks.onAdvancedOperation('preview');
    });

    this.getElementById('bulk-export-results')?.addEventListener('click', () => {
      this.callbacks.onAdvancedOperation('export');
    });
  }

  private setupConfigurationListeners(): void {
    // Execution strategy changes
    this.getElementById('bulk-execution-strategy-select')?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.configManager.updateExecutionStrategy(target.value as any);
      this.callbacks.onConfigurationChange();
    });

    // Real-time config updates for input fields
    const configInputs = ['bulk-batch-size', 'bulk-delay', 'bulk-max-retries'];
    configInputs.forEach(id => {
      this.getElementById(id)?.addEventListener('change', () => {
        this.callbacks.onConfigurationChange();
      });
    });

    // Real-time config updates for checkboxes
    const configCheckboxes = ['bulk-continue-on-error', 'bulk-detailed-logging'];
    configCheckboxes.forEach(id => {
      this.getElementById(id)?.addEventListener('change', () => {
        this.callbacks.onConfigurationChange();
      });
    });
  }

  private getElementById(id: string): HTMLElement | null {
    return document.getElementById(id);
  }
}
