import { AgentContext, AgentTask, AgentResult } from '../types';

export interface DOMAgentConfig {
  name: string;
  instructions: string;
  timeout?: number;
  retries?: number;
}

/**
 * Base DOM Agent class providing common functionality for all enhanced agents
 */
export abstract class DOMAgent {
  protected context: AgentContext;
  protected config: DOMAgentConfig;
  protected isInitialized: boolean = false;

  constructor(context: AgentContext, config: DOMAgentConfig) {
    this.context = context;
    this.config = {
      timeout: 10000,
      retries: 2,
      ...config
    };
  }

  /**
   * Initialize the agent - override in subclasses if needed
   */
  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  /**
   * Execute a task - main entry point
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    try {
      const result = await this.executeTaskInternal(task);
      
      return {
        ...result,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        agentType: this.config.name,
        taskId: task.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        agentType: this.config.name,
        taskId: task.id
      };
    }
  }

  /**
   * Abstract method to be implemented by subclasses
   */
  protected abstract executeTaskInternal(task: AgentTask): Promise<AgentResult>;

  /**
   * Build agent-specific tools - override in subclasses
   */
  protected abstract buildTools(): any[];

  /**
   * Update agent context when page changes
   */
  updateContext(newContext: AgentContext): void {
    this.context = newContext;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): string[] {
    return ['Base DOM operations'];
  }

  /**
   * Check if agent is ready for operations
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.isInitialized = false;
  }

  /**
   * Utility method for logging
   */
  protected log(message: string, ...args: any[]): void {
    console.log(`[${this.config.name}] ${message}`, ...args);
  }

  /**
   * Utility method for error logging
   */
  protected logError(message: string, error?: any): void {
    console.error(`[${this.config.name}] ${message}`, error);
  }
}
