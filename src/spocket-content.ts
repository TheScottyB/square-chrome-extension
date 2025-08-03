// Content script for Spocket integration
import { SpocketAgent } from '@/agents/spocketAgent';

console.log('Spocket content script loaded');

// Initialize the Spocket agent
const spocketAgent = new SpocketAgent();

// Set up communication with background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Spocket content script received message:', message);
  
  if (message.type === 'EXTRACT_PRODUCT_DATA') {
    spocketAgent.extractProductData()
      .then((result: any) => {
        sendResponse({ success: true, data: result });
      })
      .catch((error: any) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
  
  if (message.type === 'DOWNLOAD_IMAGES') {
    spocketAgent.downloadProductImages(message.productData)
      .then((result: any) => {
        sendResponse({ success: true, result });
      })
      .catch((error: any) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

// Initialize Spocket content script
async function initializeSpocketContentScript() {
  try {
    await spocketAgent.initialize();
    console.log('Spocket content script initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Spocket content script:', error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSpocketContentScript);
} else {
  initializeSpocketContentScript();
}
