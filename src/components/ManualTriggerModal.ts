/**
 * Manual Trigger Modal Component
 * Allows users to manually trigger agent tasks
 */

import { t } from '@/i18n';

export class ManualTriggerModal {
  private modal: HTMLDivElement | null = null;
  private isVisible = false;
  private onTrigger: ((task: string) => void) | null = null;

  constructor(onTrigger?: (task: string) => void) {
    this.onTrigger = onTrigger || null;
  }

  private createModal(): void {
    if (this.modal) return;

    this.modal = document.createElement('div');
    this.modal.className = 'modal-overlay';
    this.modal.innerHTML = `
      <div class="modal-content manual-trigger-modal">
        <div class="modal-header">
          <h3>${t('agent.manualTrigger')}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">${t('agent.selectTask')}</p>
          <div class="task-buttons">
            <button class="task-btn" data-task="rss-collector">
              <span class="task-icon">📥</span>
              <span class="task-name">${t('agent.rssCollector')}</span>
              <span class="task-desc">${t('agent.rssCollectorDesc')}</span>
            </button>
            <button class="task-btn" data-task="generate-tech">
              <span class="task-icon">📊</span>
              <span class="task-name">${t('agent.generateTech')}</span>
              <span class="task-desc">${t('agent.generateTechDesc')}</span>
            </button>
            <button class="task-btn" data-task="generate-world">
              <span class="task-icon">🌍</span>
              <span class="task-name">${t('agent.generateWorld')}</span>
              <span class="task-desc">${t('agent.generateWorldDesc')}</span>
            </button>
            <button class="task-btn" data-task="generate-weekly">
              <span class="task-icon">📈</span>
              <span class="task-name">${t('agent.generateWeekly')}</span>
              <span class="task-desc">${t('agent.generateWeeklyDesc')}</span>
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel">${t('modal.cancel')}</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
    document.body.appendChild(this.modal);
  }

  private attachEventListeners(): void {
    if (!this.modal) return;

    // Close button
    const closeBtn = this.modal.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Cancel button
    const cancelBtn = this.modal.querySelector('.btn-cancel');
    cancelBtn?.addEventListener('click', () => this.hide());

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Task buttons
    const taskButtons = this.modal.querySelectorAll('.task-btn');
    taskButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const task = (e.currentTarget as HTMLElement).dataset.task;
        if (task) {
          await this.handleTaskTrigger(task);
        }
      });
    });
  }

  private async handleTaskTrigger(task: string): Promise<void> {
    const btn = this.modal?.querySelector(`[data-task="${task}"]`) as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="task-icon">⏳</span><span class="task-name">${t('agent.running')}</span>`;
    }

    try {
      if (this.onTrigger) {
        this.onTrigger(task);
      } else {
        // Default API call
        const endpoint = task.startsWith('generate-')
          ? `/api/reports/generate/${task.replace('generate-', '')}`
          : `/api/agent/trigger/${task}`;

        const response = await fetch(endpoint, { method: 'POST' });
        if (!response.ok) {
          throw new Error('Trigger failed');
        }
      }

      this.hide();
    } catch (err) {
      console.error('[ManualTriggerModal] Trigger failed:', err);
      alert(t('agent.triggerFailed'));
    } finally {
      if (btn) {
        btn.disabled = false;
      }
    }
  }

  public show(): void {
    this.createModal();
    this.isVisible = true;
    this.modal?.classList.add('visible');
  }

  public hide(): void {
    this.isVisible = false;
    this.modal?.classList.remove('visible');
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public isModalVisible(): boolean {
    return this.isVisible;
  }
}

export default ManualTriggerModal;
