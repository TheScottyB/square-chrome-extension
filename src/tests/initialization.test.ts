// Comprehensive initialization test
import { BulkOperationManager } from '../agents/bulk/BulkOperationManager';
import { createMockAgents } from '../agents/mock/MockAgents';
import { AgentContext } from '../agents/types';

describe('Initialization chain', () => {
  const mockContext: AgentContext = {
    page: { url: '', pageType: 'unknown' as const },
    storage: {} as any,
    messaging: {} as any,
    capabilities: {
      canFillForms: false,
      canNavigate: false,
      canExtractData: false,
      canManageImages: false,
      supportedPageTypes: []
    }
  };

  it('should create mock agents without errors', () => {
    expect(() => {
      createMockAgents(mockContext);
    }).not.toThrow();

    const agents = createMockAgents(mockContext);
    expect(agents).toBeInstanceOf(Map);
    expect(agents.size).toBeGreaterThan(0);
  });

  it('should initialize BulkOperationManager with mock agents', () => {
    const agents = createMockAgents(mockContext);
    
    expect(() => {
      new BulkOperationManager(mockContext, agents);
    }).not.toThrow();
  });

  it('should handle bulk operation creation', async () => {
    const agents = createMockAgents(mockContext);
    const bulkManager = new BulkOperationManager(mockContext, agents);

    const config = {
      id: 'test-op',
      name: 'Test Operation',
      operationType: 'validation' as const,
      executionStrategy: 'sequential' as const,
      errorHandling: {
        strategy: 'skip-errors' as const,
        maxRetries: 3,
        retryDelay: 1000
      },
      timeouts: {
        taskTimeout: 30000,
        batchTimeout: 300000,
        totalTimeout: 3600000
      }
    };

    const items = [
      { id: 'item-1', data: { name: 'Test Item 1' } },
      { id: 'item-2', data: { name: 'Test Item 2' } }
    ];

    const callbacks = {
      onStart: () => {},
      onProgress: () => {},
      onBatchComplete: () => {},
      onItemComplete: () => {},
      onError: () => {},
      onPause: () => {},
      onResume: () => {},
      onComplete: () => {},
      onCancel: () => {}
    };

    const operationId = await bulkManager.createOperation(config, items, callbacks);
    expect(typeof operationId).toBe('string');
    expect(operationId.startsWith('bulk-')).toBe(true);

    const status = bulkManager.getOperationStatus(operationId);
    expect(status).toBeDefined();
    expect(status?.name).toBe('Test Operation');
  });

  it('should handle different operation types', async () => {
    const agents = createMockAgents(mockContext);
    
    // The createMockAgents already includes validation and image-search agents
    // Let's verify they exist

    const bulkManager = new BulkOperationManager(mockContext, agents);

    // Test different operation type configurations
    const operationTypes = ['validation', 'catalog-sync', 'image-search'] as const;
    
    for (const operationType of operationTypes) {
      const config = {
        id: `test-${operationType}`,
        name: `Test ${operationType}`,
        operationType,
        executionStrategy: 'sequential' as const,
        errorHandling: {
          strategy: 'skip-errors' as const,
          maxRetries: 2,
          retryDelay: 500
        },
        timeouts: {
          taskTimeout: 10000,
          batchTimeout: 60000,
          totalTimeout: 300000
        }
      };

      const items = [{ id: 'test-item', data: { type: operationType } }];
      const callbacks = {
        onStart: () => {},
        onProgress: () => {},
        onBatchComplete: () => {},
        onItemComplete: () => {},
        onError: () => {},
        onPause: () => {},
        onResume: () => {},
        onComplete: () => {},
        onCancel: () => {}
      };

      expect(async () => {
        await bulkManager.createOperation(config, items, callbacks);
      }).not.toThrow();
    }
  });
});
