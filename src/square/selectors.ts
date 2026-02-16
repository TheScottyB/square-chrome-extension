/**
 * Square DOM Selector Library
 * Comprehensive mapping of Square interface elements for automation
 * 
 * This library provides reliable selectors for Square dashboard elements,
 * organized by page and functionality to support robust automation.
 */

export interface SelectorConfig {
  primary: string;
  fallbacks: string[];
  waitForVisible?: boolean;
  isRequired?: boolean;
  description?: string;
}

export interface PageSelectors {
  [key: string]: SelectorConfig | string;
}

/**
 * Square Dashboard Navigation Selectors
 */
export const navigation: PageSelectors = {
  // Main navigation
  mainMenu: {
    primary: '[data-testid="main-nav"]',
    fallbacks: ['.main-nav', 'nav[role="navigation"]', '.sidebar-nav'],
    description: 'Main navigation sidebar'
  },
  
  itemsMenuItem: {
    primary: '[data-testid="nav-items"]',
    fallbacks: ['a[href*="/items"]', 'a[aria-label*="Items"]', '.nav-items'],
    description: 'Items/Catalog navigation link'
  },
  
  dashboardMenuItem: {
    primary: '[data-testid="nav-dashboard"]',
    fallbacks: ['a[href*="/dashboard"]', 'a[aria-label*="Dashboard"]', '.nav-dashboard'],
    description: 'Dashboard navigation link'
  },
  
  inventoryMenuItem: {
    primary: '[data-testid="nav-inventory"]',
    fallbacks: ['a[href*="/inventory"]', 'a[aria-label*="Inventory"]', '.nav-inventory'],
    description: 'Inventory navigation link'
  },
  
  onlineMenuItem: {
    primary: '[data-testid="nav-online"]',
    fallbacks: ['a[href*="/online"]', 'a[aria-label*="Online"]', '.nav-online'],
    description: 'Online store navigation link'
  },

  // User account menu
  userMenu: {
    primary: '[data-testid="user-menu"]',
    fallbacks: ['.user-menu', '[data-test-id="user-menu"]', '.account-menu'],
    description: 'User account dropdown menu'
  },

  // Breadcrumb navigation
  breadcrumbs: {
    primary: '[data-testid="breadcrumbs"]',
    fallbacks: ['.breadcrumbs', 'nav[aria-label="Breadcrumb"]', '.page-breadcrumbs'],
    description: 'Page breadcrumb navigation'
  }
};

/**
 * Square Items/Catalog Page Selectors
 */
export const catalog: PageSelectors = {
  // Page containers
  catalogContainer: {
    primary: '[data-testid="items-page"]',
    fallbacks: ['.items-page', '.catalog-page', '.items-container'],
    isRequired: true,
    description: 'Main catalog page container'
  },

  // Item grid and list
  itemsGrid: {
    primary: '[data-testid="items-grid"]',
    fallbacks: ['.items-grid', '.catalog-grid', '.items-list'],
    description: 'Items grid/list container'
  },

  itemCard: {
    primary: '[data-testid="item-card"]',
    fallbacks: ['.item-card', '.catalog-item', '.item-tile'],
    description: 'Individual item card (multiple elements)'
  },

  itemName: {
    primary: '[data-testid="item-name"]',
    fallbacks: ['.item-name', '.item-title', '.product-name'],
    description: 'Item name within item card'
  },

  itemPrice: {
    primary: '[data-testid="item-price"]',
    fallbacks: ['.item-price', '.price', '.product-price'],
    description: 'Item price within item card'
  },

  itemImage: {
    primary: '[data-testid="item-image"]',
    fallbacks: ['.item-image img', '.product-image img', '.item-photo img'],
    description: 'Item image within item card'
  },

  // Actions and controls
  addItemButton: {
    primary: '[data-testid="add-item"]',
    fallbacks: ['button[aria-label*="Add item"]', '.add-item-btn', 'button:contains("Add Item")'],
    description: 'Add new item button'
  },

  searchInput: {
    primary: '[data-testid="items-search"]',
    fallbacks: ['input[placeholder*="Search"]', '.search-input', 'input[name="search"]'],
    description: 'Items search input field'
  },

  filterButton: {
    primary: '[data-testid="filter-button"]',
    fallbacks: ['button[aria-label*="Filter"]', '.filter-btn', 'button:contains("Filter")'],
    description: 'Filter options button'
  },

  sortDropdown: {
    primary: '[data-testid="sort-dropdown"]',
    fallbacks: ['select[name*="sort"]', '.sort-select', '[aria-label*="Sort"]'],
    description: 'Sort options dropdown'
  },

  // Bulk operations
  selectAllCheckbox: {
    primary: '[data-testid="select-all"]',
    fallbacks: ['input[name="select-all"]', '.select-all-checkbox', 'th input[type="checkbox"]'],
    description: 'Select all items checkbox'
  },

  itemCheckbox: {
    primary: '[data-testid="item-checkbox"]',
    fallbacks: ['.item-checkbox', 'input[name*="item-select"]', '.item-select'],
    description: 'Individual item selection checkbox'
  },

  bulkActionsMenu: {
    primary: '[data-testid="bulk-actions"]',
    fallbacks: ['.bulk-actions', '.bulk-operations', '[aria-label*="Bulk actions"]'],
    description: 'Bulk actions dropdown menu'
  },

  // Pagination
  pagination: {
    primary: '[data-testid="pagination"]',
    fallbacks: ['.pagination', '.pager', 'nav[aria-label*="pagination"]'],
    description: 'Pagination controls'
  },

  nextPageButton: {
    primary: '[data-testid="next-page"]',
    fallbacks: ['button[aria-label*="Next"]', '.next-page', 'a[rel="next"]'],
    description: 'Next page button'
  },

  prevPageButton: {
    primary: '[data-testid="prev-page"]',
    fallbacks: ['button[aria-label*="Previous"]', '.prev-page', 'a[rel="prev"]'],
    description: 'Previous page button'
  }
};

