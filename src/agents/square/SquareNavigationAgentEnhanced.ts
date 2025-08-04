import { DOMAgent } from '../base/DOMAgent';
import { AgentContext, AgentTask, AgentResult } from '../types';
import { SquareDOMUtils, InteractionResult } from '@/square/domUtils';
import { selectors, SquareSelectors } from '@/square/selectors';
import { squareEnvironment } from '@/config/squareEnvironment';

interface NavigationOptions {
  waitForLoad?: boolean;
  timeout?: number;
  retries?: number;
  validatePage?: boolean;
}

interface SearchOptions extends NavigationOptions {
  searchTerm: string;
  searchType?: 'items' | 'customers' | 'orders' | 'global';
  maxResults?: number;
}

interface NavigationResult extends AgentResult {
  data?: {
    url?: string;
    pageType?: string;
    itemId?: string;
    searchResults?: any[];
    navigationTime?: number;
    screenshot?: string;
  };
}

/**
 * Enhanced Square Navigation Agent with real DOM automation
 * Handles sophisticated navigation, search, and page management for Square Dashboard
 */
export class SquareNavigationAgentEnhanced extends DOMAgent {
  private readonly SQUARE_BASE_URL: string;
  private readonly waitTimes;

  constructor(context: AgentContext) {
    super(context, {
      name: 'Enhanced Square Navigation Agent',
      instructions: `You are an expert Square Dashboard navigation agent with advanced DOM automation.
      
      Your capabilities include:
      - Precise navigation to any Square page or item
      - Advanced search functionality with filters
      - Page load validation and error handling
      - URL management and routing detection
      - Navigation state management and recovery
      - Real-time page context detection
      
      Navigation patterns:
      - Dashboard: /dashboard
      - Items Library: /dashboard/items
      - Item Detail: /dashboard/items/{ITEM_ID}/edit
      - Catalog: /dashboard/items/library
      - Inventory: /dashboard/inventory
      - SEO Settings: /dashboard/online/seo
      
      Technical approach:
      - Use SquareDOMUtils for all interactions
      - Validate page loads with specific selectors
      - Handle SPA routing and dynamic content
      - Implement robust error recovery
      - Provide detailed navigation feedback`
    });

    const config = squareEnvironment.getConfig();
    this.SQUARE_BASE_URL = config.baseUrl;
    this.waitTimes = squareEnvironment.getWaitTimes();
  }

  protected buildTools() {
    return [];
  }

