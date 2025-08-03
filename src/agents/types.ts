/**
 * Type definitions for the OpenAI Agents DOM automation system
 */

export interface PageContext {
  url: string;
  pageType: 'items-library' | 'item-detail' | 'dashboard' | 'spocket' | 'inventory' | 'unknown';
  itemId?: string;
  title?: string;
  readyState?: DocumentReadyState;
}

export interface AgentCapabilities {
  canFillForms: boolean;
  canNavigate: boolean;
  canExtractData: boolean;
  canManageImages: boolean;
  supportedPageTypes: string[];
}

export interface AgentContext {
  page: PageContext;
  storage: typeof chrome.storage.local;
  messaging: typeof chrome.runtime;
  capabilities: AgentCapabilities;
}

export interface AgentTask {
  id: string;
  type: 'seo-update' | 'navigate' | 'extract-data' | 'fill-form' | 'manage-images' | 'search' | 'bulk-operation' | 'custom' | 'catalog-sync' | 'validation' | 'image-search' | 'inventory-update';
  priority: 'high' | 'medium' | 'low';
  data: any;
  maxRetries?: number;
  retryCount?: number;
  timeout?: number;
  batchId?: string;
  batchIndex?: number;
}

export interface AgentResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  executionTime?: number;
  retryCount?: number;
}

export interface DOMElement {
  selector: string;
  element?: HTMLElement;
  exists: boolean;
  visible?: boolean;
  value?: string;
  attributes?: Record<string, string>;
}

export interface DOMObserverConfig {
  targetSelector: string;
  options: MutationObserverInit;
  callback: (mutations: MutationRecord[]) => void;
  debounceMs?: number;
}

export interface SEOData {
  title?: string;
  description?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  searchTerms?: string[];
}

export interface SquareItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  seoData?: SEOData;
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'event' | 'error';
  action: string;
  data: any;
  timestamp: number;
}

export interface AgentState {
  isInitialized: boolean;
  isProcessing: boolean;
  lastTask?: AgentTask;
  lastResult?: AgentResult;
  errorCount: number;
  successCount: number;
}

// Bulk Operation Types
export interface BulkOperationConfig {
  id: string;
  name: string;
  description?: string;
  operationType: 'seo-update' | 'data-extraction' | 'navigation' | 'form-filling' | 'image-processing' | 'custom' | 'catalog-sync' | 'validation' | 'image-search';
  executionStrategy: 'parallel' | 'sequential' | 'rate-limited';
  batchSize?: number;
  rateLimit?: {
    requestsPerSecond: number;
    burstLimit?: number;
  };
  errorHandling: {
    strategy: 'stop-on-error' | 'skip-errors' | 'retry-failed';
    maxRetries: number;
    retryDelay: number;
  };
  timeouts: {
    taskTimeout: number;
    batchTimeout: number;
    totalTimeout: number;
  };
  validation?: {
    preValidation?: (data: any) => boolean;
    postValidation?: (result: AgentResult) => boolean;
  };
}

export interface BulkOperationItem {
  id: string;
  data: any;
  priority?: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

export interface BulkOperationBatch {
  id: string;
  parentOperationId: string;
  items: BulkOperationItem[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startTime?: number;
  endTime?: number;
  progress: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
  };
  results: AgentResult[];
  errors: Array<{
    itemId: string;
    error: string;
    retryCount: number;
  }>;
}

export interface BulkOperationStatus {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startTime?: number;
  endTime?: number;
  estimatedCompletion?: number;
  progress: {
    totalItems: number;
    completedItems: number;
    failedItems: number;
    skippedItems: number;
    currentBatch?: number;
    totalBatches: number;
    percentage: number;
  };
  performance: {
    itemsPerSecond: number;
    averageTaskTime: number;
    errorRate: number;
  };
  batches: BulkOperationBatch[];
  config: BulkOperationConfig;
}

export interface BulkOperationResult {
  operationId: string;
  success: boolean;
  status: BulkOperationStatus;
  summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
    skipped: number;
    executionTime: number;
  };
  details: {
    batches: BulkOperationBatch[];
    errors: Array<{
      itemId: string;
      batchId: string;
      error: string;
      retryCount: number;
    }>;
    performance: {
      itemsPerSecond: number;
      averageTaskTime: number;
      peakMemoryUsage?: number;
    };
  };
}

export interface BulkOperationEvents {
  onStart: (operation: BulkOperationStatus) => void;
  onProgress: (progress: BulkOperationStatus['progress']) => void;
  onBatchComplete: (batch: BulkOperationBatch) => void;
  onItemComplete: (item: BulkOperationItem, result: AgentResult) => void;
  onError: (error: { itemId: string; error: string; retryCount: number }) => void;
  onPause: (operation: BulkOperationStatus) => void;
  onResume: (operation: BulkOperationStatus) => void;
  onComplete: (result: BulkOperationResult) => void;
  onCancel: (operation: BulkOperationStatus) => void;
}

// Alias for BulkOperationItem to match UI expectations
export type BulkOperationTask = BulkOperationItem;
