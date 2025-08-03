import { AgentManager } from '@/agents/AgentManager';
import { getOpenAIApiKey } from '@/utils/apiKeyManager';

// Message listener for communication with content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  switch (message.action) {
    case 'agentCoordinatorReady':
      console.log(`✅ Agent Coordinator ready with ${message.agentCount} agents on ${message.pageContext?.pageType || 'unknown'} page`);
      sendResponse({ success: true, message: 'Notification received' });
      break;
      
    case 'getApiKey':
      getOpenAIApiKey().then(apiKey => {
        sendResponse({ success: true, apiKey });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // Will respond asynchronously
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return false; // Synchronous response
});

(async () => {
  try {
    const apiKey = await getOpenAIApiKey();
    if (apiKey) {
      const config = { apiKey };
      const agentManager = new AgentManager();
      await agentManager.createAgent('square-automation', config);
      await agentManager.createAgent('spocket-extraction', config);

      console.log('OpenAI agents initialized');
    } else {
      console.log('No OpenAI API key found in storage. Please set it first.');
    }
  } catch (error) {
    console.error('Failed to initialize OpenAI agents:', error);
  }
})();

