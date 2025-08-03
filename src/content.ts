// Content script for Square dashboard automation
import { AgentManager } from '@/agents/AgentManager';
import { allChromeApiTools } from '@/utils/chromeApiTools';

console.log('Square content script loaded');

// Initialize the agent manager for Square automation
const agentManager = new AgentManager();

// Set up communication with background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === 'START_AUTOMATION') {
    agentManager.startAutomation(message.config)
      .then((result: any) => {
        sendResponse({ success: true, result });
      })
      .catch((error: any) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
  
  if (message.type === 'STOP_AUTOMATION') {
    agentManager.stopAutomation();
    sendResponse({ success: true });
  }
});

// Initialize content script
async function initializeContentScript() {
  try {
    await agentManager.initialize();
    console.log('Square content script initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Square content script:', error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}
