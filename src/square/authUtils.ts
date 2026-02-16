/**
 * Square Authentication Helper Utilities
 * Handle Square login state, session management, and authentication checks
 */

import { SquareDOMUtils } from './domUtils';
import { authentication } from './selectors';
import { squareEnvironment } from '@/config/squareEnvironment';

export interface AuthenticationStatus {
  isAuthenticated: boolean;
  accountName?: string;
  userEmail?: string;
  lastChecked: number;
}

export class SquareAuthUtils {
  private static lastAuthStatus: AuthenticationStatus | null = null;
  private static statusCacheDuration = 30000; // 30 seconds

  /**
   * Check if user is currently authenticated on Square
   */
  static async checkAuthentication(forceRefresh = false): Promise<AuthenticationStatus> {
    const now = Date.now();
    
    // Return cached status if still valid
    if (!forceRefresh && this.lastAuthStatus && 
        (now - this.lastAuthStatus.lastChecked) < this.statusCacheDuration) {
      return this.lastAuthStatus;
    }

    try {
      // Use environment manager's authentication check
      const isAuthenticated = await squareEnvironment.checkAuthentication();
      
      let accountName: string | undefined;
      let userEmail: string | undefined;

      if (isAuthenticated) {
        // Try to extract account information
        const accountNameResult = await SquareDOMUtils.extractText(
          authentication.accountName,
          { timeout: 2000 }
        );
        if (accountNameResult.success) {
          accountName = accountNameResult.text;
        }

        // Try to extract user email from various sources
        userEmail = await this.extractUserEmail();
      }

      this.lastAuthStatus = {
        isAuthenticated,
        accountName,
        userEmail,
        lastChecked: now
      };

      return this.lastAuthStatus;

    } catch (error) {
      console.warn('Authentication check failed:', error);
      
      this.lastAuthStatus = {
        isAuthenticated: false,
        lastChecked: now
      };

      return this.lastAuthStatus;
    }
  }

  /**
   * Wait for user to be authenticated
   */
  static async waitForAuthentication(timeout = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = await this.checkAuthentication(true);
      
      if (status.isAuthenticated) {
        return true;
      }

      // Wait before checking again
      await SquareDOMUtils.delay(2000);
    }

    return false;
  }

  /**
   * Navigate to login page if not authenticated
   */
  static async ensureAuthenticated(): Promise<{ success: boolean; message?: string }> {
    const status = await this.checkAuthentication();
    
    if (status.isAuthenticated) {
      return { success: true };
    }

    // Check if we're already on a login page
    if (window.location.href.includes('/login')) {
      return { 
        success: false,
        message: 'Already on login page. Please log in manually.'
      };
    }

    // Redirect to login page
    const config = squareEnvironment.getConfig();
    const loginUrl = `${config.baseUrl}/login`;
    
    try {
      window.location.href = loginUrl;
      return { 
        success: false,
        message: 'Redirecting to login page...'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to redirect to login: ${error}`
      };
    }
  }

  /**
   * Extract user email from page elements
   */
  private static async extractUserEmail(): Promise<string | undefined> {
    // Try various selectors where email might be displayed
    const emailSelectors = [
      '[data-testid="user-email"]',
      '.user-email',
      '.account-email',
      '[title*="@"]',
      'span:contains("@")',
      '.user-info [data-email]'
    ];

    for (const selector of emailSelectors) {
      try {
        const result = await SquareDOMUtils.extractText(selector, { timeout: 1000 });
        if (result.success && result.text && result.text.includes('@')) {
          return result.text.trim();
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    return undefined;
  }

  /**
   * Check if current page requires authentication
   */
  static requiresAuthentication(url?: string): boolean {
    const currentUrl = url || window.location.href;
    
    // Login page doesn't require authentication
    if (currentUrl.includes('/login') || currentUrl.includes('/signup')) {
      return false;
    }

    // Dashboard and related pages require authentication
    const protectedPaths = [
      '/dashboard',
      '/items',
      '/inventory',
      '/orders',
      '/customers',
      '/analytics',
      '/settings',
      '/online'
    ];

    return protectedPaths.some(path => currentUrl.includes(path));
  }

  /**
   * Get authentication status for display
   */
  static getAuthStatusMessage(status: AuthenticationStatus): string {
    if (status.isAuthenticated) {
      const parts = ['✅ Authenticated'];
      if (status.accountName) {
        parts.push(`as ${status.accountName}`);
      }
      return parts.join(' ');
    } else {
      return '❌ Not authenticated';
    }
  }

  /**
   * Clear cached authentication status
   */
  static clearAuthCache(): void {
    this.lastAuthStatus = null;
  }

  /**
   * Monitor authentication state changes
   */
  static startAuthMonitoring(
    onAuthChange: (status: AuthenticationStatus) => void,
    checkInterval = 60000 // 1 minute
  ): () => void {
    let isRunning = true;
    let lastIsAuthenticated: boolean | undefined;

    const checkLoop = async () => {
      while (isRunning) {
        try {
          const status = await this.checkAuthentication(true);
          
          // Only notify if authentication status changed
          if (lastIsAuthenticated !== status.isAuthenticated) {
            lastIsAuthenticated = status.isAuthenticated;
            onAuthChange(status);
          }
        } catch (error) {
          console.warn('Auth monitoring check failed:', error);
        }

        await SquareDOMUtils.delay(checkInterval);
      }
    };

    // Start the monitoring loop
    checkLoop();

    // Return cleanup function
    return () => {
      isRunning = false;
    };
  }

  /**
   * Log authentication status for debugging
   */
  static logAuthStatus(status: AuthenticationStatus): void {
    console.group('🔐 Square Authentication Status');
    console.log('Authenticated:', status.isAuthenticated);
    console.log('Account:', status.accountName || 'Unknown');
    console.log('Email:', status.userEmail || 'Unknown');
    console.log('Last checked:', new Date(status.lastChecked).toISOString());
    console.log('Environment:', squareEnvironment.getConfig().environment);
    console.groupEnd();
  }
}
