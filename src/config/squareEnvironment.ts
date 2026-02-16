/**
 * Square Environment Configuration Manager
 * Handles test environment setup, URL patterns, and safe testing configuration
 */

export interface SquareEnvironmentConfig {
  environment: 'production' | 'sandbox' | 'test';
  baseUrl: string;
  testAccountEmail?: string;
  requiresAuthentication: boolean;
  rateLimits: {
    requestsPerSecond: number;
    burstLimit: number;
  };
  safetySettings: {
    dryRun: boolean;
    confirmDestructiveActions: boolean;
    maxBulkOperations: number;
  };
}

export interface SquarePageConfig {
  name: string;
  urlPatterns: string[];
  requiredSelectors: string[];
  optionalSelectors: string[];
  authenticatedOnly: boolean;
}

export class SquareEnvironmentManager {
  private config: SquareEnvironmentConfig;
  private pages: Map<string, SquarePageConfig>;

  constructor() {
    this.config = this.getDefaultConfig();
    this.pages = new Map();
    this.initializePageConfigs();
  }

  private getDefaultConfig(): SquareEnvironmentConfig {
    // Check if we're in development/testing mode
    const isDevelopment = chrome?.runtime?.getManifest?.()?.version?.includes('dev') || 
                          globalThis.location?.hostname === 'localhost';

    return {
      environment: isDevelopment ? 'test' : 'production',
      baseUrl: isDevelopment ? 'https://connect.squareupsandbox.com' : 'https://squareup.com',
      requiresAuthentication: true,
      rateLimits: {
        requestsPerSecond: isDevelopment ? 10 : 5,
        burstLimit: isDevelopment ? 20 : 10
      },
      safetySettings: {
        dryRun: isDevelopment,
        confirmDestructiveActions: true,
        maxBulkOperations: isDevelopment ? 100 : 50
      }
    };
  }

  private initializePageConfigs(): void {
    // Dashboard page
    this.pages.set('dashboard', {
      name: 'Square Dashboard',
      urlPatterns: [
        '*://squareup.com/dashboard*',
        '*://connect.squareupsandbox.com/dashboard*'
      ],
      requiredSelectors: [
        '[data-testid="dashboard"]',
        '.dashboard-container',
        'nav[aria-label*="main"]'
      ],
      optionalSelectors: [
        '.revenue-summary',
        '.recent-activity'
      ],
      authenticatedOnly: true
    });

    // Items/Catalog page
    this.pages.set('catalog', {
      name: 'Square Items & Catalog',
      urlPatterns: [
        '*://squareup.com/dashboard/items*',
        '*://connect.squareupsandbox.com/dashboard/items*'
      ],
      requiredSelectors: [
        '[data-testid="items-table"]',
        '.catalog-container',
        'button[aria-label*="Add item"]'
      ],
      optionalSelectors: [
        '.item-row',
        '.pagination-controls'
      ],
      authenticatedOnly: true
    });

    // Item Edit page
    this.pages.set('item-edit', {
      name: 'Square Item Editor',
      urlPatterns: [
        '*://squareup.com/dashboard/items/*/edit*',
        '*://connect.squareupsandbox.com/dashboard/items/*/edit*'
      ],
      requiredSelectors: [
        'input[name*="name"]',
        'textarea[name*="description"]',
        '.item-editor-form'
      ],
      optionalSelectors: [
        'input[name*="price"]',
        '.seo-section',
        '.image-upload'
      ],
      authenticatedOnly: true
    });

    // SEO Settings page
    this.pages.set('seo', {
      name: 'Square SEO Settings',
      urlPatterns: [
        '*://squareup.com/dashboard/online/seo*',
        '*://connect.squareupsandbox.com/dashboard/online/seo*'
      ],
      requiredSelectors: [
        '.seo-form',
        'input[name*="title"]',
        'textarea[name*="description"]'
      ],
      optionalSelectors: [
        '.meta-tags-section',
        '.preview-section'
      ],
      authenticatedOnly: true
    });

    // Login page
    this.pages.set('login', {
      name: 'Square Login',
      urlPatterns: [
        '*://squareup.com/login*',
        '*://connect.squareupsandbox.com/login*'
      ],
      requiredSelectors: [
        'input[type="email"]',
        'input[type="password"]',
        'button[type="submit"]'
      ],
      optionalSelectors: [
        '.forgot-password',
        '.signup-link'
      ],
      authenticatedOnly: false
    });
  }