/**
 * Square Item Detail/Edit Page Selectors
 */
export const itemDetail: PageSelectors = {
  // Page container
  itemDetailContainer: {
    primary: '[data-testid="item-detail"]',
    fallbacks: ['.item-detail', '.item-edit', '.product-detail'],
    isRequired: true,
    description: 'Item detail page container'
  },

  // Basic item information
  itemNameInput: {
    primary: '[data-testid="item-name-input"]',
    fallbacks: ['input[name*="name"]', '#item-name', '.item-name-input'],
    isRequired: true,
    description: 'Item name input field'
  },

  itemDescriptionTextarea: {
    primary: '[data-testid="item-description"]',
    fallbacks: ['textarea[name*="description"]', '#item-description', '.item-description'],
    description: 'Item description textarea'
  },

  itemCategorySelect: {
    primary: '[data-testid="item-category"]',
    fallbacks: ['select[name*="category"]', '#item-category', '.category-select'],
    description: 'Item category dropdown'
  },

  // Pricing
  priceInput: {
    primary: '[data-testid="item-price"]',
    fallbacks: ['input[name*="price"]', '#item-price', '.price-input'],
    description: 'Item price input field'
  },

  costInput: {
    primary: '[data-testid="item-cost"]',
    fallbacks: ['input[name*="cost"]', '#item-cost', '.cost-input'],
    description: 'Item cost input field'
  },

  // SKU and tracking
  skuInput: {
    primary: '[data-testid="item-sku"]',
    fallbacks: ['input[name*="sku"]', '#item-sku', '.sku-input'],
    description: 'Item SKU input field'
  },

  trackQuantityCheckbox: {
    primary: '[data-testid="track-quantity"]',
    fallbacks: ['input[name*="track"]', '#track-quantity', '.track-quantity-checkbox'],
    description: 'Track quantity checkbox'
  },

  quantityInput: {
    primary: '[data-testid="quantity-input"]',
    fallbacks: ['input[name*="quantity"]', '#quantity', '.quantity-input'],
    description: 'Quantity/stock input field'
  },

  // Images
  imageUploadArea: {
    primary: '[data-testid="image-upload"]',
    fallbacks: ['.image-upload', '.photo-upload', 'input[type="file"]'],
    description: 'Image upload area'
  },

  imagePreview: {
    primary: '[data-testid="image-preview"]',
    fallbacks: ['.image-preview', '.item-photo', '.uploaded-image'],
    description: 'Uploaded image preview'
  },

  deleteImageButton: {
    primary: '[data-testid="delete-image"]',
    fallbacks: ['button[aria-label*="Delete image"]', '.delete-image', '.remove-photo'],
    description: 'Delete image button'
  },

  // SEO Section
  seoSection: {
    primary: '[data-testid="seo-section"]',
    fallbacks: ['.seo-section', '.seo-fields', '.online-details'],
    description: 'SEO/Online details section'
  },

  seoTitleInput: {
    primary: '[data-testid="seo-title"]',
    fallbacks: ['input[name*="seo-title"]', '#seo-title', '.seo-title-input'],
    description: 'SEO title input field'
  },

  seoDescriptionTextarea: {
    primary: '[data-testid="seo-description"]',
    fallbacks: ['textarea[name*="seo-description"]', '#seo-description', '.seo-description'],
    description: 'SEO description textarea'
  },

  seoUrlInput: {
    primary: '[data-testid="seo-url"]',
    fallbacks: ['input[name*="url-slug"]', '#seo-url', '.url-slug-input'],
    description: 'SEO URL slug input field'
  },

  // Variations/Modifiers
  variationsSection: {
    primary: '[data-testid="variations-section"]',
    fallbacks: ['.variations-section', '.modifiers-section', '.options-section'],
    description: 'Product variations section'
  },

  addVariationButton: {
    primary: '[data-testid="add-variation"]',
    fallbacks: ['button[aria-label*="Add variation"]', '.add-variation-btn', 'button:contains("Add Variation")'],
    description: 'Add variation button'
  },

  // Actions
  saveButton: {
    primary: '[data-testid="save-item"]',
    fallbacks: ['button[type="submit"]', '.save-btn', 'button:contains("Save")'],
    isRequired: true,
    description: 'Save item button'
  },

  cancelButton: {
    primary: '[data-testid="cancel-edit"]',
    fallbacks: ['button[aria-label*="Cancel"]', '.cancel-btn', 'button:contains("Cancel")'],
    description: 'Cancel edit button'
  },

  deleteButton: {
    primary: '[data-testid="delete-item"]',
    fallbacks: ['button[aria-label*="Delete"]', '.delete-btn', 'button:contains("Delete")'],
    description: 'Delete item button'
  }
};

