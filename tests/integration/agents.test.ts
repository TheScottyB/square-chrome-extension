import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import { AgentTask, AgentResult } from '../../src/agents/types';

/**
 * Integration tests for Square Chrome Extension Enhanced Agents
 */

// Helper to load extension
async function loadExtension(context: BrowserContext) {
  const extensionPath = path.join(__dirname, '../../dist');
  
  // Load extension pages
  const pages = await context.pages();
  let extensionId: string | null = null;
  
  // Find extension ID from background page
  for (const page of pages) {
    if (page.url().startsWith('chrome-extension://')) {
      const url = new URL(page.url());
      extensionId = url.hostname;
      break;
    }
  }
  
  return extensionId;
}

// Helper to send message to extension
async function sendMessageToExtension(
  page: Page, 
  extensionId: string, 
  message: any
): Promise<any> {
  return await page.evaluate(([extId, msg]) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(extId, msg, (response) => {
        resolve(response);
      });
    });
  }, [extensionId, message]);
}

test.describe('Enhanced Agent Integration Tests', () => {
  let context: BrowserContext;
  let page: Page;
  let extensionId: string;

  test.beforeAll(async () => {
    // Launch browser with extension
    const pathToExtension = path.join(__dirname, '../../dist');
    
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    // Navigate to Square sandbox/test environment
    page = await context.newPage();
    await page.goto('https://squareupsandbox.com/dashboard');
    
    // Wait for extension to load
    await page.waitForTimeout(2000);
    
    // Get extension ID
    const extId = await loadExtension(context);
    if (!extId) {
      throw new Error('Extension not loaded');
    }
    extensionId = extId;
  });

  test.describe('SEO Agent Tests', () => {
    test('should optimize SEO for an item', async () => {
      // Navigate to item detail page
      await page.goto('https://squareupsandbox.com/dashboard/items/test-item-123/edit');
      await page.waitForLoadState('networkidle');

      // Send SEO optimization request
      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedSEO',
        operation: {
          type: 'optimize',
          data: {
            generateContent: true,
            productName: 'Test Product',
            productDescription: 'High-quality test product',
            category: 'Electronics',
            keywords: ['test', 'product', 'quality']
          }
        }
      });

      // Verify response
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('seoData');
      expect(response.data.fieldsUpdated).toContain('title');
      expect(response.data.fieldsUpdated).toContain('description');
    });

    test('should validate SEO fields', async () => {
      await page.goto('https://squareupsandbox.com/dashboard/items/test-item-123/edit');
      await page.waitForLoadState('networkidle');

      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedSEO',
        operation: {
          type: 'validate',
          data: {}
        }
      });

      expect(response.success).toBe(true);
      expect(response.data.validation).toBeDefined();
      expect(response.data.validation.valid).toBeDefined();
    });
  });

  test.describe('Navigation Agent Tests', () => {
    test('should navigate to catalog page', async () => {
      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedNavigation',
        operation: {
          type: 'navigate',
          data: {
            type: 'catalog',
            waitForLoad: true
          }
        }
      });

      expect(response.success).toBe(true);
      expect(response.data.pageType).toBe('items-library');
      expect(page.url()).toContain('/dashboard/items');
    });

    test('should perform search operation', async () => {
      // Navigate to catalog first
      await page.goto('https://squareupsandbox.com/dashboard/items');
      await page.waitForLoadState('networkidle');

      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedNavigation',
        operation: {
          type: 'search',
          data: {
            searchTerm: 'coffee',
            searchType: 'items',
            maxResults: 5
          }
        }
      });

      expect(response.success).toBe(true);
      expect(response.data.searchResults).toBeDefined();
      expect(Array.isArray(response.data.searchResults)).toBe(true);
    });

    test('should navigate to specific item', async () => {
      const testItemId = 'TEST-ITEM-456';
      
      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedNavigation',
        operation: {
          type: 'navigate',
          data: {
            type: 'item',
            itemId: testItemId,
            waitForLoad: true
          }
        }
      });

      expect(response.success).toBe(true);
      expect(response.data.itemId).toBe(testItemId);
      expect(page.url()).toContain(`/items/${testItemId}`);
    });
  });

  test.describe('Catalog Agent Tests', () => {
    test('should synchronize catalog items', async () => {
      await page.goto('https://squareupsandbox.com/dashboard/items');
      await page.waitForLoadState('networkidle');

      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedCatalog',
        operation: {
          type: 'sync',
          data: {
            items: [
              { id: 'ITEM-1', name: 'Test Item 1', price: 10.99 },
              { id: 'ITEM-2', name: 'Test Item 2', price: 20.99 }
            ],
            syncMode: 'partial'
          }
        }
      });

      expect(response.success).toBe(true);
      expect(response.data.syncedItems).toBeGreaterThan(0);
    });

    test('should update inventory quantities', async () => {
      await page.goto('https://squareupsandbox.com/dashboard/inventory');
      await page.waitForLoadState('networkidle');

      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedCatalog',
        operation: {
          type: 'inventory',
          data: {
            quantities: {
              'ITEM-1': 50,
              'ITEM-2': 100
            },
            trackInventory: true
          }
        }
      });

      expect(response.success).toBe(true);
      expect(response.data.updatedItems).toBeGreaterThan(0);
    });

    test('should extract catalog data', async () => {
      await page.goto('https://squareupsandbox.com/dashboard/items');
      await page.waitForLoadState('networkidle');

      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedCatalog',
        operation: {
          type: 'extract',
          data: {
            includeInventory: true,
            includePricing: true,
            itemLimit: 5
          }
        }
      });

      expect(response.success).toBe(true);
      expect(response.data.items).toBeDefined();
      expect(Array.isArray(response.data.items)).toBe(true);
      expect(response.data.itemCount).toBeLessThanOrEqual(5);
    });
  });

  test.describe('Workflow Tests', () => {
    test('should execute multi-agent workflow', async () => {
      const workflow = {
        name: 'Complete Item Setup',
        steps: [
          {
            id: 'nav-to-catalog',
            agentType: 'navigation',
            operation: 'navigate',
            data: { type: 'catalog' },
            critical: true
          },
          {
            id: 'search-item',
            agentType: 'navigation',
            operation: 'search',
            data: { searchTerm: 'New Product' },
            dependsOn: ['nav-to-catalog']
          },
          {
            id: 'optimize-seo',
            agentType: 'seo',
            operation: 'optimize',
            data: {
              generateContent: true,
              productName: 'New Product'
            },
            dependsOn: ['search-item']
          }
        ]
      };

      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedWorkflow',
        workflow
      });

      expect(response.success).toBe(true);
      expect(response.results).toHaveLength(3);
      expect(response.results.filter(r => r.success)).toHaveLength(3);
    });
  });

  test.describe('Error Handling Tests', () => {
    test('should handle invalid agent type gracefully', async () => {
      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedSEO',
        operation: {
          type: 'invalid-operation',
          data: {}
        }
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown');
    });

    test('should handle page navigation errors', async () => {
      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedNavigation',
        operation: {
          type: 'navigate',
          data: {
            type: 'item',
            itemId: 'NON-EXISTENT-ITEM'
          }
        }
      });

      // Should attempt navigation but may fail validation
      expect(response).toBeDefined();
      if (!response.success) {
        expect(response.error).toBeDefined();
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create 20 items for bulk update
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: `BULK-ITEM-${i}`,
        name: `Bulk Test Item ${i}`,
        price: 10 + i
      }));

      const response = await sendMessageToExtension(page, extensionId, {
        action: 'executeEnhancedCatalog',
        operation: {
          type: 'sync',
          data: {
            items,
            syncMode: 'partial'
          }
        }
      });

      const duration = Date.now() - startTime;

      expect(response.success).toBe(true);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      console.log(`Bulk operation completed in ${duration}ms`);
    });
  });
});

// Playwright configuration for extension testing
export const config = {
  testDir: './tests/integration',
  timeout: 60000,
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...chromium }
    }
  ]
};
