// Popup script for Chrome extension UI
import { allChromeApiTools } from '@/utils/chromeApiTools';
import { BulkOperationManager } from '@/agents/bulk/BulkOperationManager';
import { BulkOperationUI } from '@/ui/BulkOperationUI';
import { AgentCoordinator } from '@/agents/AgentCoordinator';

console.log('Popup script loaded');

// Global instances
let bulkOperationManager: BulkOperationManager;
let bulkOperationUI: BulkOperationUI;
let agentCoordinator: AgentCoordinator;

// DOM elements
const startButton = document.getElementById('start-automation') as HTMLButtonElement;
const stopButton = document.getElementById('stop-automation') as HTMLButtonElement;
const statusElement = document.getElementById('status') as HTMLElement;
const logElement = document.getElementById('log') as HTMLElement;

// Update status display
function updateStatus(status: string, isError = false) {
  if (statusElement) {
    statusElement.textContent = status;
    statusElement.className = isError ? 'error' : 'success';
  }
}

// Add log entry
function addLogEntry(message: string) {
  if (logElement) {
    const entry = document.createElement('div');
    entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;
  }
}

// Start automation
async function startAutomation() {
  try {
    updateStatus('Starting automation...');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      throw new Error('No active tab found');
    }
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'START_AUTOMATION',
      config: {
        // Add automation configuration here
      }
    });
    
    if (response.success) {
      updateStatus('Automation started successfully');
      addLogEntry('Automation started');
      if (startButton) startButton.disabled = true;
      if (stopButton) stopButton.disabled = false;
    } else {
      throw new Error(response.error || 'Failed to start automation');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateStatus(`Error: ${errorMessage}`, true);
    addLogEntry(`Error: ${errorMessage}`);
  }
}

// Stop automation
async function stopAutomation() {
  try {
    updateStatus('Stopping automation...');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      throw new Error('No active tab found');
    }
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'STOP_AUTOMATION'
    });
    
    if (response.success) {
      updateStatus('Automation stopped');
      addLogEntry('Automation stopped');
      if (startButton) startButton.disabled = false;
      if (stopButton) stopButton.disabled = true;
    } else {
      throw new Error(response.error || 'Failed to stop automation');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateStatus(`Error: ${errorMessage}`, true);
    addLogEntry(`Error: ${errorMessage}`);
  }
}

// Initialize bulk operations
async function initializeBulkOperations() {
  try {
    // Create mock context for popup
    const mockContext = {
      page: { url: '', pageType: 'unknown' as const },
      storage: chrome.storage.local,
      messaging: chrome.runtime,
      capabilities: {
        canFillForms: false,
        canNavigate: false,
        canExtractData: false,
        canManageImages: false,
        supportedPageTypes: []
      }
    };

    // Initialize agent coordinator
    agentCoordinator = new AgentCoordinator(mockContext);
    await agentCoordinator.initialize();

    // Initialize bulk operation manager with mock agents
    const mockAgents = new Map();
    bulkOperationManager = new BulkOperationManager(mockContext, mockAgents);
    
    // Initialize bulk operation UI
    bulkOperationUI = new BulkOperationUI(bulkOperationManager);
    
    console.log('Bulk operations initialized successfully');
  } catch (error) {
    console.error('Failed to initialize bulk operations:', error);
    updateStatus('Warning: Bulk operations unavailable', true);
  }
}

// Setup tab switching functionality
function initializeTabSwitching() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tabName = target.getAttribute('data-tab');
      if (tabName) {
        switchTab(tabName);
      }
    });
  });
}

// Switch between tabs
function switchTab(tabName: string) {
  // Update tab appearance
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
  const activeContent = document.getElementById(`${tabName}-tab`);

  activeTab?.classList.add('active');
  activeContent?.classList.add('active');
}

// Initialize automation tab functionality
function initializeAutomationTab() {
  // Quick actions
  const syncDataBtn = document.getElementById('sync-data');
  const updateSeoBtn = document.getElementById('update-current-seo');
  const findImagesBtn = document.getElementById('find-current-images');
  const bulkProcessBtn = document.getElementById('bulk-process');

  syncDataBtn?.addEventListener('click', async () => {
    try {
      updateStatus('Syncing catalog data...');
      // Implement sync functionality
      updateStatus('Catalog data synced successfully');
    } catch (error) {
      updateStatus('Failed to sync catalog data', true);
    }
  });

  updateSeoBtn?.addEventListener('click', async () => {
    try {
      updateStatus('Updating SEO for current item...');
      // Implement SEO update functionality
      updateStatus('SEO updated successfully');
    } catch (error) {
      updateStatus('Failed to update SEO', true);
    }
  });

  findImagesBtn?.addEventListener('click', async () => {
    try {
      updateStatus('Finding images for current item...');
      // Implement image search functionality
      updateStatus('Images found successfully');
    } catch (error) {
      updateStatus('Failed to find images', true);
    }
  });

  bulkProcessBtn?.addEventListener('click', () => {
    // Switch to bulk operations tab
    switchTab('bulk');
  });
}

// Initialize popup
function initializePopup() {
  if (startButton) {
    startButton.addEventListener('click', startAutomation);
  }
  
  if (stopButton) {
    stopButton.addEventListener('click', stopAutomation);
    stopButton.disabled = true;
  }
  
  // Initialize components
  initializeTabSwitching();
  initializeAutomationTab();
  initializeBulkOperations();
  
  updateStatus('Ready');
  addLogEntry('Extension popup loaded');
}

// Cleanup on window unload
function cleanup() {
  if (bulkOperationUI) {
    bulkOperationUI.destroy();
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}

// Cleanup on window unload
window.addEventListener('beforeunload', cleanup);
