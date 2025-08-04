import { z } from 'zod';

// Core page context interface
export interface PageContext {
  url: string;
  pageType: 'dashboard' | 'items-library' | 'item-detail' | 'item-edit' | 'inventory' | 'seo-settings' | 'unknown';
  itemId?: string;
  timestamp: number;
}

// Agent context passed to all agents
export interface AgentContext {
  page: PageContext;
  userId?: string;
  sessionId: string;
  settings?: {
    testMode: boolean;
    debugMode: boolean;
    apiKey?: string;
  };
}

// Enhanced agent task with operation routing
export interface AgentTask {
  id: string;
  type: 'seo-update' | 'seo-optimize' | 'seo-validate' | 'seo-bulk-update' | 'seo-extract' | 
        'navigate' | 'navigation' | 'search' | 'validate-page' | 'extract-results' |
        'catalog-sync' | 'inventory-update' | 'pricing-update' | 'extract-catalog' |
        'workflow';
  agentType?: 'seo' | 'navigation' | 'catalog' | 'coordinator';
  operation?: string;
  data: any;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  timeout?: number;
  retries?: number;
  dependsOn?: string[];
  createdAt: number;
}

// Enhanced agent result with comprehensive data
export interface AgentResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    [key: string]: any;
    screenshot?: string;
    validation?: {
      valid: boolean;
      issues: string[];
    };
    duration?: number;
    operations?: string[];
    fieldsUpdated?: string[];
    itemsProcessed?: number;
    url?: string;
    pageType?: string;
    searchResults?: any[];
    navigationTime?: number;
  };
  duration?: number;
  timestamp?: number;
  agentType?: string;
  taskId?: string;
}

// Workflow definition for multi-agent operations
export interface WorkflowDefinition {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  rollbackSteps?: WorkflowStep[];
  timeout?: number;
}

export interface WorkflowStep {
  id: string;
  agentType: 'seo' | 'navigation' | 'catalog';
  operation: string;
  data: any;
  dependsOn?: string[];
  critical?: boolean;
  timeout?: number;
  retries?: number;
  rollback?: {
    operation: string;
    data: any;
  };
}

// Zod schemas for validation
export const PageContextSchema = z.object({
  url: z.string().url(),
  pageType: z.enum(['dashboard', 'items-library', 'item-detail', 'item-edit', 'inventory', 'seo-settings', 'unknown']),
  itemId: z.string().optional(),
  timestamp: z.number()
});

export const AgentContextSchema = z.object({
  page: PageContextSchema,
  userId: z.string().optional(),
  sessionId: z.string(),
  settings: z.object({
    testMode: z.boolean(),
    debugMode: z.boolean(),
    apiKey: z.string().optional()
  }).optional()
});

export const AgentTaskSchema = z.object({
  id: z.string(),
  type: z.enum([
    'seo-update', 'seo-optimize', 'seo-validate', 'seo-bulk-update', 'seo-extract',
    'navigate', 'navigation', 'search', 'validate-page', 'extract-results',
    'catalog-sync', 'inventory-update', 'pricing-update', 'extract-catalog',
    'workflow'
  ]),
  agentType: z.enum(['seo', 'navigation', 'catalog', 'coordinator']).optional(),
  operation: z.string().optional(),
  data: z.any(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  timeout: z.number().optional(),
  retries: z.number().default(2),
  dependsOn: z.array(z.string()).optional(),
  createdAt: z.number()
});

export const AgentResultSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  data: z.any().optional(),
  duration: z.number().optional(),
  timestamp: z.number().optional(),
  agentType: z.string().optional(),
  taskId: z.string().optional()
});

export const WorkflowStepSchema = z.object({
  id: z.string(),
  agentType: z.enum(['seo', 'navigation', 'catalog']),
  operation: z.string(),
  data: z.any(),
  dependsOn: z.array(z.string()).optional(),
  critical: z.boolean().default(false),
  timeout: z.number().optional(),
  retries: z.number().default(2),
  rollback: z.object({
    operation: z.string(),
    data: z.any()
  }).optional()
});

export const WorkflowDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(WorkflowStepSchema),
  rollbackSteps: z.array(WorkflowStepSchema).optional(),
  timeout: z.number().optional()
});

// Type guards
export function isValidAgentTask(task: any): task is AgentTask {
  try {
    AgentTaskSchema.parse(task);
    return true;
  } catch {
    return false;
  }
}

export function isValidAgentResult(result: any): result is AgentResult {
  try {
    AgentResultSchema.parse(result);
    return true;
  } catch {
    return false;
  }
}

// Agent operation interfaces for type safety
export interface SEOOperation {
  type: 'optimize' | 'validate' | 'bulk-update' | 'extract';
  data: {
    seoData?: {
      title?: string;
      description?: string;
      tags?: string[];
      metaTitle?: string;
      metaDescription?: string;
      urlSlug?: string;
    };
    itemId?: string;
    generateContent?: boolean;
    productName?: string;
    productDescription?: string;
    category?: string;
    keywords?: string[];
    bulkItems?: Array<{
      itemId: string;
      seoData: any;
    }>;
  };
}

export interface NavigationOperation {
  type: 'navigate' | 'search' | 'validate' | 'extract-results';
  data: {
    url?: string;
    pageType?: string;
    itemId?: string;
    searchTerm?: string;
    searchType?: 'items' | 'customers' | 'orders' | 'global';
    maxResults?: number;
    waitForLoad?: boolean;
    timeout?: number;
    validatePage?: boolean;
  };
}

export interface CatalogOperation {
  type: 'sync' | 'inventory' | 'pricing' | 'extract';
  data: {
    items?: Array<{
      id: string;
      name: string;
      price?: number;
      quantity?: number;
    }>;
    quantities?: Record<string, number>;
    prices?: Record<string, number>;
    locationId?: string;
    syncMode?: 'partial' | 'full';
    trackInventory?: boolean;
    alertThreshold?: number;
    priceType?: 'fixed' | 'percentage';
    currency?: string;
    includeInventory?: boolean;
    includePricing?: boolean;
    itemLimit?: number;
  };
}

// Extended result types for specific operations
export interface SEOResult extends AgentResult {
  data?: AgentResult['data'] & {
    seoData?: any;
    itemId?: string;
    fieldsUpdated?: string[];
    bulkResults?: Array<{
      itemId: string;
      success: boolean;
      fieldsUpdated?: string[];
      error?: string;
    }>;
  };
}

export interface NavigationResult extends AgentResult {
  data?: AgentResult['data'] & {
    url?: string;
    pageType?: string;
    itemId?: string;
    searchResults?: any[];
    navigationTime?: number;
  };
}

export interface CatalogResult extends AgentResult {
  data?: AgentResult['data'] & {
    syncedItems?: number;
    updatedItems?: number;
    totalItems?: number;
    syncTime?: number;
    updateTime?: number;
    items?: any[];
    itemCount?: number;
    extractionTime?: number;
    results?: any[];
  };
}
