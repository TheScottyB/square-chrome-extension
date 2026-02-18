import { DOMAgent } from '../base/DOMAgent';
import { AgentTask, AgentResult, AgentContext } from '../types';

function isTestEnvironment(): boolean {
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
}

/**
 * Mock validation agent for testing bulk operations
 */
export class MockValidationAgent extends DOMAgent {
  constructor(context: AgentContext) {
    super(context, {
      name: 'Mock Validation Agent',
      instructions: 'You are a mock validation agent for testing purposes. You validate data integrity and business rules.',
      model: 'gpt-4o-mini'
    });
  }

  protected buildTools() {
    return [];
  }

  protected async executeTaskInternal(task: AgentTask): Promise<AgentResult> {
    console.log(`🔍 Mock validation agent processing: ${task.type}`, task.data);
    
    try {
      // Mock validation processing
      await this.delay(isTestEnvironment() ? 1 : (Math.random() * 1000 + 500)); // 0.5-1.5 seconds
      
      // Simulate occasional validation failures
      if (!isTestEnvironment() && Math.random() < 0.2) {
        throw new Error('Validation failed: Data does not meet business rules');
      }
      
      return {
        success: true,
        message: `Validation completed for item ${task.data?.itemId || 'unknown'}`,
        data: {
          validationResult: 'passed',
          checkedRules: ['required_fields', 'data_format', 'business_logic'],
          validationTime: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Mock image search agent for testing bulk operations
 */
export class MockImageSearchAgent extends DOMAgent {
  constructor(context: AgentContext) {
    super(context, {
      name: 'Mock Image Search Agent',
      instructions: 'You are a mock image search agent for testing purposes. You search for and process images.',
      model: 'gpt-4o-mini'
    });
  }

  protected buildTools() {
    return [];
  }

  protected async executeTaskInternal(task: AgentTask): Promise<AgentResult> {
    console.log(`🖼️ Mock image search agent processing: ${task.type}`, task.data);
    
    try {
      // Mock image search processing
      await this.delay(isTestEnvironment() ? 1 : (Math.random() * 2000 + 1000)); // 1-3 seconds
      
      // Simulate occasional search failures
      if (!isTestEnvironment() && Math.random() < 0.15) {
        throw new Error('Image search failed: No suitable images found');
      }
      
      return {
        success: true,
        message: `Image search completed for item ${task.data?.itemId || 'unknown'}`,
        data: {
          foundImages: [
            { url: 'https://example.com/image1.jpg', score: 0.95 },
            { url: 'https://example.com/image2.jpg', score: 0.87 }
          ],
          searchQuery: task.data?.query || 'default query',
          searchTime: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create and return all mock agents
 */
export function createMockAgents(context: AgentContext): Map<string, DOMAgent> {
  const agents = new Map<string, DOMAgent>();
  
  agents.set('validation', new MockValidationAgent(context));
  agents.set('image-search', new MockImageSearchAgent(context));
  
  return agents;
}
