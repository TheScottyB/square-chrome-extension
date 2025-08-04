/**
 * Square Dashboard Selectors for DOM automation
 * Comprehensive selector definitions for all Square UI elements
 */

export const selectors = {
  // Navigation
  navigation: {
    mainMenu: '[data-testid="main-navigation"], .main-navigation',
    dashboardMenuItem: '[data-testid="dashboard-link"], a[href*="/dashboard"]',
    itemsMenuItem: '[data-testid="items-link"], a[href*="/items"]',
    inventoryMenuItem: '[data-testid="inventory-link"], a[href*="/inventory"]',
    onlineMenuItem: '[data-testid="online-link"], a[href*="/online"]'
  },

  // Common UI elements
  common: {
    loadingSpinner: '.loading-spinner, [data-testid="loading-indicator"], .spinner',
    successMessage: '.success-message, [data-testid="success-message"], .alert-success',
    errorMessage: '.error-message, [data-testid="error-message"], .alert-error',
    modal: '.modal, [role="dialog"]',
    modalClose: '.modal-close, [data-testid="modal-close"], button[aria-label="Close"]'
  },

  // Catalog/Items Library
  catalog: {
    searchInput: '#search-input, [data-testid="catalog-search"], input[placeholder*="Search"]',
    itemCard: '.item-card, [data-testid="item-card"], .catalog-item',
    itemName: '.item-name, [data-testid="item-name"]',
    itemPrice: '.item-price, [data-testid="item-price"]',
    itemsLibrary: {
      container: '.items-library, [data-testid="items-library"], .catalog-container',
      item: '.catalog-item, [data-testid="catalog-item"], .item-row',
      editButton: '.edit-item, [data-testid="edit-item"], button[aria-label*="Edit"]',
      deleteButton: '.delete-item, [data-testid="delete-item"], button[aria-label*="Delete"]'
    },
    search: {
      input: '#catalog-search, [data-testid="catalog-search-input"], input[name="search"]',
      submitButton: '.search-submit, [data-testid="search-submit"], button[type="submit"]',
      clearButton: '.search-clear, [data-testid="search-clear"], button[aria-label*="Clear"]'
    }
  },

  // Item Detail/Edit
  itemDetail: {
    // Basic Info
    itemNameInput: '#item-name, [data-testid="item-name-input"], input[name="name"]',
    itemDescriptionTextarea: '#item-description, [data-testid="item-description"], textarea[name="description"]',
    
    // SEO fields
    seoTitleInput: '#seo-title, [data-testid="seo-title"], input[name="seo_title"]',
    seoDescriptionTextarea: '#seo-description, [data-testid="seo-description"], textarea[name="seo_description"]',
    seoUrlInput: '#seo-url, [data-testid="seo-url"], input[name="url_slug"]',
    
    // Pricing
    priceInput: '#item-price, [data-testid="item-price"], input[name="price"]',
    
    // Actions
    saveButton: '#save-item, [data-testid="save-item"], button[type="submit"]',
    cancelButton: '#cancel-edit, [data-testid="cancel-edit"], button[aria-label*="Cancel"]'
  },

  // Item Edit specific selectors
  itemEdit: {
    general: {
      nameInput: '#item-name-edit, [data-testid="item-name-edit"], input[name="item_name"]',
      descriptionInput: '#item-description-edit, [data-testid="item-description-edit"], textarea[name="item_description"]',
      categorySelect: '#item-category, [data-testid="item-category"], select[name="category"]'
    },
    pricing: {
      priceInput: '#item-price-edit, [data-testid="item-price-edit"], input[name="item_price"]',
      taxCheckbox: '#item-taxable, [data-testid="item-taxable"], input[name="taxable"]',
      costInput: '#item-cost, [data-testid="item-cost"], input[name="cost"]'
    },
    inventory: {
      quantityInput: '#item-quantity, [data-testid="item-quantity"], input[name="quantity"]',
      skuInput: '#item-sku, [data-testid="item-sku"], input[name="sku"]',
      trackInventoryCheckbox: '#track-inventory, [data-testid="track-inventory"], input[name="track_inventory"]'
    },
    actions: {
      saveButton: '#save-item-button, [data-testid="save-item-button"], button[type="submit"]',
      cancelButton: '#cancel-item-button, [data-testid="cancel-item-button"], button[aria-label*="Cancel"]',
      deleteButton: '#delete-item-button, [data-testid="delete-item-button"], button[aria-label*="Delete"]',
      backButton: '.back-button, [data-testid="back-button"], button[aria-label*="Back"]'
    }
  },

  // SEO specific
  seo: {
    titleField: '#seo-page-title, [data-testid="seo-title-field"], input[name="page_title"]',
    descriptionField: '#seo-meta-description, [data-testid="seo-description-field"], textarea[name="meta_description"]',
    urlSlugField: '#seo-url-slug, [data-testid="seo-url-field"], input[name="url_slug"]',
    keywordsField: '#seo-keywords, [data-testid="seo-keywords-field"], input[name="keywords"]',
    saveButton: '#save-seo, [data-testid="save-seo"], button[aria-label*="Save SEO"]'
  },

  // Inventory
  inventory: {
    searchInput: '#inventory-search, [data-testid="inventory-search"], input[placeholder*="Search inventory"]',
    quantityInput: '.quantity-input, [data-testid="quantity-input"], input[name="quantity"]',
    updateButton: '.update-quantity, [data-testid="update-quantity"], button[aria-label*="Update"]',
    bulkUpdateButton: '#bulk-update, [data-testid="bulk-update"], button[aria-label*="Bulk"]'
  }
};

