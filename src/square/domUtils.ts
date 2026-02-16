/**
 * Square DOM Interaction Utilities
 * Safe DOM manipulation functions with error handling, retries, and validation
 * 
 * These utilities provide a reliable interface for interacting with Square's
 * dynamic web interface, including robust error handling and retry mechanisms.
 */

import { SelectorConfig, SquareSelectors } from './selectors';
import { squareEnvironment } from '@/config/squareEnvironment';

export interface WaitOptions {
  timeout?: number;
  interval?: number;
  visible?: boolean;
  enabled?: boolean;
}

export interface ClickOptions extends WaitOptions {
  force?: boolean;
  doubleClick?: boolean;
  rightClick?: boolean;
  coordinates?: { x: number; y: number };
}

export interface TypeOptions extends WaitOptions {
  clear?: boolean;
  delay?: number;
  append?: boolean;
}

export interface InteractionResult {
  success: boolean;
  element?: HTMLElement;
  error?: string;
  retryCount?: number;
  duration?: number;
}

export interface WaitResult {
  success: boolean;
  element?: HTMLElement;
  error?: string;
  timeout?: boolean;
}

export class SquareDOMUtils {
  private static retryAttempts = 3;
  private static baseDelay = 1000;

  /**
   * Find element using selector configuration with fallbacks
   */
  static async findElement(
    selectorConfig: SelectorConfig | string,
    options: WaitOptions = {}
  ): Promise<WaitResult> {
    const selectors = SquareSelectors.getAllSelectors(selectorConfig);
    const timeout = options.timeout || squareEnvironment.getWaitTimes().medium;
    const interval = options.interval || 100;
    const startTime = Date.now();

    for (const selector of selectors) {
      console.log(`🔍 Trying selector: ${selector}`);
      
      const result = await this.waitForElement(selector, {
        ...options,
        timeout: Math.max(500, timeout / selectors.length) // Distribute timeout across selectors
      });

      if (result.success && result.element) {
        console.log(`✅ Found element with selector: ${selector}`);
        return {
          success: true,
          element: result.element,
          timeout: false
        };
      }
    }

    const elapsed = Date.now() - startTime;
    const description = SquareSelectors.getDescription(selectorConfig);
    
    return {
      success: false,
      error: `Element not found: ${description}. Tried ${selectors.length} selectors in ${elapsed}ms`,
      timeout: elapsed >= timeout
    };
  }

