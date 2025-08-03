import { AgentCoordinator } from '../../agents/AgentCoordinator';
import { AgentContext } from '../../agents/types';

describe('AgentCoordinator', () => {
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

  describe('initialization', () => {
    it('should initialize without throwing errors', () => {
      expect(() => {
        new AgentCoordinator(mockContext);
      }).not.toThrow();
    });

    it('should handle mock agent fallback gracefully', async () => {
      const coordinator = new AgentCoordinator(mockContext);

      // Test that executeTask works even with mock fallback
      const result = await coordinator.executeTask({
        id: 'test-1',
        type: 'custom',
        priority: 'medium',
        data: { test: true }
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should return available agents list', () => {
      const coordinator = new AgentCoordinator(mockContext);
      const agents = coordinator.getAvailableAgents();
      expect(Array.isArray(agents)).toBe(true);
    });

    it('should check agent availability', () => {
      const coordinator = new AgentCoordinator(mockContext);
      const isAvailable = coordinator.isAgentAvailable('test');
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('task execution', () => {
    it('should handle task execution in mock mode', async () => {
      const coordinator = new AgentCoordinator(mockContext);
      
      const testTask = {
        id: 'test-task-1',
        type: 'seo-update' as const,
        priority: 'medium' as const,
        data: { itemId: 'test-item' }
      };

      const result = await coordinator.executeTask(testTask);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });
});