/**
 * Helper class for selector management
 */
export class SquareSelectors {
  /**
   * Get selector with fallback options
   */
  static getSelector(selectorPath: string | string[]): string {
    if (Array.isArray(selectorPath)) {
      return selectorPath.join(', ');
    }
    return selectorPath;
  }

  /**
   * Validate if page has required selectors
   */
  static async validatePage(pageSelectors: Record<string, any>): Promise<{
    valid: boolean;
    found: string[];
    missing: string[];
  }> {
    const found: string[] = [];
    const missing: string[] = [];

    const checkSelectors = (obj: Record<string, any>, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          const element = document.querySelector(value);
          const path = prefix ? `${prefix}.${key}` : key;
          
          if (element) {
            found.push(path);
          } else {
            missing.push(path);
          }
        } else if (typeof value === 'object' && value !== null) {
          checkSelectors(value, prefix ? `${prefix}.${key}` : key);
        }
      }
    };

    checkSelectors(pageSelectors);

    return {
      valid: missing.length === 0,
      found,
      missing
    };
  }

  /**
   * Get all matching selectors for a category
   */
  static getSelectorsByCategory(category: keyof typeof selectors): Record<string, string> {
    const categorySelectors = selectors[category];
    const flattened: Record<string, string> = {};

    const flatten = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          const path = prefix ? `${prefix}.${key}` : key;
          flattened[path] = value;
        } else if (typeof value === 'object' && value !== null) {
          flatten(value, prefix ? `${prefix}.${key}` : key);
        }
      }
    };

    if (categorySelectors) {
      flatten(categorySelectors);
    }

    return flattened;
  }

  /**
   * Check if element matches any of the selectors
   */
  static elementMatchesSelectors(element: Element, selectorList: string[]): boolean {
    return selectorList.some(selector => element.matches(selector));
  }

  /**
   * Get the most specific selector for an element
   */
  static getMostSpecificSelector(element: Element): string | null {
    // Try data-testid first (most reliable)
    const testId = element.getAttribute('data-testid');
    if (testId) {
      return `[data-testid="${testId}"]`;
    }

    // Try ID
    if (element.id) {
      return `#${element.id}`;
    }

    // Try specific attributes
    const name = element.getAttribute('name');
    if (name) {
      return `[name="${name}"]`;
    }

    // Try aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return `[aria-label="${ariaLabel}"]`;
    }

    // Try class (less reliable)
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    return null;
  }
}

// Export SquareSelectors as default for convenience
export default SquareSelectors;
