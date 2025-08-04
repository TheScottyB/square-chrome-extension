import { AgentContext } from '../types';
import { SquareSEOAgentEnhanced } from '../square/SquareSEOAgentEnhanced';
import { SquareNavigationAgentEnhanced } from '../square/SquareNavigationAgentEnhanced';
import { SquareCatalogAgentEnhanced } from '../square/SquareCatalogAgentEnhanced';
import { createMockAgents } from '../mock/MockAgents';

export type AgentType = 'seo' | 'navigation' | 'catalog' | 'mock-seo' | 'mock-navigation' | 'mock-catalog';

export interface AgentInstance {
  type: AgentType;
  enhanced: boolean;
  instance: any;
  capabilities: string[];
  ready: boolean;
}

/**
 * Agent Factory for creating and managing specialized agents
 * Provides centralized agent instantiation with fallback to mock agents
 */
export class AgentFactory {
  private static instance: AgentFactory;
  private agents: Map<string, AgentInstance> = new Map();
  private context: AgentContext;

  private constructor(context: AgentContext) {
    this.context = context;
  }

  /**
   * Get singleton instance of AgentFactory
   */
  static getInstance(context: AgentContext): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory(context);
    }
    // Update context if provided
    AgentFactory.instance.context = context;
    return AgentFactory.instance;
  }

  /**
   * Get agent instance by type with automatic fallback
   */
  async getAgent(type: AgentType, forceRecreate: boolean = false): Promise<AgentInstance | null> {
    const cacheKey = `${type}-${this.context.page.pageType}`;
    
    // Return cached agent if available and not forcing recreation
    if (!forceRecreate && this.agents.has(cacheKey)) {
      const cached = this.agents.get(cacheKey)!;
      if (cached.ready) {
        return cached;
      }
    }
    
    try {
      const agentInstance = await this.createAgent(type);
      if (agentInstance) {
        this.agents.set(cacheKey, agentInstance);
        return agentInstance;
      }
    } catch (error) {
      console.warn(`Failed to create ${type} agent:`, error);
    }
    
    // Fallback to mock agent
    if (!type.startsWith('mock-')) {
      console.log(`Falling back to mock agent for ${type}`);
      return await this.getAgent(`mock-${type}` as AgentType);
    }
    
    return null;
  }

  /**
   * Create agent instance based on type and context
   */
  private async createAgent(type: AgentType): Promise<AgentInstance | null> {
    const { pageType } = this.context.page;
    
    switch (type) {
      case 'seo':
        if (!this.isValidForSEO(pageType)) {
          throw new Error(`SEO agent not available for page type: ${pageType}`);
        }
        return {
          type,
          enhanced: true,
          instance: new SquareSEOAgentEnhanced(this.context),
          capabilities: [
            'Real DOM SEO optimization',
            'Form validation and submission',
            'Content generation and optimization',
            'Bulk SEO operations',
            'Screenshot capture for debugging'
          ],
          ready: true
        };

      case 'navigation':
        if (!this.isValidForNavigation(pageType)) {
          throw new Error(`Navigation agent not available for page type: ${pageType}`);
        }
        return {
          type,
          enhanced: true,
          instance: new SquareNavigationAgentEnhanced(this.context),
          capabilities: [
            'Advanced page navigation',
            'URL management and validation',
            'Search functionality with filters',
            'Page load validation',
            'SPA routing handling'
          ],
          ready: true
        };

      case 'catalog':
        if (!this.isValidForCatalog(pageType)) {
          throw new Error(`Catalog agent not available for page type: ${pageType}`);
        }
        return {
          type,
          enhanced: true,
          instance: new SquareCatalogAgentEnhanced(this.context),
          capabilities: [
            'Comprehensive catalog synchronization',
            'Inventory management and updates',
            'Bulk pricing operations',
            'Data extraction and validation',
            'Batch processing capabilities'
          ],
          ready: true
        };

      case 'mock-seo':
      case 'mock-navigation':
      case 'mock-catalog':
        return this.createMockAgent(type);

      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }

  /**
   * Create mock agent for testing and fallback
   */
  private createMockAgent(type: AgentType): AgentInstance | null {
    const mockAgents = createMockAgents(this.context);
    const mockType = type.replace('mock-', '') as 'seo' | 'navigation' | 'catalog';
    const mockAgent = mockAgents.get(mockType);
    
    if (!mockAgent) {
      return null;
    }
    
    return {
      type,
      enhanced: false,
      instance: mockAgent,
      capabilities: [`Mock ${mockType} operations for testing`],
      ready: true
    };
  }

  /**
   * Validate if SEO agent is appropriate for current page
   */
  private isValidForSEO(pageType: string): boolean {
    return ['item-detail', 'item-edit', 'items-library'].includes(pageType);
  }

  /**
   * Validate if Navigation agent is appropriate for current page
   */
  private isValidForNavigation(pageType: string): boolean {
    // Navigation agent works on all Square pages
    return pageType !== 'unknown' && window.location.hostname.includes('squareup.com');
  }

  /**
   * Validate if Catalog agent is appropriate for current page
   */
  private isValidForCatalog(pageType: string): boolean {
    return ['items-library', 'item-detail', 'item-edit', 'inventory'].includes(pageType);
  }

  /**
   * Get all available agents for current context
   */
  getAvailableAgentTypes(): AgentType[] {
    const { pageType } = this.context.page;
    const available: AgentType[] = [];
    
    if (this.isValidForSEO(pageType)) {
      available.push('seo');
    }
    if (this.isValidForNavigation(pageType)) {
      available.push('navigation');
    }
    if (this.isValidForCatalog(pageType)) {
      available.push('catalog');
    }
    
    // Always include mock agents as fallbacks
    available.push('mock-seo', 'mock-navigation', 'mock-catalog');
    
    return available;
  }

  /**
   * Check if specific agent type is available
   */
  isAgentAvailable(type: AgentType): boolean {
    return this.getAvailableAgentTypes().includes(type);
  }

  /**
   * Get agent capabilities by type
   */
  getAgentCapabilities(type: AgentType): string[] {
    const capabilities: Record<AgentType, string[]> = {
      'seo': [
        'Real DOM SEO optimization',
        'Form validation and submission',
        'Content generation and optimization',
        'Bulk SEO operations',
        'Screenshot capture for debugging'
      ],
      'navigation': [
        'Advanced page navigation',
        'URL management and validation',
        'Search functionality with filters',
        'Page load validation',
        'SPA routing handling'
      ],
      'catalog': [
        'Comprehensive catalog synchronization',
        'Inventory management and updates',
        'Bulk pricing operations',
        'Data extraction and validation',
        'Batch processing capabilities'
      ],
      'mock-seo': ['Mock SEO operations for testing'],
      'mock-navigation': ['Mock navigation operations for testing'],
      'mock-catalog': ['Mock catalog operations for testing']
    };
    
    return capabilities[type] || ['Unknown capabilities'];
  }

  /**
   * Update context for all agents (useful when page changes)
   */
  updateContext(newContext: AgentContext): void {
    this.context = newContext;
    
    // Clear cached agents if page type changed
    const currentPageType = newContext.page.pageType;
    for (const [key, agent] of this.agents.entries()) {
      if (!key.includes(currentPageType)) {
        // Remove agents that are no longer valid for the new page type
        if (agent.instance && typeof agent.instance.destroy === 'function') {
          agent.instance.destroy();
        }
        this.agents.delete(key);
      }
    }
  }

  /**
   * Get factory status and statistics
   */
  getStatus(): {
    totalAgents: number;
    activeAgents: number;
    availableTypes: AgentType[];
    context: AgentContext;
  } {
    return {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.ready).length,
      availableTypes: this.getAvailableAgentTypes(),
      context: this.context
    };
  }

  /**
   * Cleanup all agents
   */
  destroy(): void {
    for (const [key, agent] of this.agents.entries()) {
      if (agent.instance && typeof agent.instance.destroy === 'function') {
        agent.instance.destroy();
      }
    }
    this.agents.clear();
    console.log('🧹 AgentFactory destroyed and all agents cleaned up');
  }
}

/**
 * Convenience function to get agent factory instance
 */
export function getAgentFactory(context: AgentContext): AgentFactory {
  return AgentFactory.getInstance(context);
}

/**
 * Convenience function to get agent by type
 */
export async function getAgent(type: AgentType, context: AgentContext): Promise<AgentInstance | null> {
  const factory = getAgentFactory(context);
  return await factory.getAgent(type);
}
