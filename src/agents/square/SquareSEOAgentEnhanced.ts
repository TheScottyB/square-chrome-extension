import { DOMAgent } from '../base/DOMAgent';
import { AgentContext, AgentTask, AgentResult } from '../types';
import { SquareDOMUtils, InteractionResult } from '@/square/domUtils';
import { selectors, SquareSelectors } from '@/square/selectors';
import { squareEnvironment } from '@/config/squareEnvironment';

// SEO Data interface for type safety
interface SEOData {
  title?: string;
  description?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  searchTerms?: string[];
  urlSlug?: string;
}

interface SEOUpdateResult extends AgentResult {
  data?: {
    seoData: SEOData;
    itemId?: string;
    validation?: {
      valid: boolean;
      issues: string[];
    };
    fieldsUpdated?: string[];
    screenshot?: string;
  };
}

/**
 * Enhanced Square SEO Agent with real DOM automation
 * Uses our comprehensive Square DOM utilities and selectors for reliable SEO operations
 */
export class SquareSEOAgentEnhanced extends DOMAgent {
  private readonly waitTimes;

  constructor(context: AgentContext) {
    super(context, {
      name: 'Enhanced Square SEO Agent',
      instructions: `You are an expert Square SEO automation agent that uses advanced DOM utilities.
      
      Your capabilities include:
      - Real DOM interaction with Square's SEO forms
      - Robust error handling and retry mechanisms
      - Form validation and verification
      - SEO content optimization and generation
      - Bulk SEO operations with progress tracking
      - Screenshot capture for debugging
      
      Best practices:
      - Always validate page context before operations
      - Use safe DOM interactions with retries
      - Verify changes after applying them
      - Generate SEO-optimized content following best practices
      - Handle Square's dynamic form loading gracefully
      
      Technical approach:
      - Use SquareDOMUtils for all DOM interactions
      - Leverage comprehensive Square selectors with fallbacks
      - Implement proper wait strategies for dynamic content
      - Validate operations using page-specific selectors`
    });

    this.waitTimes = squareEnvironment.getWaitTimes();
  }

  protected buildTools() {
    // Return empty array for now - can be enhanced with OpenAI tools later
    return [];
  }

