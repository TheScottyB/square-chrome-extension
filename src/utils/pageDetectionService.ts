import { PageContext } from '@/agents/types';
import { squareEnvironment } from './SquareEnvironmentManager';

/**
 * Page Detection Service
 * Monitors and detects page changes in Square Dashboard
 */
class PageDetectionService {
  private observers: Array<(context: PageContext) => void> = [];
  private currentContext: PageContext | null = null;
  private mutationObserver: MutationObserver | null = null;
  private urlCheckInterval: number | null = null;
  private isMonitoring = false;

  /**
   * Start monitoring page changes
   */
  startPageMonitoring(): void {
    if (this.isMonitoring) {
      console.log('Page monitoring already active');
      return;
    }

    console.log('🔍 Starting page detection monitoring...');
    this.isMonitoring = true;

    // Initial page detection
    this.detectPageChange();

    // Monitor URL changes (for SPA navigation)
    this.startUrlMonitoring();

    // Monitor DOM changes
    this.startDomMonitoring();

    // Listen for history API changes
    this.interceptHistoryChanges();
  }

  /**
   * Stop monitoring page changes
   */
  stopPageMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('🛑 Stopping page detection monitoring...');
    this.isMonitoring = false;

    if (this.urlCheckInterval) {
      clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  /**
   * Register observer for page changes
   */
  onPageChange(callback: (context: PageContext) => void): void {
    this.observers.push(callback);
  }

  /**
   * Remove observer
   */
  removeObserver(callback: (context: PageContext) => void): void {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  /**
   * Get current page context
   */
  async getCurrentContext(): Promise<PageContext> {
    if (!this.currentContext) {
      await this.detectPageChange();
    }
    return this.currentContext!;
  }

  /**
   * Detect and handle page changes
   */
  private async detectPageChange(): Promise<void> {
    const newContext = await this.buildPageContext();
    
    // Check if context has changed
    if (!this.currentContext || this.hasContextChanged(this.currentContext, newContext)) {
      console.log('📄 Page context change detected:', {
        from: this.currentContext?.pageType,
        to: newContext.pageType,
        url: newContext.url
      });

      this.currentContext = newContext;
      this.notifyObservers(newContext);
    }
  }

  /**
   * Build current page context
   */
  private async buildPageContext(): Promise<PageContext> {
    const url = window.location.href;
    const pageType = await this.detectPageType();
    const itemId = this.extractItemId(url, pageType);

    return {
      url,
      pageType,
      itemId,
      timestamp: Date.now()
    };
  }

  /**
   * Detect current page type
   */
  private async detectPageType(): Promise<PageContext['pageType']> {
    const detectedType = await squareEnvironment.detectCurrentPage();
    
    switch (detectedType) {
      case 'dashboard':
        return 'dashboard';
      case 'items-library':
        return 'items-library';
      case 'item-detail':
        return 'item-detail';
      case 'item-edit':
        return 'item-edit';
      case 'inventory':
        return 'inventory';
      case 'seo-settings':
        return 'seo-settings';
      default:
        return 'unknown';
    }
  }

  /**
   * Extract item ID from URL if applicable
   */
  private extractItemId(url: string, pageType: PageContext['pageType']): string | undefined {
    if (pageType === 'item-detail' || pageType === 'item-edit') {
      const match = url.match(/\/items\/([^\/]+)/);
      return match ? match[1] : undefined;
    }
    return undefined;
  }

  /**
   * Check if context has changed
   */
  private hasContextChanged(oldContext: PageContext, newContext: PageContext): boolean {
    return oldContext.url !== newContext.url ||
           oldContext.pageType !== newContext.pageType ||
           oldContext.itemId !== newContext.itemId;
  }

  /**
   * Notify all observers of context change
   */
  private notifyObservers(context: PageContext): void {
    this.observers.forEach(observer => {
      try {
        observer(context);
      } catch (error) {
        console.error('Error in page change observer:', error);
      }
    });
  }

  /**
   * Start URL monitoring for SPA changes
   */
  private startUrlMonitoring(): void {
    let lastUrl = window.location.href;

    this.urlCheckInterval = window.setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.detectPageChange();
      }
    }, 500);
  }

  /**
   * Start DOM monitoring for dynamic content
   */
  private startDomMonitoring(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      // Look for significant DOM changes that might indicate page change
      const significantChange = mutations.some(mutation => {
        // Check if main content areas changed
        if (mutation.target instanceof Element) {
          const element = mutation.target;
          return element.matches('main, [role="main"], .main-content, #content') ||
                 element.querySelector('main, [role="main"], .main-content, #content') !== null;
        }
        return false;
      });

      if (significantChange) {
        // Debounce detection
        setTimeout(() => this.detectPageChange(), 1000);
      }
    });

    // Observe body for changes
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  /**
   * Intercept History API changes
   */
  private interceptHistoryChanges(): void {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.detectPageChange(), 100);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.detectPageChange(), 100);
    };

    window.addEventListener('popstate', () => {
      setTimeout(() => this.detectPageChange(), 100);
    });
  }
}

// Export singleton instance
export const pageDetectionService = new PageDetectionService();
