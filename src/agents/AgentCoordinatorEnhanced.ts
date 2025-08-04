import { Agent, run } from '@openai/agents';
import { z } from 'zod';
import { DOMAgent } from './base/DOMAgent';
import { getAgent, AgentType } from './factory/AgentFactory';
import { SquareSEOAgentEnhanced } from './square/SquareSEOAgentEnhanced';
import { SquareNavigationAgentEnhanced } from './square/SquareNavigationAgentEnhanced';
import { SquareCatalogAgentEnhanced } from './square/SquareCatalogAgentEnhanced';
import { createMockAgents } from './mock/MockAgents';
import { AgentContext, AgentTask, AgentResult, PageContext } from './types';
import { pageDetectionService } from '@/utils/pageDetectionService';
import { BulkOperationManager } from './bulk/BulkOperationManager';

/**
 * Enhanced Agent Coordinator using real DOM automation agents
 * Manages specialized agents with comprehensive automation capabilities
 */
export class AgentCoordinatorEnhanced {
  private agents: Map<string, any> = new Map();
  private coordinatorAgent: Agent;
  private context: AgentContext;
  private isInitialized = false;
  private isMockAgent = false;

  constructor(context: AgentContext) {
    this.context = context;
    
    // Initialize the meta-agent that coordinates other agents
    try {
      this.coordinatorAgent = new Agent({
        name: 'Enhanced Agent Coordinator',
        instructions: `You are the central coordinator for a team of specialized DOM automation agents with real browser interaction capabilities.
        
        Your role is to:
        - Route tasks to the most appropriate specialized agent
        - Coordinate multi-step workflows requiring multiple agents
        - Handle fallbacks when agents fail
        - Optimize task execution order for efficiency
        - Monitor agent performance and health
        
        Available enhanced agents and their capabilities:
        - SquareSEOAgentEnhanced: Advanced SEO optimization with real DOM manipulation, form validation, content generation, screenshot capture
        - SquareNavigationAgentEnhanced: Sophisticated navigation with URL management, search functionality, page load validation, SPA routing
        - SquareCatalogAgentEnhanced: Comprehensive catalog management with inventory updates, bulk pricing operations, data extraction
        
        These agents use real DOM utilities, comprehensive selectors, and robust error handling.
        Always choose the most specialized enhanced agent for each task type.`,
        model: 'gpt-4o-mini'
      });
    } catch (error) {
      console.warn('Failed to initialize OpenAI Agent (using mock):', error);
      this.isMockAgent = true;
      this.coordinatorAgent = {
        name: 'Mock Enhanced Agent Coordinator'
      } as any;
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Enhanced Agent Coordinator...');

    try {
      // Initialize enhanced specialized agents
      await this.initializeEnhancedAgents();

      // Initialize bulk operation manager
      this.initializeBulkOperations();
      
      // Set up inter-agent communication
      this.setupAgentCommunication();
      
      // Start monitoring page changes
      this.startPageMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Enhanced Agent Coordinator initialized successfully');
      
      // Notify background script
      try {
        chrome.runtime.sendMessage({
          action: 'enhancedAgentCoordinatorReady',
          agentCount: this.agents.size,
          pageContext: this.context.page,
          enhanced: true
        });
      } catch (error) {
        console.log('Background script not available for notification:', error instanceof Error ? error.message : String(error));
      }

    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Agent Coordinator:', error);
      throw error;
    }
  }

  private async initializeEnhancedAgents(): Promise<void> {
    console.log('🔧 Initializing enhanced agents...');

    const agentTypes: AgentType[] = ['seo', 'navigation', 'catalog'];

    for (const type of agentTypes) {
      try {
        const agentInstance = await getAgent(type, this.context);
        if (agentInstance) {
          this.agents.set(type, agentInstance.instance);
          console.log(`✅ Initialized ${type} agent with capabilities:`, agentInstance.capabilities);
        }
      } catch (error) {
        console.warn(`Failed to initialize ${type} agent:`, error);
      }
    }

    console.log('🔄 Enhanced agents initialized:', Array.from(this.agents.keys()));
  }

  /**
   * Execute SEO operations using the enhanced SEO agent
   */
  async executeSEOOperation(operation: {
    type: 'optimize' | 'validate' | 'bulk-update' | 'extract';
    data: any;
  }): Promise<AgentResult> {
    const seoAgent = this.agents.get('seo') as SquareSEOAgentEnhanced;
    
    if (!seoAgent) {
      return {
        success: false,
        error: 'Enhanced SEO agent not available for current page'
      };
    }

    switch (operation.type) {
      case 'optimize':
        return await seoAgent.optimizeSEO(operation.data);
      case 'validate':
        return await seoAgent.validateSEOFields(operation.data);
      case 'bulk-update':
        return await seoAgent.bulkUpdateSEO(operation.data);
      case 'extract':
        return await seoAgent.extractSEOData(operation.data);
      default:
        return {
          success: false,
          error: `Unknown SEO operation: ${operation.type}`
        };
    }
  }

  /**
   * Execute navigation operations using the enhanced navigation agent
   */
  async executeNavigationOperation(operation: {
    type: 'navigate' | 'search' | 'validate' | 'extract-results';
    data: any;
  }): Promise<AgentResult> {
    const navAgent = this.agents.get('navigation') as SquareNavigationAgentEnhanced;
    
    if (!navAgent) {
      return {
        success: false,
        error: 'Enhanced Navigation agent not available'
      };
    }

    switch (operation.type) {
      case 'navigate':
        return await navAgent.navigateToPage(operation.data);
      case 'search':
        return await navAgent.performSearch(operation.data);
      case 'validate':
        return await navAgent.validatePageLoad(operation.data);
      case 'extract-results':
        return await navAgent.extractSearchResults(operation.data);
      default:
        return {
          success: false,
          error: `Unknown navigation operation: ${operation.type}`
        };
    }
  }

  /**
   * Execute catalog operations using the enhanced catalog agent
   */
  async executeCatalogOperation(operation: {
    type: 'sync' | 'inventory' | 'pricing' | 'extract';
    data: any;
  }): Promise<AgentResult> {
    const catalogAgent = this.agents.get('catalog') as SquareCatalogAgentEnhanced;
    
    if (!catalogAgent) {
      return {
        success: false,
        error: 'Enhanced Catalog agent not available'
      };
    }

    switch (operation.type) {
      case 'sync':
        return await catalogAgent.synchronizeCatalog(operation.data);
      case 'inventory':
        return await catalogAgent.updateInventory(operation.data);
      case 'pricing':
        return await catalogAgent.updatePricing(operation.data);
      case 'extract':
        return await catalogAgent.extractCatalogData(operation.data);
      default:
        return {
          success: false,
          error: `Unknown catalog operation: ${operation.type}`
        };
    }
  }

  /**
   * Execute a comprehensive workflow across multiple enhanced agents
   */
  async executeEnhancedWorkflow(workflow: {
    name: string;
    steps: Array<{
      agentType: 'seo' | 'navigation' | 'catalog';
      operation: string;
      data: any;
      dependsOn?: string[];
      critical?: boolean;
    }>;
  }): Promise<{ success: boolean; results: AgentResult[]; message: string }> {
    console.log(`🔄 Executing enhanced workflow: ${workflow.name}`);
    
    const results: AgentResult[] = [];
    const stepResults = new Map<string, AgentResult>();

    try {
      for (const step of workflow.steps) {
        // Check dependencies
        if (step.dependsOn) {
          const dependenciesMet = step.dependsOn.every((dep: string) => 
            stepResults.has(dep) && stepResults.get(dep)?.success
          );
          
          if (!dependenciesMet) {
            const failedResult: AgentResult = {
              success: false,
              error: `Dependencies not met for step: ${step.operation}`,
              data: step.data
            };
            results.push(failedResult);
            stepResults.set(step.operation, failedResult);
            
            // If critical step fails, stop workflow
            if (step.critical) {
              break;
            }
            continue;
          }
        }

        // Execute the step with the appropriate enhanced agent
        let result: AgentResult;
        
        switch (step.agentType) {
          case 'seo':
            result = await this.executeSEOOperation({
              type: step.operation as any,
              data: step.data
            });
            break;
          case 'navigation':
            result = await this.executeNavigationOperation({
              type: step.operation as any,
              data: step.data
            });
            break;
          case 'catalog':
            result = await this.executeCatalogOperation({
              type: step.operation as any,
              data: step.data
            });
            break;
          default:
            result = {
              success: false,
              error: `Unknown agent type: ${step.agentType}`
            };
        }

        results.push(result);
        stepResults.set(step.operation, result);

        // If critical step fails, stop workflow
        if (!result.success && step.critical) {
          console.error(`❌ Critical workflow step failed: ${step.operation}`, result.error);
          break;
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: successCount > 0,
        results,
        message: `Enhanced workflow '${workflow.name}' completed: ${successCount}/${totalCount} steps successful`
      };

    } catch (error) {
      return {
        success: false,
        results,
        message: `Enhanced workflow '${workflow.name}' failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private setupAgentCommunication(): void {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleExternalMessage(message, sender, sendResponse);
      return true; // Will respond asynchronously
    });
  }

  private async handleExternalMessage(message: any, sender: any, sendResponse: Function): Promise<void> {
    try {
      console.log('📨 Enhanced Coordinator received message:', message);

      switch (message.action) {
        case 'executeEnhancedSEO':
          const seoResult = await this.executeSEOOperation(message.operation);
          sendResponse(seoResult);
          break;

        case 'executeEnhancedNavigation':
          const navResult = await this.executeNavigationOperation(message.operation);
          sendResponse(navResult);
          break;

        case 'executeEnhancedCatalog':
          const catalogResult = await this.executeCatalogOperation(message.operation);
          sendResponse(catalogResult);
          break;

        case 'executeEnhancedWorkflow':
          const workflowResult = await this.executeEnhancedWorkflow(message.workflow);
          sendResponse(workflowResult);
          break;

        case 'getEnhancedStatus':
          const status = await this.getEnhancedAgentStatus();
          sendResponse(status);
          break;

        // Legacy compatibility
        case 'updateSEO':
          const legacySeoResult = await this.executeSEOOperation({
            type: 'optimize',
            data: message.data
          });
          sendResponse(legacySeoResult);
          break;

        case 'navigateToItem':
          const legacyNavResult = await this.executeNavigationOperation({
            type: 'navigate',
            data: { itemId: message.itemId, waitForLoad: true }
          });
          sendResponse(legacyNavResult);
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }

    } catch (error) {
      console.error('❌ Error handling enhanced message:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  private async getEnhancedAgentStatus(): Promise<{ agents: Record<string, any>; coordinator: any }> {
    const agentStatus: Record<string, any> = {};

    for (const [name, agent] of this.agents) {
      agentStatus[name] = {
        initialized: true,
        enhanced: !name.startsWith('mock-'),
        capabilities: this.getAgentCapabilities(name, agent),
        ready: true
      };
    }

    return {
      agents: agentStatus,
      coordinator: {
        initialized: this.isInitialized,
        enhanced: true,
        agentCount: this.agents.size,
        pageContext: this.context.page
      }
    };
  }

  private getAgentCapabilities(name: string, agent: any): string[] {
    const capabilities: Record<string, string[]> = {
      'seo': [
        'SEO optimization with real DOM manipulation',
        'Form validation and submission',
        'Content generation and optimization',
        'Bulk SEO operations',
        'Screenshot capture for debugging',
        'Advanced error handling'
      ],
      'navigation': [
        'Sophisticated page navigation',
        'URL management and validation',
        'Advanced search functionality',
        'Page load validation',
        'SPA routing handling',
        'Search result extraction'
      ],
      'catalog': [
        'Comprehensive catalog synchronization',
        'Inventory management and updates',
        'Bulk pricing operations',
        'Data extraction and validation',
        'Batch processing capabilities',
        'Real-time error recovery'
      ]
    };

    return capabilities[name] || ['Basic DOM operations'];
  }

  private initializeBulkOperations(): void {
    const bulkManager = new BulkOperationManager(this.context, this.agents);
    console.log('📦 Enhanced Bulk Operation Manager initialized');
    bulkManager.cleanup();
  }

  private startPageMonitoring(): void {
    console.log('🔍 Starting enhanced page monitoring...');
    
    pageDetectionService.onPageChange(async (context: PageContext) => {
      console.log('📄 Page context changed (enhanced):', context);
      await this.handlePageContextChange(context);
    });
    
    pageDetectionService.startPageMonitoring();
  }

  private async handlePageContextChange(newPageContext: PageContext): Promise<void> {
    try {
      console.log('📄 Handling enhanced page context change:', {
        from: this.context.page.pageType,
        to: newPageContext.pageType
      });
      
      // Reinitialize enhanced agents if page type changed
      if (newPageContext.pageType !== this.context.page.pageType) {
        console.log('🔄 Page type changed, reinitializing enhanced agents...');
        this.context.page = newPageContext;
        
        // Clear existing agents
        this.agents.clear();
        
        // Reinitialize with new context
        await this.initializeEnhancedAgents();
      } else {
        // Just update context
        this.context.page = newPageContext;
      }
    } catch (error) {
      console.error('❌ Error handling enhanced page context change:', error);
    }
  }

  /**
   * Public API methods
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Route task to appropriate enhanced agent
    const result = await this.routeTaskToEnhancedAgent(task);
    return result;
  }

  private async routeTaskToEnhancedAgent(task: AgentTask): Promise<AgentResult> {
    // Determine agent type based on task
    let agentType: string;
    let operation: any;

    // Map task types to enhanced operations
    switch (task.type) {
      case 'seo-update':
      case 'seo-optimize':
        agentType = 'seo';
        operation = { type: 'optimize', data: task.data };
        break;
      case 'seo-validate':
        agentType = 'seo';
        operation = { type: 'validate', data: task.data };
        break;
      case 'navigate':
      case 'navigation':
        agentType = 'navigation';
        operation = { type: 'navigate', data: task.data };
        break;
      case 'search':
        agentType = 'navigation';
        operation = { type: 'search', data: task.data };
        break;
      case 'catalog-sync':
        agentType = 'catalog';
        operation = { type: 'sync', data: task.data };
        break;
      case 'inventory-update':
        agentType = 'catalog';
        operation = { type: 'inventory', data: task.data };
        break;
      default:
        return {
          success: false,
          error: `Unknown task type: ${task.type}`
        };
    }

    // Execute with appropriate enhanced agent
    switch (agentType) {
      case 'seo':
        return await this.executeSEOOperation(operation);
      case 'navigation':
        return await this.executeNavigationOperation(operation);
      case 'catalog':
        return await this.executeCatalogOperation(operation);
      default:
        return {
          success: false,
          error: `No enhanced agent available for type: ${agentType}`
        };
    }
  }

  getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  isAgentAvailable(agentType: string): boolean {
    return this.agents.has(agentType);
  }

  destroy(): void {
    console.log('🧹 Destroying Enhanced Agent Coordinator...');
    
    for (const agent of this.agents.values()) {
      if (agent.destroy) {
        agent.destroy();
      }
    }
    
    this.agents.clear();
    this.isInitialized = false;
  }
}
