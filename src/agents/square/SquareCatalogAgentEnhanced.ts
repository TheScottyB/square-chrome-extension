import { SquareDOMUtils } from '../../utils/SquareDOMUtils';
import { SquareSelectors } from '../../utils/SquareSelectors';
import { AgentTask, AgentResult, AgentContext } from '../types';
import { SquareEnvironmentManager } from '../../utils/SquareEnvironmentManager';

/**
 * Enhanced Square Catalog Agent for comprehensive catalog management
 * Provides real DOM automation for:
 * - Item catalog synchronization
 * - Inventory management and updates
 * - Bulk pricing operations
 * - Data validation and extraction
 */
export class SquareCatalogAgentEnhanced extends SquareDOMUtils {
  private context: AgentContext;
  private envManager: SquareEnvironmentManager;
  
  constructor(context: AgentContext) {
    super();
    this.context = context;
    this.envManager = new SquareEnvironmentManager();
  }

  /**
   * Synchronize catalog items with comprehensive validation and error handling
   */
  async synchronizeCatalog(data: {
    items?: Array<{ id: string; name: string; price?: number; quantity?: number; }>;
    locationId?: string;
    syncMode?: 'partial' | 'full';
  }): Promise<AgentResult> {
    try {
      this.log('🔄 Starting catalog synchronization...');
      
      // Navigate to catalog page
      const catalogUrl = this.envManager.getCatalogUrl();
      await this.navigateToPage(catalogUrl);
      
      // Wait for catalog page load
      await this.waitForElement(
        SquareSelectors.catalog.itemsLibrary.container,
        5000
      );
      
      const syncResults = [];
      
      if (data.items && data.items.length > 0) {
        // Process items in batches to avoid overwhelming the UI
        const batchSize = 5;
        for (let i = 0; i < data.items.length; i += batchSize) {
          const batch = data.items.slice(i, i + batchSize);
          const batchResults = await this.processCatalogBatch(batch);
          syncResults.push(...batchResults);
          
          // Brief pause between batches
          await this.wait(1000);
        }
      }
      
      return {
        success: true,
        message: `Catalog synchronization completed for ${syncResults.length} items`,
        data: {
          syncedItems: syncResults.length,
          syncTime: Date.now(),
          results: syncResults
        }
      };
    } catch (error) {
      this.logError('Catalog sync failed', error);
      await this.captureScreenshot('catalog-sync-error');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update inventory quantities with validation
   */
  async updateInventory(data: {
    quantities: Record<string, number>;
    trackInventory?: boolean;
    alertThreshold?: number;
  }): Promise<AgentResult> {
    try {
      this.log('📦 Starting inventory update...');
      
      const inventoryUrl = this.envManager.getInventoryUrl();
      await this.navigateToPage(inventoryUrl);
      
      // Wait for inventory page load
      await this.waitForElement(
        SquareSelectors.catalog.itemsLibrary.container,
        5000
      );
      
      const updateResults = [];
      
      for (const [itemId, quantity] of Object.entries(data.quantities)) {
        try {
          const result = await this.updateItemQuantity(itemId, quantity);
          updateResults.push(result);
        } catch (error) {
          this.logError(`Failed to update quantity for item ${itemId}`, error);
          updateResults.push({
            itemId,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      const successCount = updateResults.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        message: `Inventory updated for ${successCount}/${updateResults.length} items`,
        data: {
          updatedItems: successCount,
          totalItems: updateResults.length,
          updateTime: Date.now(),
          results: updateResults
        }
      };
    } catch (error) {
      this.logError('Inventory update failed', error);
      await this.captureScreenshot('inventory-update-error');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Bulk pricing operations with validation
   */
  async updatePricing(data: {
    prices: Record<string, number>;
    priceType?: 'fixed' | 'percentage';
    currency?: string;
  }): Promise<AgentResult> {
    try {
      this.log('💰 Starting bulk pricing update...');
      
      const catalogUrl = this.envManager.getCatalogUrl();
      await this.navigateToPage(catalogUrl);
      
      await this.waitForElement(
        SquareSelectors.catalog.itemsLibrary.container,
        5000
      );
      
      const pricingResults = [];
      
      for (const [itemId, price] of Object.entries(data.prices)) {
        try {
          const result = await this.updateItemPrice(itemId, price);
          pricingResults.push(result);
        } catch (error) {
          this.logError(`Failed to update price for item ${itemId}`, error);
          pricingResults.push({
            itemId,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      const successCount = pricingResults.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        message: `Pricing updated for ${successCount}/${pricingResults.length} items`,
        data: {
          updatedPrices: successCount,
          totalItems: pricingResults.length,
          updateTime: Date.now(),
          results: pricingResults
        }
      };
    } catch (error) {
      this.logError('Pricing update failed', error);
      await this.captureScreenshot('pricing-update-error');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extract catalog data with comprehensive information gathering
   */
  async extractCatalogData(options: {
    includeInventory?: boolean;
    includePricing?: boolean;
    itemLimit?: number;
  } = {}): Promise<AgentResult> {
    try {
      this.log('📊 Extracting catalog data...');
      
      const catalogUrl = this.envManager.getCatalogUrl();
      await this.navigateToPage(catalogUrl);
      
      await this.waitForElement(
        SquareSelectors.catalog.itemsLibrary.container,
        5000
      );
      
      // Extract item data
      const items = await this.extractItemsData(options);
      
      // Validate extracted data
      const validationResults = this.validateCatalogData(items);
      
      return {
        success: true,
        message: `Extracted data for ${items.length} catalog items`,
        data: {
          items,
          itemCount: items.length,
          extractionTime: Date.now(),
          validation: validationResults
        }
      };
    } catch (error) {
      this.logError('Data extraction failed', error);
      await this.captureScreenshot('catalog-extraction-error');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Process a batch of catalog items
   */
  private async processCatalogBatch(items: Array<{ id: string; name: string; price?: number; quantity?: number; }>): Promise<any[]> {
    const results = [];
    
    for (const item of items) {
      try {
        // Search for the item
        await this.searchForItem(item.name);
        
        // Update item if found
        const updated = await this.updateCatalogItem(item);
        results.push({
          itemId: item.id,
          name: item.name,
          success: true,
          updated
        });
      } catch (error) {
        results.push({
          itemId: item.id,
          name: item.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return results;
  }

  /**
   * Search for a specific item in the catalog
   */
  private async searchForItem(itemName: string): Promise<void> {
    const searchInput = await this.waitForElement(
      SquareSelectors.catalog.search.input,
      3000
    );
    
    if (searchInput) {
      await this.clearAndType(searchInput, itemName);
      await this.wait(1000); // Wait for search results
    }
  }

  /**
   * Update a specific catalog item
   */
  private async updateCatalogItem(item: { id: string; name: string; price?: number; quantity?: number; }): Promise<boolean> {
    // Click on the first search result
    const firstResult = await this.waitForElement(
      SquareSelectors.catalog.itemsLibrary.item,
      3000
    );
    
    if (!firstResult) {
      throw new Error(`Item not found: ${item.name}`);
    }
    
    await this.safeClick(firstResult);
    
    // Wait for item edit page
    await this.waitForElement(
      SquareSelectors.itemEdit.general.nameInput,
      5000
    );
    
    let updated = false;
    
    // Update price if provided
    if (item.price !== undefined) {
      await this.updateItemPriceField(item.price);
      updated = true;
    }
    
    // Update quantity if provided
    if (item.quantity !== undefined) {
      await this.updateItemQuantityField(item.quantity);
      updated = true;
    }
    
    // Save changes if any updates were made
    if (updated) {
      await this.saveItem();
    }
    
    return updated;
  }

  /**
   * Update item quantity
   */
  private async updateItemQuantity(itemId: string, quantity: number): Promise<{ itemId: string; success: boolean; error?: string }> {
    try {
      // Implementation for updating specific item quantity
      await this.searchForItem(itemId);
      
      const item = await this.waitForElement(
        SquareSelectors.catalog.itemsLibrary.item,
        3000
      );
      
      if (!item) {
        throw new Error(`Item not found: ${itemId}`);
      }
      
      await this.safeClick(item);
      await this.updateItemQuantityField(quantity);
      await this.saveItem();
      
      return { itemId, success: true };
    } catch (error) {
      return {
        itemId,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update item price
   */
  private async updateItemPrice(itemId: string, price: number): Promise<{ itemId: string; success: boolean; error?: string }> {
    try {
      await this.searchForItem(itemId);
      
      const item = await this.waitForElement(
        SquareSelectors.catalog.itemsLibrary.item,
        3000
      );
      
      if (!item) {
        throw new Error(`Item not found: ${itemId}`);
      }
      
      await this.safeClick(item);
      await this.updateItemPriceField(price);
      await this.saveItem();
      
      return { itemId, success: true };
    } catch (error) {
      return {
        itemId,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update the price field in item edit form
   */
  private async updateItemPriceField(price: number): Promise<void> {
    const priceInput = await this.waitForElement(
      SquareSelectors.itemEdit.pricing.priceInput,
      3000
    );
    
    if (priceInput) {
      await this.clearAndType(priceInput, price.toString());
    }
  }

  /**
   * Update the quantity field in item edit form
   */
  private async updateItemQuantityField(quantity: number): Promise<void> {
    const quantityInput = await this.waitForElement(
      SquareSelectors.itemEdit.inventory.quantityInput,
      3000
    );
    
    if (quantityInput) {
      await this.clearAndType(quantityInput, quantity.toString());
    }
  }

  /**
   * Save item changes
   */
  private async saveItem(): Promise<void> {
    const saveButton = await this.waitForElement(
      SquareSelectors.itemEdit.actions.saveButton,
      3000
    );
    
    if (saveButton) {
      await this.safeClick(saveButton);
      
      // Wait for save confirmation
      await this.wait(2000);
    }
  }

  /**
   * Extract comprehensive item data from catalog
   */
  private async extractItemsData(options: {
    includeInventory?: boolean;
    includePricing?: boolean;
    itemLimit?: number;
  }): Promise<any[]> {
    const items = [];
    const itemElements = await this.getAllElements(
      SquareSelectors.catalog.itemsLibrary.item
    );
    
    const limit = options.itemLimit || itemElements.length;
    const elementsToProcess = itemElements.slice(0, limit);
    
    for (const itemElement of elementsToProcess) {
      try {
        const itemData = await this.extractSingleItemData(itemElement, options);
        items.push(itemData);
      } catch (error) {
        this.logError('Failed to extract item data', error);
      }
    }
    
    return items;
  }

  /**
   * Extract data from a single item element
   */
  private async extractSingleItemData(itemElement: Element, options: any): Promise<any> {
    // Click on item to open details
    await this.safeClick(itemElement);
    
    // Wait for item details to load
    await this.waitForElement(
      SquareSelectors.itemEdit.general.nameInput,
      3000
    );
    
    // Extract basic data
    const itemData: any = {
      name: await this.getElementValue(SquareSelectors.itemEdit.general.nameInput),
      id: await this.generateItemId(),
      extractedAt: Date.now()
    };
    
    // Extract pricing data if requested
    if (options.includePricing) {
      const priceElement = await this.getElement(
        SquareSelectors.itemEdit.pricing.priceInput
      );
      if (priceElement) {
        itemData.price = await this.getElementValue(priceElement);
      }
    }
    
    // Extract inventory data if requested
    if (options.includeInventory) {
      const quantityElement = await this.getElement(
        SquareSelectors.itemEdit.inventory.quantityInput
      );
      if (quantityElement) {
        itemData.quantity = await this.getElementValue(quantityElement);
      }
    }
    
    // Go back to catalog list
    await this.navigateBack();
    
    return itemData;
  }

  /**
   * Navigate back to catalog list
   */
  private async navigateBack(): Promise<void> {
    const backButton = await this.getElement(
      SquareSelectors.itemEdit.actions.backButton
    );
    
    if (backButton) {
      await this.safeClick(backButton);
    } else {
      // Fallback: navigate to catalog URL
      const catalogUrl = this.envManager.getCatalogUrl();
      await this.navigateToPage(catalogUrl);
    }
    
    // Wait for catalog page to load
    await this.waitForElement(
      SquareSelectors.catalog.itemsLibrary.container,
      3000
    );
  }

  /**
   * Generate a unique item ID for extracted data
   */
  private async generateItemId(): Promise<string> {
    // Try to extract ID from URL or DOM
    const url = window.location.href;
    const idMatch = url.match(/\/item\/([^\/?]+)/);
    return idMatch ? idMatch[1] : `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate extracted catalog data
   */
  private validateCatalogData(items: any[]): any {
    const validation = {
      totalItems: items.length,
      validItems: 0,
      invalidItems: 0,
      missingFields: [] as string[],
      warnings: [] as string[]
    };
    
    for (const item of items) {
      let isValid = true;
      
      // Check required fields
      if (!item.name || item.name.trim() === '') {
        validation.missingFields.push(`${item.id}: name`);
        isValid = false;
      }
      
      if (item.price !== undefined && (isNaN(parseFloat(item.price)) || parseFloat(item.price) < 0)) {
        validation.warnings.push(`${item.id}: invalid price value`);
      }
      
      if (item.quantity !== undefined && (isNaN(parseInt(item.quantity)) || parseInt(item.quantity) < 0)) {
        validation.warnings.push(`${item.id}: invalid quantity value`);
      }
      
      if (isValid) {
        validation.validItems++;
      } else {
        validation.invalidItems++;
      }
    }
    
    return validation;
  }

  /**
   * Navigate to a specific page with validation
   */
  private async navigateToPage(url: string): Promise<void> {
    if (window.location.href !== url) {
      window.location.href = url;
      await this.wait(2000); // Wait for navigation
    }
  }

  private log(message: string): void {
    console.log(`[SquareCatalogAgent] ${message}`);
  }

  private logError(message: string, error: any): void {
    console.error(`[SquareCatalogAgent] ${message}:`, error);
  }
}

