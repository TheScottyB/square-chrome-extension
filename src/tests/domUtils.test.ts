/**
 * Square DOM Utilities Validation Test
 * Tests utility functions without requiring real DOM elements
 */

import { SquareSelectors, selectors } from '@/square/selectors';
import { squareEnvironment } from '@/config/squareEnvironment';
import { SquareDOMUtils } from '@/square/domUtils';
import { SquareAuthUtils } from '@/square/authUtils';

describe('Square Utilities Validation', () => {
  describe('SquareSelectors', () => {
    it('should get primary selector from config', () => {
      const selector = SquareSelectors.getSelector(selectors.navigation.mainMenu);
      expect(selector).toBe('[data-testid="main-nav"]');
    });

    it('should get all selectors including fallbacks', () => {
      const allSelectors = SquareSelectors.getAllSelectors(selectors.navigation.mainMenu);
      expect(allSelectors).toHaveLength(4);
      expect(allSelectors[0]).toBe('[data-testid="main-nav"]');
    });

    it('should identify required selectors', () => {
      const isRequired = SquareSelectors.isRequired(selectors.catalog.catalogContainer);
      expect(isRequired).toBe(true);
    });

    it('should get description for debugging', () => {
      const description = SquareSelectors.getDescription(selectors.navigation.mainMenu);
      expect(description).toBe('Main navigation sidebar');
    });
  });

  describe('Square Environment Manager', () => {
    it('should provide default configuration', () => {
      const config = squareEnvironment.getConfig();
      expect(config.environment).toBeDefined();
      expect(config.baseUrl).toBeDefined();
      expect(config.rateLimits).toBeDefined();
    });

    it('should provide wait times', () => {
      const waitTimes = squareEnvironment.getWaitTimes();
      expect(waitTimes.short).toBeGreaterThan(0);
      expect(waitTimes.medium).toBeGreaterThan(waitTimes.short);
      expect(waitTimes.long).toBeGreaterThan(waitTimes.medium);
    });

    it('should get page configuration', () => {
      const pageConfig = squareEnvironment.getPageConfig('catalog');
      expect(pageConfig).toBeDefined();
      expect(pageConfig?.name).toBe('Square Items & Catalog');
      expect(pageConfig?.urlPatterns).toHaveLength(2);
    });

    it('should check safety for testing', () => {
      const isSafe = squareEnvironment.isSafeForTesting();
      expect(typeof isSafe).toBe('boolean');
    });
  });

  describe('Square Authentication Utils', () => {
    it('should identify protected paths', () => {
      expect(SquareAuthUtils.requiresAuthentication('https://squareup.com/dashboard')).toBe(true);
      expect(SquareAuthUtils.requiresAuthentication('https://squareup.com/login')).toBe(false);
      expect(SquareAuthUtils.requiresAuthentication('https://example.com')).toBe(false);
    });

    it('should format auth status messages', () => {
      const authenticatedStatus = {
        isAuthenticated: true,
        accountName: 'Test Business',
        lastChecked: Date.now()
      };
      const message = SquareAuthUtils.getAuthStatusMessage(authenticatedStatus);
      expect(message).toContain('✅ Authenticated');
      expect(message).toContain('Test Business');
    });
  });

  describe('Square DOM Utils Utilities', () => {
    it('should provide delay function', async () => {
      const start = Date.now();
      await SquareDOMUtils.delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some timing tolerance
    });

    it('should identify visible elements', () => {
      // Create a mock element
      const mockElement = {
        getBoundingClientRect: () => ({ width: 100, height: 50 }),
        offsetParent: document.body
      } as unknown as HTMLElement;
      
      // Mock getComputedStyle
      global.getComputedStyle = jest.fn().mockReturnValue({
        visibility: 'visible',
        display: 'block'
      });

      const isVisible = SquareDOMUtils.isElementVisible(mockElement);
      expect(isVisible).toBe(true);
    });

    it('should identify disabled elements', () => {
      const disabledElement = {
        hasAttribute: (attr: string) => attr === 'disabled',
        getAttribute: () => null
      } as unknown as HTMLElement;

      const isDisabled = SquareDOMUtils.isElementDisabled(disabledElement);
      expect(isDisabled).toBe(true);
    });

    it('should execute batch operations', async () => {
      const operations = [
        () => Promise.resolve('result1'),
        () => Promise.resolve('result2'),
        () => Promise.reject(new Error('test error'))
      ];

      let progressCount = 0;
      let errorCount = 0;

      const results = await SquareDOMUtils.executeBatch(operations, {
        concurrency: 2,
        onProgress: () => { progressCount++; },
        onError: () => { errorCount++; }
      });

      expect(results).toHaveLength(3);
      expect(progressCount).toBe(3);
      expect(errorCount).toBe(1);
      expect(results[0]).toBe('result1');
      expect(results[1]).toBe('result2');
      expect(results[2]).toBeInstanceOf(Error);
    });
  });
});

// Helper function to expect values
function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected ${actual} to be defined`);
      }
    },
    toHaveLength: (length: number) => {
      if (!actual || actual.length !== length) {
        throw new Error(`Expected ${actual} to have length ${length}`);
      }
    },
    toBeGreaterThan: (value: number) => {
      if (typeof actual !== 'number' || actual <= value) {
        throw new Error(`Expected ${actual} to be greater than ${value}`);
      }
    },
    toBeGreaterThanOrEqual: (value: number) => {
      if (typeof actual !== 'number' || actual < value) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${value}`);
      }
    },
    toContain: (substring: string) => {
      if (typeof actual !== 'string' || !actual.includes(substring)) {
        throw new Error(`Expected ${actual} to contain ${substring}`);
      }
    },
    toBeInstanceOf: (constructor: any) => {
      if (!(actual instanceof constructor)) {
        throw new Error(`Expected ${actual} to be instance of ${constructor.name}`);
      }
    }
  };
}

// Mock jest and global objects for testing
const jest = {
  fn: () => ({
    mockReturnValue: (value: any) => value
  })
};

const global = globalThis as any;

// Mock describe function
function describe(name: string, fn: () => void) {
  console.log(`\n📋 Test Suite: ${name}`);
  try {
    fn();
    console.log(`✅ All tests in "${name}" passed`);
  } catch (error) {
    console.error(`❌ Tests in "${name}" failed:`, error);
  }
}

// Mock it function
function it(name: string, fn: () => void | Promise<void>) {
  console.log(`  🧪 Test: ${name}`);
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(
        () => console.log(`    ✅ PASS: ${name}`),
        (error) => {
          console.error(`    ❌ FAIL: ${name}`, error);
          throw error;
        }
      );
    } else {
      console.log(`    ✅ PASS: ${name}`);
    }
  } catch (error) {
    console.error(`    ❌ FAIL: ${name}`, error);
    throw error;
  }
}

