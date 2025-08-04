/**
 * Background Service Worker for Square Chrome Extension
 * Handles message passing between popup, content scripts, and agents
 */

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 Square Chrome Extension installed/updated');
  
  // Set default settings
  chrome.storage.sync.set({
    settings: {
      testMode: true,
      debugMode: true,
      autoSync: false
    }
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message);
  
  handleMessage(message, sender, sendResponse);
  
  // Return true to indicate async response
  return true;
});

async function handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: Function) {
  try {
    switch (message.action) {
      case 'getAgentStatus':
        const status = await getAgentStatus();
        sendResponse(status);
        break;
        
      case 'executeAction':
        const result = await executeAgentAction(message.data);
        sendResponse(result);
        break;
        
      case 'openSettings':
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
        break;
        
      case 'checkSquarePage':
        const isSquare = await checkIfSquarePage(sender.tab?.id);
        sendResponse({ isSquarePage: isSquare });
        break;
        
      default:
        // Forward to content script if it's an agent operation
        if (message.action.startsWith('execute')) {
          forwardToContentScript(message, sender.tab?.id, sendResponse);
        } else {
          sendResponse({ success: false, error: 'Unknown action' });
        }
    }
  } catch (error) {
    console.error('❌ Background script error:', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

async function getAgentStatus(): Promise<any> {
  // Query active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.id) {
    return {
      connected: false,
      agents: {},
      error: 'No active tab'
    };
  }
  
  // Check if on Square page
  const isSquarePage = tab.url?.includes('squareup.com') || false;
  
  if (!isSquarePage) {
    return {
      connected: false,
      agents: {},
      error: 'Not on a Square page'
    };
  }
  
  // Get status from content script
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id!, { action: 'getEnhancedStatus' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({
          connected: false,
          agents: {},
          error: chrome.runtime.lastError.message
        });
      } else {
        resolve({
          connected: true,
          ...response
        });
      }
    });
  });
}

async function executeAgentAction(data: any): Promise<any> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.id) {
    return { success: false, error: 'No active tab' };
  }
  
  return new Promise((resolve) => {
    // Map action to appropriate message
    const messageMap: Record<string, any> = {
      'optimize-seo': {
        action: 'executeEnhancedSEO',
        operation: { type: 'optimize', data: { generateContent: true } }
      },
      'bulk-seo': {
        action: 'executeEnhancedWorkflow',
        workflow: {
          name: 'Bulk SEO Update',
          steps: [
            {
              agentType: 'catalog',
              operation: 'extract',
              data: { itemLimit: 10 }
            },
            {
              agentType: 'seo',
              operation: 'bulk-update',
              data: { generateContent: true }
            }
          ]
        }
      },
      'go-catalog': {
        action: 'executeEnhancedNavigation',
        operation: { type: 'navigate', data: { type: 'catalog' } }
      },
      'search-items': {
        action: 'executeEnhancedNavigation',
        operation: { type: 'search', data: { searchTerm: prompt('Enter search term:') || '' } }
      },
      'sync-catalog': {
        action: 'executeEnhancedCatalog',
        operation: { type: 'sync', data: { syncMode: 'partial' } }
      },
      'extract-data': {
        action: 'executeEnhancedCatalog',
        operation: { type: 'extract', data: { includeInventory: true, includePricing: true } }
      }
    };
    
    const message = messageMap[data.action];
    
    if (!message) {
      resolve({ success: false, error: 'Unknown action' });
      return;
    }
    
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

function forwardToContentScript(message: any, tabId: number | undefined, sendResponse: Function) {
  if (!tabId) {
    sendResponse({ success: false, error: 'No tab ID' });
    return;
  }
  
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      sendResponse({ 
        success: false, 
        error: chrome.runtime.lastError.message 
      });
    } else {
      sendResponse(response);
    }
  });
}

async function checkIfSquarePage(tabId: number | undefined): Promise<boolean> {
  if (!tabId) return false;
  
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.url?.includes('squareup.com') || false;
  } catch (error) {
    return false;
  }
}

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('squareup.com')) {
    try {
      // Check if content script is already injected
      const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' }).catch(() => null);
      
      if (!response) {
        // Inject content script
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        });
        console.log('✅ Content script injected into Square page');
      }
    } catch (error) {
      console.error('Failed to inject content script:', error);
    }
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup (this is handled by manifest.json default_popup)
});

// Keep service worker alive by setting up periodic alarm
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Perform a simple operation to keep the service worker active
    chrome.storage.local.get('heartbeat', (data) => {
      chrome.storage.local.set({ heartbeat: Date.now() });
    });
  }
});

// Export for testing
export { handleMessage, getAgentStatus, executeAgentAction };
