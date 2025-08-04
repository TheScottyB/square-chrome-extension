/**
 * Square Environment Manager
 * Manages environment configuration and URLs for Square Dashboard
 */

export interface SquareEnvironmentConfig {
  baseUrl: string;
  apiUrl?: string;
  environment: 'production' | 'sandbox' | 'test';
  debug: boolean;
}

export class SquareEnvironmentManager {
  private config: SquareEnvironmentConfig;
  private static instance: SquareEnvironmentManager;

  private constructor() {
    this.config = this.detectEnvironment();
  }

  static getInstance(): SquareEnvironmentManager {
    if (!SquareEnvironmentManager.instance) {
      SquareEnvironmentManager.instance = new SquareEnvironmentManager();
    }
    return SquareEnvironmentManager.instance;
  }

  private detectEnvironment(): SquareEnvironmentConfig {
    const hostname = window.location.hostname;
    
    if (hostname.includes('squareup.com')) {
      return {
        baseUrl: 'https://squareup.com',
        apiUrl: 'https://api.squareup.com',
        environment: 'production',
        debug: false
      };
    } else if (hostname.includes('squareupsandbox.com')) {
      return {
        baseUrl: 'https://squareupsandbox.com',
        apiUrl: 'https://api.squareupsandbox.com',
        environment: 'sandbox',
        debug: true
      };
    } else {
      // Local/test environment
      return {
        baseUrl: 'http://localhost:3000',
        environment: 'test',
        debug: true
      };
    }
  }

  getConfig(): SquareEnvironmentConfig {
    return this.config;
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  getCatalogUrl(): string {
    return `${this.config.baseUrl}/dashboard/items/library`;
  }

  getItemUrl(itemId: string): string {
    return `${this.config.baseUrl}/dashboard/items/${itemId}/edit`;
  }

  getInventoryUrl(): string {
    return `${this.config.baseUrl}/dashboard/inventory`;
  }

  getSEOSettingsUrl(): string {
    return `${this.config.baseUrl}/dashboard/online/seo`;
  }

  getDashboardUrl(): string {
    return `${this.config.baseUrl}/dashboard`;
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isSandbox(): boolean {
    return this.config.environment === 'sandbox';
  }

  isTest(): boolean {
    return this.config.environment === 'test';
  }

  isDebugMode(): boolean {
    return this.config.debug;
  }

  getWaitTimes() {
    return {
      short: 500,
      medium: 2000,
      long: 5000,
      networkRequest: 3000
    };
  }

  /**
   * Check if current page is authenticated
   */
  async checkAuthentication(): Promise<boolean> {
    // Simple check - look for auth indicators
    const authIndicators = [
      '.user-menu',
      '[data-testid="user-menu"]',
      '.merchant-name',
      '[data-testid="merchant-name"]'
    ];

    for (const selector of authIndicators) {
      const element = document.querySelector(selector);
      if (element) {
        return true;
      }
    }

    // Check for login page indicators
    const loginIndicators = [
      'form[action*="login"]',
      'input[name="email"][type="email"]',
      '.login-form'
    ];

    for (const selector of loginIndicators) {
      const element = document.querySelector(selector);
      if (element) {
        return false;
      }
    }

    // Default to authenticated if we can't determine
    return true;
  }

  /**
   * Detect current page type
   */
  async detectCurrentPage(): Promise<string | null> {
    const url = window.location.href;
    const path = window.location.pathname;

    if (path.includes('/dashboard/items') && path.includes('/edit')) {
      return 'item-edit';
    } else if (path.includes('/dashboard/items/library')) {
      return 'items-library';
    } else if (path.includes('/dashboard/items')) {
      return 'item-detail';
    } else if (path.includes('/dashboard/inventory')) {
      return 'inventory';
    } else if (path.includes('/dashboard/online/seo')) {
      return 'seo-settings';
    } else if (path.includes('/dashboard')) {
      return 'dashboard';
    }

    return 'unknown';
  }

  /**
   * Check if safe for testing (non-production or explicit test mode)
   */
  isSafeForTesting(): boolean {
    return !this.isProduction() || this.isDebugMode();
  }

  /**
   * Check if operation should be confirmed
   */
  shouldConfirmOperation(operationType: 'write' | 'delete' | 'bulk'): boolean {
    if (this.isProduction() && !this.isDebugMode()) {
      return true;
    }
    return operationType === 'delete' || operationType === 'bulk';
  }
}

// Export singleton instance getter
export const squareEnvironment = SquareEnvironmentManager.getInstance();