/**
 * Square Dashboard Home Page Selectors
 */
export const dashboard: PageSelectors = {
  // Main dashboard container
  dashboardContainer: {
    primary: '[data-testid="dashboard"]',
    fallbacks: ['.dashboard', '.dashboard-content', '.home-dashboard'],
    isRequired: true,
    description: 'Main dashboard container'
  },

  // Revenue and analytics
  revenueCard: {
    primary: '[data-testid="revenue-card"]',
    fallbacks: ['.revenue-card', '.sales-summary', '.revenue-summary'],
    description: 'Revenue summary card'
  },

  revenueAmount: {
    primary: '[data-testid="revenue-amount"]',
    fallbacks: ['.revenue-amount', '.total-sales', '.sales-amount'],
    description: 'Revenue amount display'
  },

  // Recent activity
  recentActivity: {
    primary: '[data-testid="recent-activity"]',
    fallbacks: ['.recent-activity', '.activity-feed', '.recent-orders'],
    description: 'Recent activity section'
  },

  // Quick actions
  quickActions: {
    primary: '[data-testid="quick-actions"]',
    fallbacks: ['.quick-actions', '.dashboard-actions', '.shortcuts'],
    description: 'Quick actions section'
  },

  // Inventory alerts
  inventoryAlerts: {
    primary: '[data-testid="inventory-alerts"]',
    fallbacks: ['.inventory-alerts', '.stock-alerts', '.low-stock'],
    description: 'Inventory alerts section'
  }
};

/**
 * Square Authentication/Login Selectors
 */
export const authentication: PageSelectors = {
  // Login form
  loginForm: {
    primary: '[data-testid="login-form"]',
    fallbacks: ['form[action*="login"]', '.login-form', '#login-form'],
    isRequired: true,
    description: 'Login form container'
  },

  emailInput: {
    primary: '[data-testid="email-input"]',
    fallbacks: ['input[type="email"]', 'input[name="email"]', '#email'],
    isRequired: true,
    description: 'Email input field'
  },

  passwordInput: {
    primary: '[data-testid="password-input"]',
    fallbacks: ['input[type="password"]', 'input[name="password"]', '#password'],
    isRequired: true,
    description: 'Password input field'
  },

  loginButton: {
    primary: '[data-testid="login-button"]',
    fallbacks: ['button[type="submit"]', '.login-btn', 'button:contains("Sign in")'],
    isRequired: true,
    description: 'Login submit button'
  },

  // Account indicators (when logged in)
  userAvatar: {
    primary: '[data-testid="user-avatar"]',
    fallbacks: ['.user-avatar', '.profile-avatar', '.account-avatar'],
    description: 'User profile avatar'
  },

  accountName: {
    primary: '[data-testid="account-name"]',
    fallbacks: ['.account-name', '.user-name', '.profile-name'],
    description: 'Account/business name display'
  }
};

