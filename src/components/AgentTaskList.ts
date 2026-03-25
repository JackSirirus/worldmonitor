/**
 * Agent Task List Component
 * Displays task execution history with real-time updates
 */

import { escapeHtml } from '@/utils/sanitize';
import { t } from '@/i18n';
import agentWs from '@/services/agent-ws';

interface Task {
  id: number;
  task_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export class AgentTaskList {
  private element: HTMLElement | null = null;
  private tasks: Task[] = [];
  private refreshInterval: number | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.loadTasks();
    this.subscribeToUpdates();
  }

  private async loadTasks(): Promise<void> {
    try {
      const response = await fetch('/api/agent/tasks?limit=20');
      const data = await response.json();

      if (data.success) {
        this.tasks = data.tasks;
        this.render();
      }
    } catch (err) {
      console.error('[AgentTaskList] Failed to load tasks:', err);
    }
  }

  private subscribeToUpdates(): void {
    // Subscribe to WebSocket/polling updates
    this.unsubscribe = agentWs.subscribe((event) => {
      if (event.type === 'task-update' || event.type === 'task-complete') {
        this.loadTasks();
      }
    });

    // Auto-refresh every 30 seconds
    this.refreshInterval = window.setInterval(() => {
      this.loadTasks();
    }, 30000);
  }

  private render(): void {
    if (!this.element) return;

    if (this.tasks.length === 0) {
      this.element.innerHTML = `
        <div class="task-list-empty">
          <p>${t('agent.noTasks')}</p>
        </div>
      `;
      return;
    }

    this.element.innerHTML = `
      <div class="task-list">
        ${this.tasks.map(task => this.renderTask(task)).join('')}
      </div>
    `;
  }

  private renderTask(task: Task): string {
    const statusClass = this.getStatusClass(task.status);
    const typeLabel = this.getTypeLabel(task.task_type);
    const time = this.formatTime(task.created_at);

    return `
      <div class="task-item ${statusClass}">
        <div class="task-header">
          <span class="task-type">${escapeHtml(typeLabel)}</span>
          <span class="task-status ${statusClass}">${t(`agent.taskStatus.${task.status}`)}</span>
        </div>
        <div class="task-meta">
          <span class="task-time">${time}</span>
          ${task.error_message ? `<span class="task-error">${escapeHtml(task.error_message)}</span>` : ''}
        </div>
      </div>
    `;
  }

  private getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'running': return 'status-running';
      case 'failed': return 'status-failed';
      default: return 'status-pending';
    }
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'rss-collector': 'RSS Collection',
      'report-tech': 'Tech Report',
      'report-world': 'World Report',
      'report-weekly': 'Weekly Report',
      'cleanup': 'Cleanup',
      'backup': 'Backup',
    };
    return labels[type] || type;
  }

  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return t('time.justNow');
    if (diff < 3600000) return t('time.minutesAgo', { n: Math.floor(diff / 60000) });
    if (diff < 86400000) return t('time.hoursAgo', { n: Math.floor(diff / 3600000) });

    return date.toLocaleDateString();
  }

  public getElement(): HTMLElement {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = 'agent-task-list';
      this.render();
    }
    return this.element;
  }

  public refresh(): void {
    this.loadTasks();
  }

  public destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.element) {
      this.element.remove();
    }
  }
}

export default AgentTaskList;