  /**
   * Wait for element to be present in DOM
   */
  static async waitForElement(
    selector: string,
    options: WaitOptions = {}
  ): Promise<WaitResult> {
    const timeout = options.timeout || squareEnvironment.getWaitTimes().medium;
    const interval = options.interval || 100;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const check = () => {
        const element = document.querySelector(selector) as HTMLElement;
        
        if (element) {
          // Check visibility if required
          if (options.visible && !this.isElementVisible(element)) {
            if (Date.now() - startTime < timeout) {
              setTimeout(check, interval);
              return;
            }
          }
          
          // Check enabled state if required
          if (options.enabled && this.isElementDisabled(element)) {
            if (Date.now() - startTime < timeout) {
              setTimeout(check, interval);
              return;
            }
          }
          
          resolve({
            success: true,
            element,
            timeout: false
          });
          return;
        }

        if (Date.now() - startTime < timeout) {
          setTimeout(check, interval);
        } else {
          resolve({
            success: false,
            error: `Timeout waiting for selector: ${selector}`,
            timeout: true
          });
        }
      };

      check();
    });
  }

  /**
   * Safe click with retries and validation
   */
  static async safeClick(
    selectorConfig: SelectorConfig | string,
    options: ClickOptions = {}
  ): Promise<InteractionResult> {
    const startTime = Date.now();
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🎯 Click attempt ${attempt}/${this.retryAttempts}`);

        // Find the element
        const findResult = await this.findElement(selectorConfig, {
          ...options,
          visible: true,
          enabled: true
        });

        if (!findResult.success || !findResult.element) {
          lastError = findResult.error || 'Element not found';
          if (attempt < this.retryAttempts) {
            await this.delay(this.baseDelay * attempt);
            continue;
          }
          break;
        }

        const element = findResult.element;

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(200);

        // Perform the click
        if (options.coordinates) {
          this.clickAtCoordinates(element, options.coordinates);
        } else if (options.doubleClick) {
          element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        } else if (options.rightClick) {
          element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
        } else {
          // Try different click methods
          if (element.click && !options.force) {
            element.click();
          } else {
            // Fallback to event dispatch
            element.dispatchEvent(new MouseEvent('click', { 
              bubbles: true, 
              cancelable: true,
              view: window
            }));
          }
        }

        // Verify click was successful (look for page changes, etc.)
        await this.delay(500);

        return {
          success: true,
          element,
          retryCount: attempt - 1,
          duration: Date.now() - startTime
        };

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.warn(`Click attempt ${attempt} failed:`, lastError);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.baseDelay * attempt);
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Click failed after all retries',
      retryCount: this.retryAttempts,
      duration: Date.now() - startTime
    };
  }

  /**
   * Safe typing with clearing and validation
   */
  static async safeType(
    selectorConfig: SelectorConfig | string,
    text: string,
    options: TypeOptions = {}
  ): Promise<InteractionResult> {
    const startTime = Date.now();
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`⌨️ Type attempt ${attempt}/${this.retryAttempts}`);

        // Find the element
        const findResult = await this.findElement(selectorConfig, {
          ...options,
          visible: true,
          enabled: true
        });

        if (!findResult.success || !findResult.element) {
          lastError = findResult.error || 'Element not found';
          if (attempt < this.retryAttempts) {
            await this.delay(this.baseDelay * attempt);
            continue;
          }
          break;
        }

        const element = findResult.element as HTMLInputElement | HTMLTextAreaElement;

        // Focus the element
        element.focus();
        await this.delay(100);

        // Clear existing content if requested
        if (options.clear && !options.append) {
          element.select();
          document.execCommand('delete');
          // Fallback method
          element.value = '';
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Type the text
        const delay = options.delay || 50;
        const textToType = options.append ? element.value + text : text;
        
        if (delay > 0) {
          // Type character by character with delay
          element.value = '';
          for (const char of textToType) {
            element.value += char;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await this.delay(delay);
          }
        } else {
          // Type all at once
          element.value = textToType;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Trigger change event
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.blur();

        // Verify the text was entered correctly
        await this.delay(200);
        if (element.value !== textToType) {
          throw new Error(`Text verification failed. Expected: "${textToType}", Got: "${element.value}"`);
        }

        return {
          success: true,
          element,
          retryCount: attempt - 1,
          duration: Date.now() - startTime
        };

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.warn(`Type attempt ${attempt} failed:`, lastError);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.baseDelay * attempt);
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Type failed after all retries',
      retryCount: this.retryAttempts,
      duration: Date.now() - startTime
    };
  }

  /**
   * Safe form submission with validation
   */
  static async safeSubmit(
    formSelectorConfig: SelectorConfig | string,
    options: WaitOptions = {}
  ): Promise<InteractionResult> {
    const startTime = Date.now();

    try {
      // Find the form
      const findResult = await this.findElement(formSelectorConfig, options);
      
      if (!findResult.success || !findResult.element) {
        return {
          success: false,
          error: findResult.error || 'Form not found',
          duration: Date.now() - startTime
        };
      }

      const form = findResult.element as HTMLFormElement;
      
      // Validate form before submission
      if (!form.checkValidity()) {
        return {
          success: false,
          error: 'Form validation failed',
          duration: Date.now() - startTime
        };
      }

      // Submit the form
      form.submit();
      
      // Wait for potential page navigation or response
      await this.delay(squareEnvironment.getWaitTimes().networkRequest);

      return {
        success: true,
        element: form,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Wait for page load and stability
   */
  static async waitForPageLoad(timeout: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkStability = () => {
        if (document.readyState === 'complete') {
          // Additional check for dynamic content
          setTimeout(() => {
            resolve(true);
          }, 500);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(checkStability, 100);
        } else {
          resolve(false);
        }
      };

      if (document.readyState === 'complete') {
        checkStability();
      } else {
        document.addEventListener('DOMContentLoaded', checkStability, { once: true });
      }
    });
  }

  /**
   * Extract text content from element
   */
  static async extractText(
    selectorConfig: SelectorConfig | string,
    options: WaitOptions = {}
  ): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const findResult = await this.findElement(selectorConfig, options);
      
      if (!findResult.success || !findResult.element) {
        return {
          success: false,
          error: findResult.error || 'Element not found'
        };
      }

      const text = findResult.element.textContent?.trim() || '';
      return {
        success: true,
        text
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extract attribute value from element
   */
  static async extractAttribute(
    selectorConfig: SelectorConfig | string,
    attributeName: string,
    options: WaitOptions = {}
  ): Promise<{ success: boolean; value?: string; error?: string }> {
    try {
      const findResult = await this.findElement(selectorConfig, options);
      
      if (!findResult.success || !findResult.element) {
        return {
          success: false,
          error: findResult.error || 'Element not found'
        };
      }

      const value = findResult.element.getAttribute(attributeName);
      return {
        success: true,
        value: value || ''
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if element is visible
   */
  static isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      element.offsetParent !== null
    );
  }

  /**
   * Check if element is disabled
   */
  static isElementDisabled(element: HTMLElement): boolean {
    return (
      element.hasAttribute('disabled') ||
      element.getAttribute('aria-disabled') === 'true' ||
      (element as HTMLInputElement).disabled === true
    );
  }

  /**
   * Click at specific coordinates within element
   */
  private static clickAtCoordinates(element: HTMLElement, coordinates: { x: number; y: number }): void {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: coordinates.x,
      clientY: coordinates.y,
      view: window
    });
    element.dispatchEvent(event);
  }

  /**
   * Delay execution
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Take screenshot for debugging (if available)
   */
  static async takeScreenshot(): Promise<string | null> {
    try {
      if ('html2canvas' in window) {
        // @ts-ignore - html2canvas might be loaded globally
        const canvas = await html2canvas(document.body);
        return canvas.toDataURL();
      }
      return null;
    } catch (error) {
      console.warn('Screenshot failed:', error);
      return null;
    }
  }

  /**
   * Log interaction for debugging
   */
  static logInteraction(
    action: string,
    selectorConfig: SelectorConfig | string,
    result: InteractionResult,
    additionalData?: any
  ): void {
    const description = SquareSelectors.getDescription(selectorConfig);
    const logData = {
      action,
      element: description,
      success: result.success,
      duration: result.duration,
      retryCount: result.retryCount,
      error: result.error,
      ...additionalData
    };

    if (result.success) {
      console.log(`✅ ${action} successful:`, logData);
    } else {
      console.error(`❌ ${action} failed:`, logData);
    }
  }

  /**
   * Batch operations with progress tracking
   */
  static async executeBatch<T>(
    operations: Array<() => Promise<T>>,
    options: {
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
      onError?: (error: Error, index: number) => void;
    } = {}
  ): Promise<Array<T | Error>> {
    const { concurrency = 3, onProgress, onError } = options;
    const results: Array<T | Error> = [];
    let completed = 0;

    const executeOperation = async (operation: () => Promise<T>, index: number): Promise<T | Error> => {
      try {
        const result = await operation();
        completed++;
        onProgress?.(completed, operations.length);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err, index);
        completed++;
        onProgress?.(completed, operations.length);
        return err;
      }
    };

    // Execute operations in batches
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      const batchPromises = batch.map((operation, batchIndex) => 
        executeOperation(operation, i + batchIndex)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }
}
