// Injected script for direct Square dashboard interaction
// This script runs in the page context with access to page variables

console.log('Injected script loaded in Square dashboard');

// Interface for communicating with content script
interface SquarePageData {
  itemCount?: number;
  currentItem?: any;
  catalogData?: any[];
}

// Function to extract current item data from Square dashboard
function extractCurrentItemData() {
  try {
    // This would need to be customized based on Square's actual DOM structure
    const itemNameElement = document.querySelector('[data-testid="item-name"]');
    const itemPriceElement = document.querySelector('[data-testid="item-price"]');
    const itemDescriptionElement = document.querySelector('[data-testid="item-description"]');
    
    if (itemNameElement) {
      return {
        name: itemNameElement.textContent?.trim(),
        price: itemPriceElement?.textContent?.trim(),
        description: itemDescriptionElement?.textContent?.trim(),
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error extracting current item data:', error);
  }
  return null;
}

// Function to extract catalog data from Square dashboard
function extractCatalogData() {
  try {
    // This would need to be customized based on Square's actual DOM structure
    const itemElements = document.querySelectorAll('[data-testid="catalog-item"]');
    const catalogData: any[] = [];
    
    itemElements.forEach((element, index) => {
      const nameElement = element.querySelector('[data-testid="item-name"]');
      const priceElement = element.querySelector('[data-testid="item-price"]');
      
      if (nameElement) {
        catalogData.push({
          id: index,
          name: nameElement.textContent?.trim(),
          price: priceElement?.textContent?.trim(),
          element: element // Reference to DOM element
        });
      }
    });
    
    return catalogData;
  } catch (error) {
    console.error('Error extracting catalog data:', error);
  }
  return [];
}

// Listen for messages from content script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === 'EXTRACT_CURRENT_ITEM') {
    const itemData = extractCurrentItemData();
    window.postMessage({
      type: 'CURRENT_ITEM_DATA',
      data: itemData
    }, '*');
  }
  
  if (event.data.type === 'EXTRACT_CATALOG_DATA') {
    const catalogData = extractCatalogData();
    window.postMessage({
      type: 'CATALOG_DATA',
      data: catalogData
    }, '*');
  }
  
  if (event.data.type === 'UPDATE_ITEM_SEO') {
    // This would implement SEO updates
    console.log('SEO update requested:', event.data.seoData);
    window.postMessage({
      type: 'SEO_UPDATE_COMPLETE',
      data: { success: true }
    }, '*');
  }
});

// Monitor for page changes (SPA navigation)
let currentUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    window.postMessage({
      type: 'PAGE_CHANGED',
      data: { url: currentUrl }
    }, '*');
  }
});

urlObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Signal that injected script is ready
window.postMessage({
  type: 'INJECTED_SCRIPT_READY',
  data: { timestamp: new Date().toISOString() }
}, '*');