  /**
   * Navigate to a specific URL with enhanced validation
   */
  private async navigateToUrl(url: string, options: NavigationOptions = {}): Promise<NavigationResult> {
    const startTime = Date.now();
    const { waitForLoad = true, timeout = this.waitTimes.long, retries = 2, validatePage = true } = options;

    try {
      console.log(`🔗 Navigating to: ${url}`);

      // Check if we're already on the target page
      if (window.location.href === url) {
        console.log('✅ Already on target page');
        return {
          success: true,
          message: 'Already on target page',
          data: { 
            url,
            navigationTime: 0
          }
        };
      }

      // Perform navigation
      window.location.href = url;

      if (waitForLoad) {
        // Wait for page load
        const pageLoaded = await SquareDOMUtils.waitForPageLoad(timeout);
        if (!pageLoaded) {
          return {
            success: false,
            error: `Page load timeout after ${timeout}ms`
          };
        }

        // Additional wait for Square-specific elements
        await this.waitForSquarePageReady(timeout);
      }

      // Validate page if requested
      if (validatePage) {
        const validationResult = await this.validateCurrentPage();
        if (!validationResult.valid) {
          console.warn('⚠️ Page validation issues:', validationResult.issues);
        }
      }

      const navigationTime = Date.now() - startTime;

      return {
        success: true,
        message: `Successfully navigated to ${url}`,
        data: {
          url,
          pageType: await this.detectCurrentPageType(),
          navigationTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Navigation failed: ${error instanceof Error ? error.message : String(error)}`,
        data: {
          navigationTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Navigate to a specific Square item
   */
  async navigateToItem(itemId: string, options: NavigationOptions = {}): Promise<NavigationResult> {
    const startTime = Date.now();

    try {
      console.log(`📦 Navigating to Square item: ${itemId}`);

      // Construct item URL
      const itemUrl = `${this.SQUARE_BASE_URL}/dashboard/items/${itemId}/edit`;

      // Check if already on the correct item page
      if (window.location.href.includes(`/items/${itemId}`)) {
        console.log('✅ Already on item page');
        return {
          success: true,
          message: 'Already on item page',
          data: {
            url: window.location.href,
            itemId,
            pageType: 'item-detail',
            navigationTime: Date.now() - startTime
          }
        };
      }

      // Navigate to item
      const navResult = await this.navigateToUrl(itemUrl, options);

      if (!navResult.success) {
        return navResult;
      }

      // Validate we're on the correct item page
      const pageValidation = await this.validateItemPage(itemId);
      if (!pageValidation.valid) {
        return {
          success: false,
          error: `Failed to load item page: ${pageValidation.issues.join(', ')}`,
          data: {
            itemId,
            navigationTime: Date.now() - startTime
          }
        };
      }

      return {
        success: true,
        message: `Successfully navigated to item ${itemId}`,
        data: {
          url: window.location.href,
          itemId,
          pageType: 'item-detail',
          navigationTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Item navigation failed: ${error instanceof Error ? error.message : String(error)}`,
        data: {
          itemId,
          navigationTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Navigate to the items catalog/library
   */
  async navigateToCatalog(options: NavigationOptions = {}): Promise<NavigationResult> {
    const catalogUrl = `${this.SQUARE_BASE_URL}/dashboard/items`;
    const result = await this.navigateToUrl(catalogUrl, options);

    if (result.success) {
      result.data = {
        ...result.data,
        pageType: 'items-library'
      };
    }

    return result;
  }

  /**
   * Navigate to Square dashboard home
   */
  async navigateToDashboard(options: NavigationOptions = {}): Promise<NavigationResult> {
    const dashboardUrl = `${this.SQUARE_BASE_URL}/dashboard`;
    const result = await this.navigateToUrl(dashboardUrl, options);

    if (result.success) {
      result.data = {
        ...result.data,
        pageType: 'dashboard'
      };
    }

    return result;
  }

  /**
   * Perform search with enhanced capabilities
   */
  async performSearch(options: SearchOptions): Promise<NavigationResult> {
    const startTime = Date.now();
    const { searchTerm, searchType = 'items', maxResults = 10 } = options;

    try {
      console.log(`🔍 Performing ${searchType} search for: "${searchTerm}"`);

      // Navigate to appropriate page if not already there
      if (searchType === 'items' && !window.location.href.includes('/items')) {
        await this.navigateToCatalog({ waitForLoad: true });
      }

      // Find search input
      const searchResult = await SquareDOMUtils.findElement(
        selectors.catalog.searchInput,
        { timeout: this.waitTimes.medium }
      );

      if (!searchResult.success || !searchResult.element) {
        return {
          success: false,
          error: 'Search input not found',
          data: { searchTerm }
        };
      }

      // Clear and type search term
      const typeResult = await SquareDOMUtils.safeType(
        selectors.catalog.searchInput,
        searchTerm,
        { clear: true, timeout: this.waitTimes.medium }
      );

      if (!typeResult.success) {
        return {
          success: false,
          error: `Failed to enter search term: ${typeResult.error}`,
          data: { searchTerm }
        };
      }

      // Trigger search (press Enter)
      const searchInput = searchResult.element as HTMLInputElement;
      searchInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true
      }));

      // Wait for search results to load
      await SquareDOMUtils.delay(this.waitTimes.networkRequest);

      // Extract search results
      const results = await this.extractSearchResults(maxResults);

      return {
        success: true,
        message: `Search completed. Found ${results.length} results`,
        data: {
          searchTerm,
          searchType,
          searchResults: results,
          navigationTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
        data: {
          searchTerm,
          navigationTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Navigate using Square's built-in navigation elements
   */
  async navigateUsingMenu(menuItem: 'dashboard' | 'items' | 'inventory' | 'online'): Promise<NavigationResult> {
    const startTime = Date.now();

    try {
      console.log(`🧭 Navigating using menu: ${menuItem}`);

      // Map menu items to selectors
      const menuSelectors = {
        dashboard: selectors.navigation.dashboardMenuItem,
        items: selectors.navigation.itemsMenuItem,
        inventory: selectors.navigation.inventoryMenuItem,
        online: selectors.navigation.onlineMenuItem
      };

      const menuSelector = menuSelectors[menuItem];
      if (!menuSelector) {
        return {
          success: false,
          error: `Unknown menu item: ${menuItem}`
        };
      }

      // Click the menu item
      const clickResult = await SquareDOMUtils.safeClick(
        menuSelector,
        { timeout: this.waitTimes.medium }
      );

      if (!clickResult.success) {
        return {
          success: false,
          error: `Failed to click menu item: ${clickResult.error}`,
          data: { menuItem }
        };
      }

      // Wait for navigation to complete
      await SquareDOMUtils.delay(this.waitTimes.networkRequest);
      await this.waitForSquarePageReady();

      return {
        success: true,
        message: `Successfully navigated to ${menuItem}`,
        data: {
          menuItem,
          url: window.location.href,
          pageType: await this.detectCurrentPageType(),
          navigationTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Menu navigation failed: ${error instanceof Error ? error.message : String(error)}`,
        data: {
          menuItem,
          navigationTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Wait for Square page to be ready for interaction
   */
  private async waitForSquarePageReady(timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();

    // Wait for basic Square elements to be present
    const basicElements = [
      selectors.navigation.mainMenu,
      selectors.common.loadingSpinner  // Should disappear when ready
    ];

    // Wait for navigation to be present
    const navResult = await SquareDOMUtils.findElement(
      selectors.navigation.mainMenu,
      { timeout: timeout / 2 }
    );

    if (!navResult.success) {
      console.warn('⚠️ Main navigation not found - page may not be fully loaded');
    }

    // Wait for any loading spinners to disappear
    const loadingSpinner = await SquareDOMUtils.findElement(
      selectors.common.loadingSpinner,
      { timeout: 2000 }
    );

    if (loadingSpinner.success) {
      // Wait for spinner to disappear
      let spinnerGone = false;
      const maxWait = Date.now() + timeout;

      while (!spinnerGone && Date.now() < maxWait) {
        await SquareDOMUtils.delay(500);
        const stillLoading = await SquareDOMUtils.findElement(
          selectors.common.loadingSpinner,
          { timeout: 100 }
        );
        spinnerGone = !stillLoading.success;
      }
    }

    return Date.now() - startTime < timeout;
  }

  /**
   * Validate current page context
   */
  private async validateCurrentPage(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check authentication
      const isAuthenticated = await squareEnvironment.checkAuthentication();
      if (!isAuthenticated) {
        issues.push('User not authenticated');
      }

      // Check for Square page
      if (!window.location.hostname.includes('squareup.com')) {
        issues.push('Not on a Square page');
      }

      // Check for basic navigation elements
      const navResult = await SquareDOMUtils.findElement(
        selectors.navigation.mainMenu,
        { timeout: 2000 }
      );

      if (!navResult.success) {
        issues.push('Main navigation not found');
      }

      return {
        valid: issues.length === 0,
        issues
      };

    } catch (error) {
      return {
        valid: false,
        issues: [`Validation error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Validate item page specifically
   */
  private async validateItemPage(itemId: string): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check URL contains item ID
      if (!window.location.href.includes(itemId)) {
        issues.push('URL does not contain expected item ID');
      }

      // Check for item detail elements
      const validation = await SquareSelectors.validatePage(selectors.itemDetail);
      if (!validation.valid) {
        issues.push(`Missing required item elements: ${validation.missing.join(', ')}`);
      }

      return {
        valid: issues.length === 0,
        issues
      };

    } catch (error) {
      return {
        valid: false,
        issues: [`Item page validation error: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Detect current page type
   */
  private async detectCurrentPageType(): Promise<string> {
    try {
      return await squareEnvironment.detectCurrentPage() || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Extract search results from the page
   */
  private async extractSearchResults(maxResults: number = 10): Promise<any[]> {
    const results: any[] = [];

    try {
      // Find item cards or list items
      const itemElements = document.querySelectorAll([
        SquareSelectors.getSelector(selectors.catalog.itemCard),
        '.search-result',
        '[data-testid*="search-result"]'
      ].join(', '));

      const limit = Math.min(itemElements.length, maxResults);

      for (let i = 0; i < limit; i++) {
        const item = itemElements[i] as HTMLElement;
        
        // Extract item information
        const nameElement = item.querySelector([
          SquareSelectors.getSelector(selectors.catalog.itemName),
          '.item-name',
          '.product-name'
        ].join(', '));

        const priceElement = item.querySelector([
          SquareSelectors.getSelector(selectors.catalog.itemPrice),
          '.price'
        ].join(', '));

        const result = {
          name: nameElement?.textContent?.trim() || 'Unknown',
          price: priceElement?.textContent?.trim() || 'N/A',
          element: item
        };

        results.push(result);
      }

    } catch (error) {
      console.warn('Failed to extract search results:', error);
    }

    return results;
  }

  /**
   * Execute navigation task
   */
  protected async executeTaskInternal(task: AgentTask): Promise<AgentResult> {
    switch (task.type) {
      case 'navigate':
        return await this.handleNavigationTask(task.data);
      
      default:
        return {
          success: false,
          error: `Unknown task type: ${task.type}`
        };
    }
  }

  /**
   * Handle navigation task with various options
   */
  private async handleNavigationTask(data: {
    type: 'url' | 'item' | 'catalog' | 'dashboard' | 'search' | 'menu';
    url?: string;
    itemId?: string;
    searchTerm?: string;
    menuItem?: string;
    options?: NavigationOptions | SearchOptions;
  }): Promise<NavigationResult> {
    
    const { type, options = {} } = data;

    switch (type) {
      case 'url':
        if (!data.url) {
          return { success: false, error: 'URL required for navigation' };
        }
        return await this.navigateToUrl(data.url, options);

      case 'item':
        if (!data.itemId) {
          return { success: false, error: 'Item ID required for item navigation' };
        }
        return await this.navigateToItem(data.itemId, options);

      case 'catalog':
        return await this.navigateToCatalog(options);

      case 'dashboard':
        return await this.navigateToDashboard(options);

      case 'search':
        if (!data.searchTerm) {
          return { success: false, error: 'Search term required for search' };
        }
        return await this.performSearch({
          searchTerm: data.searchTerm,
          ...(options as SearchOptions)
        });

      case 'menu':
        if (!data.menuItem || !['dashboard', 'items', 'inventory', 'online'].includes(data.menuItem)) {
          return { success: false, error: 'Valid menu item required' };
        }
        return await this.navigateUsingMenu(data.menuItem as any);

      default:
        return {
          success: false,
          error: `Unknown navigation type: ${type}`
        };
    }
  }
}
