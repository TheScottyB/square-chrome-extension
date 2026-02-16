import { PageContext } from '@/agents/types';
import { squareEnvironment } from '@/config/squareEnvironment';

/**
 * Advanced page detection service for Chrome extension
 * Analyzes URL patterns, DOM content, and page metadata to determine page type
 */
export class PageDetectionService {
  private static instance: PageDetectionService;
  private observers: MutationObserver[] = [];
  private pageChangeCallbacks: ((context: PageContext) => void)[] = [];
  private lastDetectedContext: PageContext | null = null;

  private constructor() {}

  public static getInstance(): PageDetectionService {
    if (!PageDetectionService.instance) {
      PageDetectionService.instance = new PageDetectionService();
    }
    return PageDetectionService.instance;
  }

  /**
   * Detect current page context with enhanced analysis
   */
  public async detectPageContext(): Promise<PageContext> {
    const url = window.location.href;
    const title = document.title;
    const readyState = document.readyState;
    
    let pageType: PageContext['pageType'] = 'unknown';
    let itemId: string | undefined;

    // URL-based detection
    const urlContext = await this.analyzeUrl(url);
    
    // DOM-based detection for additional validation
    const domContext = await this.analyzeDOMContent();
    
    // Combine analysis results
    itemId = urlContext.itemId || domContext.itemId;
    
    // Combine URL and DOM analysis
    pageType = (urlContext.pageType && urlContext.pageType !== 'unknown') 
      ? urlContext.pageType 
      : (domContext.pageType || 'unknown');

    const context: PageContext = {
      url,
      pageType,
      itemId,
      title,
      readyState
    };

    // Cache the result
    this.lastDetectedContext = context;
    
    console.log('🔍 Page context detected:', context);
    return context;
  }

  /**
   * Analyze URL patterns to determine page type using environment configuration
   */
  private async analyzeUrl(url: string): Promise<Partial<PageContext>> {
    // Use environment manager to detect page type
    const pageName = await squareEnvironment.detectCurrentPage(url);
    
    if (pageName) {
      const pageConfig = squareEnvironment.getPageConfig(pageName);
      if (pageConfig) {
        // Map page config names to PageContext types
        const pageTypeMapping: Record<string, PageContext['pageType']> = {
          'dashboard': 'dashboard',
          'catalog': 'items-library',
          'item-edit': 'item-detail',
          'seo': 'dashboard', // SEO is part of dashboard functionality
          'login': 'unknown',
          'spocket': 'spocket'
        };
        
        const pageType = pageTypeMapping[pageName] || 'unknown';
        
        // Extract item ID if this is an item-related page
        let itemId: string | undefined;
        if (pageName === 'item-edit') {
          const itemMatch = url.match(/\/items\/[^/]*\/([A-Z0-9_-]+)/i);
          itemId = itemMatch ? itemMatch[1] : undefined;
        }
        
        return { pageType, itemId };
      }
    }

    // Fallback to legacy pattern matching
    const hostname = new URL(url).hostname;
    const pathname = new URL(url).pathname;

    // Square Dashboard patterns (legacy fallback)
    if (hostname.includes('squareup.com') || hostname.includes('connect.squareupsandbox.com')) {
      // Item detail/edit pages
      const itemMatch = pathname.match(/\/items\/(?:library\/)?([A-Z0-9_-]+)(?:\/edit)?/i);
      if (itemMatch) {
        return {
          pageType: 'item-detail',
          itemId: itemMatch[1]
        };
      }

      // Items library/catalog
      if (pathname.includes('/items') || pathname.includes('/catalog')) {
        return { pageType: 'items-library' };
      }

      // Inventory management
      if (pathname.includes('/inventory')) {
        return { pageType: 'inventory' };
      }

      // Dashboard home
      if (pathname.includes('/dashboard')) {
        return { pageType: 'dashboard' };
      }

      // SEO/marketing pages
      if (pathname.includes('/seo') || pathname.includes('/marketing') || pathname.includes('/online')) {
        return { pageType: 'dashboard' };
      }
    }

    // Spocket patterns
    if (hostname.includes('spocket.co')) {
      const productMatch = pathname.match(/\/products?\/([^\/]+)/);
      return {
        pageType: 'spocket',
        itemId: productMatch ? productMatch[1] : undefined
      };
    }

    return { pageType: 'unknown' };
  }

  /**
   * Analyze DOM content to determine page type
   */
  private async analyzeDOMContent(): Promise<Partial<PageContext>> {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // Square-specific DOM patterns
    if (this.isSquarePage()) {
      // Check for item detail indicators
      const itemDetailIndicators = [
        '[data-test-id="item-details"]',
        '[data-testid="item-details"]',
        '.item-detail-container',
        '.item-details-page',
        '[data-test-id="item-name-input"]',
        '[data-testid="item-name-input"]'
      ];

      for (const selector of itemDetailIndicators) {
        if (document.querySelector(selector)) {
          // Try to extract item ID from various sources
          const itemId = this.extractItemIdFromDOM();
          return {
            pageType: 'item-detail',
            itemId
          };
        }
      }

      // Check for items library indicators
      const libraryIndicators = [
        '.items-grid',
        '.catalog-items',
        '[data-test-id="items-library"]',
        '[data-testid="items-library"]',
        '.item-cards-container'
      ];

      for (const selector of libraryIndicators) {
        if (document.querySelector(selector)) {
          return { pageType: 'items-library' };
        }
      }

      // Check for dashboard indicators
      const dashboardIndicators = [
        '.dashboard-content',
        '[data-test-id="dashboard"]',
        '[data-testid="dashboard"]',
        '.dashboard-overview'
      ];

      for (const selector of dashboardIndicators) {
        if (document.querySelector(selector)) {
          return { pageType: 'dashboard' };
        }
      }
    }

    // Spocket-specific DOM patterns
    if (this.isSpocketPage()) {
      const productIndicators = [
        '.product-details',
        '.product-info',
        '[data-test-id="product-title"]',
        '.product-title',
        '.product-price'
      ];

      for (const selector of productIndicators) {
        if (document.querySelector(selector)) {
          return { pageType: 'spocket' };
        }
      }
    }

    return { pageType: 'unknown' };
  }