  /**
   * Fill SEO form fields using enhanced DOM utilities
   */
  private async fillSEOForm(seoData: SEOData): Promise<SEOUpdateResult> {
    const startTime = Date.now();
    const fieldsUpdated: string[] = [];
    const errors: string[] = [];

    try {
      console.log('📝 Filling SEO form with enhanced DOM utilities:', seoData);

      // Validate we're on the correct page
      const pageValidation = await this.validatePageContext();
      if (!pageValidation.valid) {
        return {
          success: false,
          error: `Page validation failed: ${pageValidation.issues.join(', ')}`
        };
      }

      // Fill item name/title
      if (seoData.title) {
        const result = await SquareDOMUtils.safeType(
          selectors.itemDetail.itemNameInput,
          seoData.title,
          { clear: true, timeout: this.waitTimes.medium }
        );
        
        if (result.success) {
          fieldsUpdated.push('title');
          console.log('✅ Title filled successfully');
        } else {
          errors.push(`Title: ${result.error}`);
        }
      }

      // Fill item description
      if (seoData.description) {
        const result = await SquareDOMUtils.safeType(
          selectors.itemDetail.itemDescriptionTextarea,
          seoData.description,
          { clear: true, timeout: this.waitTimes.medium }
        );
        
        if (result.success) {
          fieldsUpdated.push('description');
          console.log('✅ Description filled successfully');
        } else {
          errors.push(`Description: ${result.error}`);
        }
      }

      // Fill SEO title (if SEO section is available)
      if (seoData.metaTitle) {
        const result = await SquareDOMUtils.safeType(
          selectors.itemDetail.seoTitleInput,
          seoData.metaTitle,
          { clear: true, timeout: this.waitTimes.medium }
        );
        
        if (result.success) {
          fieldsUpdated.push('metaTitle');
          console.log('✅ SEO Title filled successfully');
        } else {
          // SEO fields might not be available on all pages - this is not critical
          console.warn('⚠️ SEO Title field not available:', result.error);
        }
      }

      // Fill SEO description
      if (seoData.metaDescription) {
        const result = await SquareDOMUtils.safeType(
          selectors.itemDetail.seoDescriptionTextarea,
          seoData.metaDescription,
          { clear: true, timeout: this.waitTimes.medium }
        );
        
        if (result.success) {
          fieldsUpdated.push('metaDescription');
          console.log('✅ SEO Description filled successfully');
        } else {
          // SEO fields might not be available on all pages - this is not critical
          console.warn('⚠️ SEO Description field not available:', result.error);
        }
      }

      // Fill URL slug
      if (seoData.urlSlug) {
        const result = await SquareDOMUtils.safeType(
          selectors.itemDetail.seoUrlInput,
          seoData.urlSlug,
          { clear: true, timeout: this.waitTimes.medium }
        );
        
        if (result.success) {
          fieldsUpdated.push('urlSlug');
          console.log('✅ URL Slug filled successfully');
        } else {
          console.warn('⚠️ URL Slug field not available:', result.error);
        }
      }

      // Handle tags if provided
      if (seoData.tags && seoData.tags.length > 0) {
        const tagsResult = await this.fillTags(seoData.tags);
        if (tagsResult.success) {
          fieldsUpdated.push('tags');
          console.log('✅ Tags filled successfully');
        } else {
          errors.push(`Tags: ${tagsResult.error}`);
        }
      }

      // Wait for form to stabilize
      await SquareDOMUtils.delay(this.waitTimes.short);

      const success = fieldsUpdated.length > 0;
      const duration = Date.now() - startTime;

      return {
        success,
        message: success 
          ? `SEO form filled successfully. Updated: ${fieldsUpdated.join(', ')}`
          : `Failed to update any fields. Errors: ${errors.join(', ')}`,
        data: {
          seoData,
          fieldsUpdated,
          validation: { valid: success, issues: errors }
        },
        duration
      };

    } catch (error) {
      return {
        success: false,
        error: `SEO form filling failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Fill tags using enhanced DOM interaction
   */
  private async fillTags(tags: string[]): Promise<InteractionResult> {
    try {
      console.log('🏷️ Filling tags:', tags);
      
      // Look for tag input field - try multiple selectors
      const tagInputSelectors = [
        'input[placeholder*="tag" i]',
        '.tag-input input',
        '[data-testid*="tag"] input',
        'input[name*="tag"]'
      ];

      let tagInputFound = false;
      
      for (const selector of tagInputSelectors) {
        const result = await SquareDOMUtils.findElement(selector, { timeout: 1000 });
        
        if (result.success && result.element) {
          tagInputFound = true;
          
          // Focus the input
          await SquareDOMUtils.safeClick(selector);
          
          // Add each tag
          for (const tag of tags) {
            // Type the tag
            await SquareDOMUtils.safeType(selector, tag, { clear: true });
            await SquareDOMUtils.delay(200);
            
            // Try to trigger tag addition (different methods depending on Square's implementation)
            const element = result.element as HTMLInputElement;
            
            // Method 1: Press Enter
            element.dispatchEvent(new KeyboardEvent('keydown', { 
              key: 'Enter', 
              code: 'Enter', 
              bubbles: true 
            }));
            
            await SquareDOMUtils.delay(300);
            
            // Method 2: Press Tab (alternative)
            element.dispatchEvent(new KeyboardEvent('keydown', { 
              key: 'Tab', 
              code: 'Tab', 
              bubbles: true 
            }));
            
            await SquareDOMUtils.delay(200);
            
            // Method 3: Click outside to trigger
            document.body.click();
            await SquareDOMUtils.delay(200);
          }
          
          break;
        }
      }

      if (!tagInputFound) {
        return {
          success: false,
          error: 'Tag input field not found. Tags may not be supported on this page.'
        };
      }

      return {
        success: true,
        element: undefined,
        duration: 0
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to fill tags: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Validate page context to ensure we're on the right page
   */
  private async validatePageContext(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check if we're on a Square page
      if (!window.location.hostname.includes('squareup.com')) {
        issues.push('Not on a Square page');
      }

      // Check if we're on an item detail/edit page
      const pageType = await squareEnvironment.detectCurrentPage();
      if (!pageType || !['item-edit', 'item-detail'].includes(pageType)) {
        issues.push('Not on an item edit page');
      }

      // Validate that required form elements are present
      const validation = await SquareSelectors.validatePage(selectors.itemDetail);
      if (!validation.valid) {
        issues.push(`Missing required elements: ${validation.missing.join(', ')}`);
      }

      // Check authentication
      const isAuthenticated = await squareEnvironment.checkAuthentication();
      if (!isAuthenticated) {
        issues.push('User not authenticated');
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
   * Save SEO changes with proper validation
   */
  private async saveSEOChanges(): Promise<InteractionResult> {
    try {
      console.log('💾 Saving SEO changes...');
      
      // Click the save button
      const saveResult = await SquareDOMUtils.safeClick(
        selectors.itemDetail.saveButton,
        { timeout: this.waitTimes.medium }
      );

      if (!saveResult.success) {
        return {
          success: false,
          error: `Save button click failed: ${saveResult.error}`
        };
      }

      // Wait for save operation to complete
      await SquareDOMUtils.delay(this.waitTimes.networkRequest);

      // Look for success indicators
      const successResult = await SquareDOMUtils.findElement(
        selectors.common.successMessage,
        { timeout: this.waitTimes.medium }
      );

      // Look for error indicators
      const errorResult = await SquareDOMUtils.findElement(
        selectors.common.errorMessage,
        { timeout: 1000 }
      );

      if (errorResult.success) {
        const errorText = await SquareDOMUtils.extractText(selectors.common.errorMessage);
        return {
          success: false,
          error: `Save failed: ${errorText.text || 'Unknown error'}`
        };
      }

      // If we have a success indicator, great!
      if (successResult.success) {
        return {
          success: true,
          element: successResult.element,
          duration: saveResult.duration
        };
      }

      // No clear success/error indicator - assume success if save button worked
      return {
        success: true,
        element: undefined,
        duration: saveResult.duration
      };

    } catch (error) {
      return {
        success: false,
        error: `Save operation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Generate optimized SEO content
   */
  private generateOptimizedSEO(data: {
    productName?: string;
    productDescription?: string;
    category?: string;
    keywords?: string[];
  }): SEOData {
    const { productName = '', productDescription = '', category, keywords = [] } = data;

    // Generate optimized title
    const title = this.optimizeTitle(productName);

    // Generate optimized description
    const description = this.optimizeDescription(productDescription || productName);

    // Generate tags
    const tags = this.generateTags(productName, category, keywords);

    // Generate meta content
    const metaTitle = this.generateMetaTitle(productName, category);
    const metaDescription = this.generateMetaDescription(description);

    // Generate URL slug
    const urlSlug = this.generateUrlSlug(productName);

    return {
      title,
      description,
      tags,
      metaTitle,
      metaDescription,
      urlSlug
    };
  }

  private optimizeTitle(title: string): string {
    return title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .slice(0, 70); // SEO best practice: keep under 70 characters
  }

  private optimizeDescription(description: string): string {
    if (description.length < 50) {
      description += ' Premium quality product with exceptional value and customer satisfaction.';
    }
    return description.slice(0, 500);
  }

  private generateTags(productName: string, category?: string, keywords: string[] = []): string[] {
    const tags = new Set<string>();
    
    if (category) tags.add(category.toLowerCase());
    keywords.forEach(keyword => tags.add(keyword.toLowerCase()));
    
    // Extract meaningful words from product name
    const words = productName.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3 && !['the', 'and', 'with', 'for'].includes(word)) {
        tags.add(word);
      }
    });
    
    return Array.from(tags).slice(0, 10);
  }

