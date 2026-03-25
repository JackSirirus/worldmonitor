/**
 * Agent Config Modal Component
 * Allows users to view and configure agent job schedules dynamically
 */

import { t } from '@/i18n';

interface AgentJob {
  id: number;
  name: string;
  job_type: string;
  enabled: boolean;
  schedule: string | null;
  payload: Record<string, unknown> | null;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
}

export class AgentConfigModal {
  private modal: HTMLDivElement | null = null;
  private jobs: AgentJob[] = [];

  constructor() {
    // No initialization needed, modal is created on show
  }

  show(): void {
    this.createModal();
    this.loadJobs();
    this.modal!.classList.add('active');
  }

  hide(): void {
    if (this.modal) {
      this.modal.classList.remove('active');
    }
  }

  private createModal(): void {
    if (this.modal) return;

    this.modal = document.createElement('div');
    this.modal.className = 'modal-overlay';
    this.modal.innerHTML = `
      <div class="modal-content agent-config-modal">
        <div class="modal-header">
          <h3>${t('agent.configTitle')}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="config-loading">${t('common.loading')}</div>
          <div class="config-jobs-list" style="display: none;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel">${t('modal.close')}</button>
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
  }

  private async loadJobs(): Promise<void> {
    if (!this.modal) return;

    const loadingEl = this.modal.querySelector('.config-loading') as HTMLElement;
    const listEl = this.modal.querySelector('.config-jobs-list') as HTMLElement;

    try {
      const response = await fetch('/api/agent/jobs');
      const data = await response.json();

      if (data.success && data.jobs) {
        this.jobs = data.jobs;
        this.renderJobs(listEl, loadingEl);
      } else {
        loadingEl.textContent = t('agent.loadFailed');
      }
    } catch (error) {
      console.error('[AgentConfigModal] Failed to load jobs:', error);
      loadingEl.textContent = t('agent.loadFailed');
    }
  }

  private renderJobs(listEl: HTMLElement, loadingEl: HTMLElement): void {
    loadingEl.style.display = 'none';
    listEl.style.display = 'block';

    if (this.jobs.length === 0) {
      listEl.innerHTML = `<p class="no-jobs">${t('agent.noJobs')}</p>`;
      return;
    }

    listEl.innerHTML = this.jobs.map(job => this.renderJobCard(job)).join('');

    // Attach event listeners for toggle switches
    listEl.querySelectorAll('.job-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const jobId = parseInt(target.dataset.jobId || '0');
        this.toggleJob(jobId, target.checked);
      });
    });
  }

  private renderJobCard(job: AgentJob): string {
    const jobName = this.getJobDisplayName(job.job_type);
    const scheduleDisplay = job.schedule || t('agent.manualOnly');

    return `
      <div class="job-card" data-job-id="${job.id}">
        <div class="job-header">
          <div class="job-info">
            <h4 class="job-name">${jobName}</h4>
            <span class="job-type">${job.job_type}</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" class="job-toggle" data-job-id="${job.id}" ${job.enabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="job-details">
          <div class="detail-row">
            <span class="detail-label">${t('agent.schedule')}:</span>
            <span class="detail-value">${scheduleDisplay}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t('agent.lastRun')}:</span>
            <span class="detail-value">${job.last_run ? new Date(job.last_run).toLocaleString() : t('agent.never')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t('agent.nextRun')}:</span>
            <span class="detail-value">${job.next_run ? new Date(job.next_run).toLocaleString() : '-'}</span>
          </div>
        </div>
      </div>
    `;
  }

  private getJobDisplayName(jobType: string): string {
    const names: Record<string, string> = {
      'rss-collector': t('agent.rssCollector'),
      'report-tech': t('agent.reportTech'),
      'report-world': t('agent.reportWorld'),
      'report-weekly': t('agent.reportWeekly'),
      'cleanup': t('agent.cleanup'),
      'backup': t('agent.backup'),
      'clustering': t('agent.clustering'),
    };
    return names[jobType] || jobType;
  }

  private async toggleJob(jobId: number, enabled: boolean): Promise<void> {
    try {
      const response = await fetch(`/api/agent/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error('[AgentConfigModal] Failed to toggle job:', data.error);
        // Revert toggle on error
        const toggle = document.querySelector(`.job-toggle[data-job-id="${jobId}"]`) as HTMLInputElement;
        if (toggle) toggle.checked = !enabled;
      }
    } catch (error) {
      console.error('[AgentConfigModal] Failed to toggle job:', error);
      // Revert toggle on error
      const toggle = document.querySelector(`.job-toggle[data-job-id="${jobId}"]`) as HTMLInputElement;
      if (toggle) toggle.checked = !enabled;
    }
  }
}

export default AgentConfigModal;
