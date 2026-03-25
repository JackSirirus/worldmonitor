/**
 * Task Logs Viewer Component
 * Displays execution logs for a specific task
 */

import { escapeHtml } from '@/utils/sanitize';
import { t } from '@/i18n';

interface LogEntry {
  taskId: string;
  sessionId: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export class TaskLogsViewer {
  private modal: HTMLDivElement | null = null;
  private taskId: string = '';
  private logs: LogEntry[] = [];

  constructor(taskId?: string) {
    if (taskId) {
      this.taskId = taskId;
    }
  }

  private async loadLogs(taskId: string): Promise<void> {
    try {
      const response = await fetch(`/api/agent/tasks/${taskId}/logs?limit=100`);
      const data = await response.json();

      if (data.success) {
        this.logs = data.logs;
      }
    } catch (err) {
      console.error('[TaskLogsViewer] Failed to load logs:', err);
    }
  }

  private renderLogEntry(log: LogEntry): string {
    const levelClass = `log-${log.level}`;
    const time = new Date(log.timestamp).toLocaleTimeString();

    return `
      <div class="log-entry ${levelClass}">
        <span class="log-time">${time}</span>
        <span class="log-level">${log.level.toUpperCase()}</span>
        <span class="log-message">${escapeHtml(log.message)}</span>
      </div>
    `;
  }

  public async show(taskId: string): Promise<void> {
    this.taskId = taskId;
    await this.loadLogs(taskId);

    if (this.modal) {
      this.modal.remove();
    }

    this.modal = document.createElement('div');
    this.modal.className = 'modal-overlay';
    this.modal.innerHTML = `
      <div class="modal-content task-logs-modal">
        <div class="modal-header">
          <h3>${t('agent.taskLogs')}: ${taskId}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="logs-container">
            ${this.logs.length === 0
              ? `<p class="no-logs">${t('agent.noLogs')}</p>`
              : this.logs.map(log => this.renderLogEntry(log)).join('')
            }
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-refresh-logs">${t('buttons.refresh')}</button>
          <button class="btn-close">${t('modal.close')}</button>
        </div>
      </div>
    `;

    // Event handlers
    this.modal.querySelector('.modal-close')?.addEventListener('click', () => this.hide());
    this.modal.querySelector('.btn-close')?.addEventListener('click', () => this.hide());
    this.modal.querySelector('.btn-refresh-logs')?.addEventListener('click', () => {
      this.loadLogs(this.taskId).then(() => this.renderLogs());
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    document.body.appendChild(this.modal);
    setTimeout(() => this.modal?.classList.add('visible'), 10);
  }

  private renderLogs(): void {
    const container = this.modal?.querySelector('.logs-container');
    if (!container) return;

    if (this.logs.length === 0) {
      container.innerHTML = `<p class="no-logs">${t('agent.noLogs')}</p>`;
      return;
    }

    container.innerHTML = this.logs.map(log => this.renderLogEntry(log)).join('');
  }

  public hide(): void {
    if (this.modal) {
      this.modal.classList.remove('visible');
      setTimeout(() => this.modal?.remove(), 200);
      this.modal = null;
    }
  }
}

export default TaskLogsViewer;