  private generateMetaTitle(productName: string, category?: string): string {
    const parts = [productName];
    if (category) parts.push(`- ${category}`);
    parts.push('| Store');
    
    return parts.join(' ').slice(0, 60);
  }

  private generateMetaDescription(description: string): string {
    const cleaned = description.replace(/\s+/g, ' ').trim();
    return cleaned.length > 155 ? cleaned.slice(0, 152) + '...' : cleaned;
  }

  private generateUrlSlug(productName: string): string {
    return productName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  }

  /**
   * Take a screenshot for debugging purposes
   */
  private async captureScreenshot(): Promise<string | null> {
    try {
      return await SquareDOMUtils.takeScreenshot();
    } catch (error) {
      console.warn('Screenshot failed:', error);
      return null;
    }
  }

  /**
   * Execute SEO update task
   */
  protected async executeTaskInternal(task: AgentTask): Promise<AgentResult> {
    switch (task.type) {
      case 'seo-update':
        return await this.handleSEOUpdate(task.data);
      
      default:
        return {
          success: false,
          error: `Unknown task type: ${task.type}`
        };
    }
  }

  /**
   * Main SEO update handler with comprehensive error handling
   */
  async handleSEOUpdate(data: {
    seoData?: SEOData;
    itemId?: string;
    generateContent?: boolean;
    productName?: string;
    productDescription?: string;
    category?: string;
    keywords?: string[];
  }): Promise<SEOUpdateResult> {
    const startTime = Date.now();
    
    try {
      console.log('🎯 Starting SEO update operation:', data);
      
      // Validate environment safety
      if (!squareEnvironment.isSafeForTesting() && !squareEnvironment.shouldConfirmOperation('write')) {
        return {
          success: false,
          error: 'Operation blocked by safety settings. Enable test mode or confirm destructive operations.'
        };
      }

      // Validate page context
      const pageValidation = await this.validatePageContext();
      if (!pageValidation.valid) {
        return {
          success: false,
          error: `Page validation failed: ${pageValidation.issues.join(', ')}`,
          data: { validation: pageValidation }
        };
      }

      // Generate SEO content if requested
      let seoData = data.seoData;
      if (data.generateContent || !seoData) {
        seoData = this.generateOptimizedSEO({
          productName: data.productName,
          productDescription: data.productDescription,
          category: data.category,
          keywords: data.keywords
        });
        console.log('🔄 Generated SEO content:', seoData);
      }

      // Fill the SEO form
      const fillResult = await this.fillSEOForm(seoData);
      if (!fillResult.success) {
        return fillResult;
      }

      // Save changes
      const saveResult = await this.saveSEOChanges();
      if (!saveResult.success) {
        return {
          success: false,
          error: `Failed to save changes: ${saveResult.error}`,
          data: { ...fillResult.data }
        };
      }

      // Capture screenshot for debugging
      const screenshot = await this.captureScreenshot();

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: `SEO update completed successfully in ${duration}ms`,
        data: {
          seoData,
          itemId: data.itemId,
          validation: pageValidation,
          fieldsUpdated: fillResult.data?.fieldsUpdated || [],
          screenshot
        },
        duration
      };

    } catch (error) {
      return {
        success: false,
        error: `SEO update failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime
      };
    }
  }
}