  /**
   * Check if current page is a Square page
   */
  private isSquarePage(): boolean {
    return window.location.hostname.includes('squareup.com') ||
           document.title.toLowerCase().includes('square') ||
           !!document.querySelector('[data-app-name="square"]');
  }

  /**
   * Check if current page is a Spocket page
   */
  private isSpocketPage(): boolean {
    return window.location.hostname.includes('spocket.co') ||
           document.title.toLowerCase().includes('spocket') ||
           !!document.querySelector('[data-app-name="spocket"]');
  }

  /**
   * Extract item ID from DOM elements
   */
  private extractItemIdFromDOM(): string | undefined {
    // Try various methods to extract item ID
    const methods = [
      // From data attributes
      () => document.querySelector('[data-item-id]')?.getAttribute('data-item-id'),
      // From URL in the page
      () => {
        const links = document.querySelectorAll('a[href*="/items/library/"]');
        for (const link of links) {
          const match = link.getAttribute('href')?.match(/\/items\/library\/([A-Z0-9_-]+)/i);
          if (match) return match[1];
        }
        return undefined;
      },
      // From form inputs
      () => document.querySelector('input[name="item_id"]')?.getAttribute('value'),
      // From meta tags
      () => document.querySelector('meta[name="square:item-id"]')?.getAttribute('content')
    ];

    for (const method of methods) {
      try {
        const result = method();
        if (result) return result;
      } catch (error) {
        console.warn('Error extracting item ID:', error);
      }
    }

    return undefined;
  }

  /**
   * Start monitoring for page changes
   */
  public startPageMonitoring(): void {
    console.log('🔍 Starting page monitoring...');

    // Monitor URL changes (for SPAs)
    let currentUrl = window.location.href;
    const urlObserver = new MutationObserver(async () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('🔄 URL change detected:', currentUrl);
        await this.handlePageChange();
      }
    });

    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.push(urlObserver);

    // Monitor DOM changes that might indicate page type changes
    const contentObserver = new MutationObserver(async (mutations) => {
      const significantChanges = mutations.some(mutation => 
        mutation.type === 'childList' && 
        mutation.addedNodes.length > 0 &&
        Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).matches('.page-content, .main-content, [role="main"]')
        )
      );

      if (significantChanges) {
        console.log('🔄 Significant DOM changes detected');
        await this.handlePageChange();
      }
    });

    contentObserver.observe(document, {
      childList: true,
      subtree: true
    });

    this.observers.push(contentObserver);

    // Listen for browser navigation events
    window.addEventListener('popstate', this.handlePageChange.bind(this));
    window.addEventListener('pushstate', this.handlePageChange.bind(this));
    window.addEventListener('replacestate', this.handlePageChange.bind(this));
  }

  /**
   * Handle page changes
   */
  private async handlePageChange(): Promise<void> {
    try {
      // Debounce rapid changes
      await new Promise(resolve => setTimeout(resolve, 500));

      const newContext = await this.detectPageContext();
      
      // Only notify if context actually changed
      if (!this.lastDetectedContext || 
          this.lastDetectedContext.pageType !== newContext.pageType ||
          this.lastDetectedContext.itemId !== newContext.itemId) {
        
        console.log('📄 Page context changed:', {
          from: this.lastDetectedContext,
          to: newContext
        });

        // Notify all callbacks
        this.pageChangeCallbacks.forEach(callback => {
          try {
            callback(newContext);
          } catch (error) {
            console.error('Error in page change callback:', error);
          }
        });

        this.lastDetectedContext = newContext;
      }
    } catch (error) {
      console.error('Error handling page change:', error);
    }
  }

  /**
   * Register callback for page changes
   */
  public onPageChange(callback: (context: PageContext) => void): void {
    this.pageChangeCallbacks.push(callback);
  }

  /**
   * Get the last detected page context
   */
  public getLastDetectedContext(): PageContext | null {
    return this.lastDetectedContext;
  }

  /**
   * Stop monitoring and cleanup
   */
  public stopMonitoring(): void {
    console.log('🛑 Stopping page monitoring...');
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    window.removeEventListener('popstate', this.handlePageChange.bind(this));
    window.removeEventListener('pushstate', this.handlePageChange.bind(this));
    window.removeEventListener('replacestate', this.handlePageChange.bind(this));
    
    this.pageChangeCallbacks = [];
    this.lastDetectedContext = null;
  }

  /**
   * Manual page context refresh
   */
  public async refreshContext(): Promise<PageContext> {
    const context = await this.detectPageContext();
    this.lastDetectedContext = context;
    return context;
  }
}

// Export singleton instance
export const pageDetectionService = PageDetectionService.getInstance();
