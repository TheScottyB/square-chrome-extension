import { AgentContext, AgentTask, AgentResult } from '../types';

/**
 * Mock agent base class for testing
 */
class MockAgent {
  protected context: AgentContext;
  protected name: string;

  constructor(context: AgentContext, name: string) {
    this.context = context;
    this.name = name;
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    console.log(`[${this.name}] Mock executing task:`, task.type);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      message: `Mock ${this.name} completed task: ${task.type}`,
      data: {
        mockResult: true,
        taskType: task.type,
        timestamp: Date.now()
      }
    };
  }

  destroy(): void {
    console.log(`[${this.name}] Mock agent destroyed`);
  }
}

/**
 * Mock SEO Agent
 */
class MockSEOAgent extends MockAgent {
  constructor(context: AgentContext) {
    super(context, 'MockSEOAgent');
  }

  async optimizeSEO(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: 'Mock SEO optimization completed',
      data: {
        seoData: data,
        fieldsUpdated: ['title', 'description'],
        mockResult: true
      }
    };
  }

  async validateSEOFields(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: 'Mock SEO validation completed',
      data: {
        validation: {
          valid: true,
          issues: []
        },
        mockResult: true
      }
    };
  }

  async bulkUpdateSEO(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: 'Mock bulk SEO update completed',
      data: {
        itemsUpdated: 5,
        mockResult: true
      }
    };
  }

  async extractSEOData(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: 'Mock SEO data extraction completed',
      data: {
        seoData: {
          title: 'Mock Title',
          description: 'Mock Description'
        },
        mockResult: true
      }
    };
  }
}

/**
 * Mock Navigation Agent
 */
class MockNavigationAgent extends MockAgent {
  constructor(context: AgentContext) {
    super(context, 'MockNavigationAgent');
  }

  async navigateToPage(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: `Mock navigation to ${data.url || 'page'} completed`,
      data: {
        url: data.url || 'mock://page',
        pageType: 'mock-page',
        navigationTime: 100,
        mockResult: true
      }
    };
  }

  async performSearch(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: `Mock search for "${data.searchTerm}" completed`,
      data: {
        searchTerm: data.searchTerm,
        searchResults: [
          { name: 'Mock Result 1', price: '$10' },
          { name: 'Mock Result 2', price: '$20' }
        ],
        mockResult: true
      }
    };
  }

  async validatePageLoad(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: 'Mock page validation completed',
      data: {
        valid: true,
        pageType: 'mock-page',
        mockResult: true
      }
    };
  }

  async extractSearchResults(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: 'Mock search results extraction completed',
      data: {
        results: ['Result 1', 'Result 2', 'Result 3'],
        mockResult: true
      }
    };
  }
}

/**
 * Mock Catalog Agent
 */
class MockCatalogAgent extends MockAgent {
  constructor(context: AgentContext) {
    super(context, 'MockCatalogAgent');
  }

  async synchronizeCatalog(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: 'Mock catalog synchronization completed',
      data: {
        syncedItems: 10,
        syncTime: Date.now(),
        mockResult: true
      }
    };
  }

  async updateInventory(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: 'Mock inventory update completed',
      data: {
        updatedItems: 5,
        updateTime: Date.now(),
        mockResult: true
      }
    };
  }

  async updatePricing(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: 'Mock pricing update completed',
      data: {
        updatedPrices: 3,
        updateTime: Date.now(),
        mockResult: true
      }
    };
  }

  async extractCatalogData(data: any): Promise<AgentResult> {
    return {
      success: true,
      message: 'Mock catalog data extraction completed',
      data: {
        items: [
          { id: '1', name: 'Mock Item 1', price: 10 },
          { id: '2', name: 'Mock Item 2', price: 20 }
        ],
        itemCount: 2,
        extractionTime: Date.now(),
        mockResult: true
      }
    };
  }
}

/**
 * Create mock agents for testing
 */
export function createMockAgents(context: AgentContext): Map<string, any> {
  const agents = new Map<string, any>();

  agents.set('seo', new MockSEOAgent(context));
  agents.set('navigation', new MockNavigationAgent(context));
  agents.set('catalog', new MockCatalogAgent(context));

  console.log('🧪 Mock agents created for testing');
  
  return agents;
}
