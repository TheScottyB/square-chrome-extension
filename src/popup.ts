// Popup script for Chrome extension UI
import { allChromeApiTools } from '@/utils/chromeApiTools';

console.log('Popup script loaded');

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

// Initialize popup
function initializePopup() {
  if (startButton) {
    startButton.addEventListener('click', startAutomation);
  }
  
  if (stopButton) {
    stopButton.addEventListener('click', stopAutomation);
    stopButton.disabled = true;
  }
  
  updateStatus('Ready');
  addLogEntry('Extension popup loaded');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}
