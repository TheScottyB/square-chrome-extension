import { BulkOperationUIState } from './BulkOperationStateManager';
import { BulkOperationItem } from '@/agents/types';

export class BulkOperationDisplayManager {
  constructor() {}

  public updateDisplay(state: BulkOperationUIState): void {
    this.updateStats(state.stats);
    this.updateOperationState(state);
    this.updateQueueDisplay(state.queue);
    this.updateErrorDisplay(state.errors);
  }

  public updateStats(stats: BulkOperationUIState['stats']): void {
    this.setElementText('bulk-queue-count', stats.queued.toString());
    this.setElementText('bulk-completed-count', stats.completed.toString());
    this.setElementText('bulk-failed-count', stats.failed.toString());
    this.setElementText('bulk-active-count', stats.active.toString());
  }

  public updateOperationState(state: BulkOperationUIState): void {
    const activeElement = this.getElementById('bulk-operation-active');
    const idleElement = this.getElementById('bulk-operation-idle');

    if (state.isActive && state.currentOperation) {
      activeElement?.classList.remove('hidden');
      idleElement?.classList.add('hidden');

      const operation = state.currentOperation;
      this.setElementText('bulk-operation-type', operation.type);
      this.setElementText('bulk-operation-status', operation.status);
      this.setElementText('bulk-execution-strategy', operation.executionStrategy);

      // Update progress
      const progressPercent = operation.total > 0 ? 
        Math.round((operation.progress / operation.total) * 100) : 0;
      
      const progressBar = this.getElementById('bulk-progress-bar') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
        
        // Update progress bar color based on status
        if (operation.status === 'running') {
          progressBar.style.backgroundColor = '#4CAF50'; // Green for running
        } else if (operation.status === 'paused') {
          progressBar.style.backgroundColor = '#FF9800'; // Orange for paused
        } else if (operation.status === 'failed') {
          progressBar.style.backgroundColor = '#F44336'; // Red for failed
        } else if (operation.status === 'completed') {
          progressBar.style.backgroundColor = '#2196F3'; // Blue for completed
        }
      }

      this.setElementText('bulk-progress-text', 
        `${progressPercent}% (${operation.progress}/${operation.total} completed)`);

      this.updateOperationControls(state);
    } else {
      activeElement?.classList.add('hidden');
      idleElement?.classList.remove('hidden');
    }
  }

  public updateOperationControls(state: BulkOperationUIState): void {
    const pauseBtn = this.getElementById('bulk-pause');
    const resumeBtn = this.getElementById('bulk-resume');
    const cancelBtn = this.getElementById('bulk-cancel');

    if (!state.currentOperation) {
      pauseBtn?.classList.add('hidden');
      resumeBtn?.classList.add('hidden');
      cancelBtn?.classList.add('hidden');
      return;
    }

    const status = state.currentOperation.status;
    
    if (status === 'running') {
      pauseBtn?.classList.remove('hidden');
      resumeBtn?.classList.add('hidden');
    } else if (status === 'paused') {
      pauseBtn?.classList.add('hidden');
      resumeBtn?.classList.remove('hidden');
    } else {
      pauseBtn?.classList.add('hidden');
      resumeBtn?.classList.add('hidden');
    }

    cancelBtn?.classList.remove('hidden');
  }

  public updateQueueDisplay(queue: BulkOperationItem[]): void {
    const queueList = this.getElementById('bulk-queue-list');
    const queueSummary = this.getElementById('bulk-queue-summary');

    if (!queueList || !queueSummary) return;

    if (queue.length === 0) {
      queueList.textContent = 'No tasks in queue';
      queueSummary.textContent = 'Queue is empty';
      return;
    }

    const summary = `${queue.length} tasks in queue`;
    queueSummary.textContent = summary;

    // Display queue items (only first 10)
    queueList.innerHTML = queue.slice(0, 10).map(task => {
      const statusIcon = this.getStatusIcon('unknown');
      const statusClass = 'unknown';
      
      return `
        <div class="bulk-queue-item ${statusClass}">
          <span class="status-icon">${statusIcon}</span>
          <span>Task ID: ${task.id || 'Unknown'}</span>
        </div>
      `;
    }).join('');

    if (queue.length > 10) {
      queueList.innerHTML += `<div class="bulk-queue-item">... and ${queue.length - 10} more</div>`;
    }
  }

  public updateErrorDisplay(errors: BulkOperationUIState['errors']): void {
    const errorSummary = this.getElementById('bulk-error-summary');
    const noErrors = this.getElementById('bulk-no-errors');
    const errorList = this.getElementById('bulk-error-list');
    const errorCount = this.getElementById('bulk-error-count');

    if (errors.length === 0) {
      errorSummary?.classList.add('hidden');
      noErrors?.classList.remove('hidden');
      return;
    }

    errorSummary?.classList.remove('hidden');
    noErrors?.classList.add('hidden');

    if (errorCount) {
      errorCount.textContent = `${errors.length} error${errors.length !== 1 ? 's' : ''}`;
    }

    if (errorList) {
      errorList.innerHTML = errors.slice(0, 5).map(error => `
        <div class="bulk-error-item">
          <div class="error-message">${error.message}</div>
          <div class="error-details">Task: ${error.taskId} | ${error.timestamp.toLocaleTimeString()}</div>
        </div>
      `).join('');
    }
  }

  public switchTab(tabName: string): void {
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

  private getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      case 'paused': return '⏸️';
      case 'pending': return '⏳';
      default: return '❓';
    }
  }

  private getElementById(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  private setElementText(id: string, text: string): void {
    const element = this.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }
}