  /**
   * Get current environment configuration
   */
  getConfig(): SquareEnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Update environment configuration
   */
  updateConfig(updates: Partial<SquareEnvironmentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get page configuration by name
   */
  getPageConfig(pageName: string): SquarePageConfig | undefined {
    return this.pages.get(pageName);
  }

  /**
   * Get all registered page configurations
   */
  getAllPageConfigs(): SquarePageConfig[] {
    return Array.from(this.pages.values());
  }

  /**
   * Detect current page based on URL and DOM
   */
  async detectCurrentPage(url?: string): Promise<string | null> {
    const currentUrl = url || window.location.href;
    
    for (const [pageName, config] of this.pages.entries()) {
      // Check URL patterns
      const urlMatches = config.urlPatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(currentUrl);
      });

      if (urlMatches) {
        // Verify with DOM selectors
        const hasRequiredElements = await this.verifyPageElements(config.requiredSelectors);
        if (hasRequiredElements) {
          return pageName;
        }
      }
    }

    return null;
  }

  /**
   * Verify that required page elements are present
   */
  private async verifyPageElements(selectors: string[]): Promise<boolean> {
    return new Promise((resolve) => {
      // Allow some time for dynamic content to load
      setTimeout(() => {
        const elementsFound = selectors.every(selector => {
          return document.querySelector(selector) !== null;
        });
        resolve(elementsFound);
      }, 500);
    });
  }

  /**
   * Check if current environment is safe for testing
   */
  isSafeForTesting(): boolean {
    return this.config.environment === 'sandbox' || 
           this.config.environment === 'test' ||
           this.config.safetySettings.dryRun;
  }

  /**
   * Get appropriate wait times for current environment
   */
  getWaitTimes() {
    const baseWait = this.config.environment === 'test' ? 100 : 1000;
    return {
      short: baseWait,
      medium: baseWait * 2,
      long: baseWait * 5,
      networkRequest: baseWait * 3
    };
  }

  /**
   * Check if user is authenticated on Square
   */
  async checkAuthentication(): Promise<boolean> {
    try {
      // Look for common authenticated state indicators
      const authIndicators = [
        '.user-menu',
        '[data-testid="user-avatar"]',
        '.dashboard-nav',
        'nav[aria-label*="account"]'
      ];

      const isAuthenticated = authIndicators.some(selector => 
        document.querySelector(selector) !== null
      );

      return isAuthenticated;
    } catch (error) {
      console.warn('Could not verify authentication status:', error);
      return false;
    }
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimits() {
    return this.config.rateLimits;
  }

  /**
   * Check if operation should be confirmed due to safety settings
   */
  shouldConfirmOperation(operationType: 'read' | 'write' | 'bulk' | 'destructive'): boolean {
    if (operationType === 'destructive') {
      return this.config.safetySettings.confirmDestructiveActions;
    }
    
    if (operationType === 'bulk') {
      return !this.isSafeForTesting();
    }

    return false;
  }

  /**
   * Log environment status for debugging
   */
  logEnvironmentStatus(): void {
    console.group('🔧 Square Environment Status');
    console.log('Environment:', this.config.environment);
    console.log('Base URL:', this.config.baseUrl);
    console.log('Safe for testing:', this.isSafeForTesting());
    console.log('Rate limits:', this.config.rateLimits);
    console.log('Safety settings:', this.config.safetySettings);
    console.groupEnd();
  }
}

// Export singleton instance
export const squareEnvironment = new SquareEnvironmentManager();