/**
 * Common UI Elements Selectors
 */
export const common: PageSelectors = {
  // Loading states
  loadingSpinner: {
    primary: '[data-testid="loading"]',
    fallbacks: ['.loading', '.spinner', '.loading-spinner', '[role="progressbar"]'],
    description: 'Loading spinner indicator'
  },

  // Modals and overlays
  modal: {
    primary: '[data-testid="modal"]',
    fallbacks: ['.modal', '.dialog', '[role="dialog"]'],
    description: 'Modal dialog container'
  },

  modalCloseButton: {
    primary: '[data-testid="modal-close"]',
    fallbacks: ['button[aria-label*="Close"]', '.modal-close', '.close-btn'],
    description: 'Modal close button'
  },

  // Notifications and alerts
  notification: {
    primary: '[data-testid="notification"]',
    fallbacks: ['.notification', '.alert', '.toast', '[role="alert"]'],
    description: 'Notification/alert message'
  },

  successMessage: {
    primary: '[data-testid="success-message"]',
    fallbacks: ['.success', '.alert-success', '.notification-success'],
    description: 'Success message indicator'
  },

  errorMessage: {
    primary: '[data-testid="error-message"]',
    fallbacks: ['.error', '.alert-error', '.notification-error'],
    description: 'Error message indicator'
  },

  // Form elements
  formGroup: {
    primary: '.form-group',
    fallbacks: ['.field-group', '.input-group', '.form-field'],
    description: 'Form field container'
  },

  formLabel: {
    primary: '.form-label',
    fallbacks: ['label', '.field-label', '.input-label'],
    description: 'Form field label'
  },

  formError: {
    primary: '.form-error',
    fallbacks: ['.field-error', '.validation-error', '.error-text'],
    description: 'Form validation error message'
  }
};

/**
 * Selector utility functions
 */
export class SquareSelectors {
  /**
   * Get the best available selector for an element
   */
  static getSelector(selectorConfig: SelectorConfig | string): string {
    if (typeof selectorConfig === 'string') {
      return selectorConfig;
    }
    
    return selectorConfig.primary;
  }

  /**
   * Get all possible selectors for an element (primary + fallbacks)
   */
  static getAllSelectors(selectorConfig: SelectorConfig | string): string[] {
    if (typeof selectorConfig === 'string') {
      return [selectorConfig];
    }
    
    return [selectorConfig.primary, ...selectorConfig.fallbacks];
  }

  /**
   * Check if a selector should be visible before interaction
   */
  static shouldWaitForVisible(selectorConfig: SelectorConfig | string): boolean {
    if (typeof selectorConfig === 'string') {
      return false;
    }
    
    return selectorConfig.waitForVisible || false;
  }

  /**
   * Check if a selector is required for the page to be valid
   */
  static isRequired(selectorConfig: SelectorConfig | string): boolean {
    if (typeof selectorConfig === 'string') {
      return false;
    }
    
    return selectorConfig.isRequired || false;
  }

  /**
   * Get description for debugging/logging
   */
  static getDescription(selectorConfig: SelectorConfig | string): string {
    if (typeof selectorConfig === 'string') {
      return 'Custom selector';
    }
    
    return selectorConfig.description || 'No description';
  }

  /**
   * Validate that all required selectors are present on the page
   */
  static async validatePage(pageSelectors: PageSelectors): Promise<{
    valid: boolean;
    missing: string[];
    found: string[];
  }> {
    const missing: string[] = [];
    const found: string[] = [];

    for (const [key, selectorConfig] of Object.entries(pageSelectors)) {
      if (!this.isRequired(selectorConfig)) continue;

      const selectors = this.getAllSelectors(selectorConfig);
      let elementFound = false;

      for (const selector of selectors) {
        if (document.querySelector(selector)) {
          elementFound = true;
          found.push(key);
          break;
        }
      }

      if (!elementFound) {
        missing.push(key);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      found
    };
  }
}

// Export all selector collections
export const selectors = {
  navigation,
  catalog,
  itemDetail,
  dashboard,
  authentication,
  common
};
