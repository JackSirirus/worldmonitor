/**
 * Agent Panel Component
 * Shows Agent system status and provides manual controls
 */

import { escapeHtml } from '@/utils/sanitize';
import { t } from '@/i18n';

interface AgentStatus {
  rssCollector: {
    status: 'running' | 'idle' | 'error';
    lastRun: string | null;
    itemsCollected: number;
  };
  webSearch: {
    status: 'available' | 'unavailable';
    provider: string;
  };
  reports: {
    lastGenerated: string | null;
    categories: string[];
  };
}

interface Report {
  id: number;
  title: string;
  category: string | null;
  created_at: string;
  content?: string;
}

export class AgentPanel {
  private element: HTMLElement;
  private isExpanded = false;
  private status: AgentStatus | null = null;
  private reports: Report[] = [];
  private refreshInterval: number | null = null;

  constructor() {
    console.log('[AgentPanel] Constructor called');
    this.element = this.createElement();
    console.log('[AgentPanel] Element created, className:', this.element.className);
    this.loadStatus();
    this.startAutoRefresh();
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'panel agent-panel';
    el.innerHTML = `
      <div class="panel-header">
        <span class="panel-title" style="color: #ff6b35; font-weight: bold;">🤖 Agent</span>
        <div class="panel-actions">
          <button class="btn-refresh" title="${t('buttons.refresh')}">🔄</button>
          <button class="btn-toggle" title="${t('buttons.collapse')}">▼</button>
        </div>
      </div>
      <div class="panel-content">
        <div class="agent-status-section">
          <h4>${t('agent.status')}</h4>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">${t('agent.rssCollector')}</span>
              <span class="status-value status-${this.status?.rssCollector?.status || 'loading'}">
                ${this.status?.rssCollector?.status || t('common.loading')}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">${t('agent.webSearch')}</span>
              <span class="status-value">
                ${this.status?.webSearch?.provider || 'DuckDuckGo'}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">${t('agent.lastCollection')}</span>
              <span class="status-value">
                ${this.status?.rssCollector?.lastRun || '-'}
              </span>
            </div>
          </div>
        </div>

        <div class="agent-reports-section">
          <h4>${t('agent.reports')}</h4>
          <div class="reports-list">
            ${this.reports.length === 0
              ? `<p class="no-data">${t('agent.noReports')}</p>`
              : this.reports.map(r => `
                <div class="report-item" data-id="${r.id}">
                  <span class="report-category">${r.category || 'general'}</span>
                  <span class="report-title">${escapeHtml(r.title)}</span>
                  <span class="report-date">${new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              `).join('')
            }
          </div>
        </div>

        <div class="agent-actions">
          <button class="btn-action btn-collect" data-action="collect">
            ${t('agent.collectNow')}
          </button>
          <button class="btn-action btn-generate" data-action="generate-tech">
            ${t('agent.generateTech')}
          </button>
          <button class="btn-action btn-generate" data-action="generate-world">
            ${t('agent.generateWorld')}
          </button>
          <button class="btn-action btn-more" data-action="more">
            ${t('agent.more')}...
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners(el);
    return el;
  }

  private attachEventListeners(el: HTMLElement): void {
    // Toggle button - expand/collapse
    const toggleBtn = el.querySelector('.btn-toggle');
    toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isExpanded = !this.isExpanded;
      const content = el.querySelector('.panel-content');
      if (content) {
        if (this.isExpanded) {
          content.classList.add('expanded');
        } else {
          content.classList.remove('expanded');
        }
      }
      // Update icon
      const icon = toggleBtn.querySelector('svg polyline');
      if (icon) {
        icon.setAttribute('points', this.isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
      }
    });

    // Also toggle on header click
    const header = el.querySelector('.panel-header');
    header?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        (toggleBtn as HTMLButtonElement)?.click();
      }
    });

    // Refresh button
    const refreshBtn = el.querySelector('.btn-refresh');
    refreshBtn?.addEventListener('click', () => {
      this.loadStatus();
    });

    // Action buttons
    const actionButtons = el.querySelectorAll('.btn-action');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = (e.target as HTMLElement).dataset.action;
        if (action) {
          await this.handleAction(action);
        }
      });
    });

    // Report items click handler
    const reportsList = el.querySelector('.reports-list');
    reportsList?.querySelectorAll('.report-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt((item as HTMLElement).dataset.id || '0');
        if (id > 0) this.showReportDetail(id);
      });
    });
  }

  private async handleAction(action: string): Promise<void> {
    if (action === 'more') {
      this.showMoreModal();
      return;
    }

    const btn = this.element.querySelector(`[data-action="${action}"]`) as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('agent.running');
    }

    try {
      switch (action) {
        case 'collect':
          await this.triggerCollection();
          break;
        case 'generate-tech':
          await this.triggerReport('tech');
          break;
        case 'generate-world':
          await this.triggerReport('world');
          break;
        case 'generate-weekly':
          await this.triggerReport('weekly');
          break;
        case 'cleanup':
          await this.triggerTask('cleanup');
          break;
      }
      await this.loadStatus();
    } catch (err) {
      console.error('[AgentPanel] Action failed:', err);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = this.getActionLabel(action);
      }
    }
  }

  private showMoreModal(): void {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content agent-more-modal">
        <div class="modal-header">
          <h3>${t('agent.moreOptions')}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <button class="task-btn" data-action="generate-weekly">
            <span class="task-icon">📅</span>
            <span class="task-name">${t('agent.generateWeekly')}</span>
            <span class="task-desc">${t('agent.generateWeeklyDesc')}</span>
          </button>
          <button class="task-btn" data-action="cleanup">
            <span class="task-icon">🧹</span>
            <span class="task-name">${t('agent.runCleanup')}</span>
            <span class="task-desc">${t('agent.runCleanupDesc')}</span>
          </button>
        </div>
      </div>
    `;

    // Close handlers
    modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Action handlers
    modal.querySelectorAll('.task-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        if (action) {
          await this.handleAction(action);
          modal.remove();
        }
      });
    });

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('visible'), 10);
  }

  private async showReportDetail(reportId: number): Promise<void> {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) throw new Error('Failed to load report');

      const report = await response.json();

      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content report-detail-modal">
          <div class="modal-header">
            <h3>${escapeHtml(report.title || 'Report')}</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-meta">
            <span class="report-category">${report.category || 'general'}</span>
            <span class="report-date">${new Date(report.created_at).toLocaleString()}</span>
          </div>
          <div class="modal-body report-content">
            ${report.content ? `<pre>${escapeHtml(report.content)}</pre>` : '<p>No content available</p>'}
          </div>
        </div>
      `;

      // Close handlers
      modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('visible'), 10);
    } catch (error) {
      console.error('[AgentPanel] Failed to load report:', error);
    }
  }

  private getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'collect': t('agent.collectNow'),
      'generate-tech': t('agent.generateTech'),
      'generate-world': t('agent.generateWorld'),
      'generate-weekly': t('agent.generateWeekly'),
      'cleanup': t('agent.runCleanup'),
      'more': t('agent.more'),
    };
    return labels[action] || action;
  }

  private async triggerTask(task: string): Promise<void> {
    const response = await fetch(`/api/agent/trigger/${task}`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Task trigger failed');
    }
  }

  private async triggerCollection(): Promise<void> {
    const response = await fetch('/api/rss-collector/collect', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Collection failed');
    }
  }

  private async triggerReport(category: string): Promise<void> {
    const response = await fetch(`/api/reports/generate/${category}`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Report generation failed');
    }
  }

  private async loadStatus(): Promise<void> {
    try {
      // Load RSS collector status
      const statusRes = await fetch('/api/rss-collector/status');
      const statusData = await statusRes.json();

      // Load recent reports
      const reportsRes = await fetch('/api/reports?limit=5');
      const reportsData = await reportsRes.json();

      this.status = {
        rssCollector: {
          status: statusData.stats?.errors > 0 ? 'error' : 'idle',
          lastRun: statusData.sources?.[0]?.last_fetch || null,
          itemsCollected: statusData.stats?.total || 0,
        },
        webSearch: {
          status: 'available',
          provider: 'DuckDuckGo',
        },
        reports: {
          lastGenerated: reportsData.reports?.[0]?.created_at || null,
          categories: ['tech', 'world', 'daily', 'weekly'],
        },
      };

      this.reports = reportsData.reports || [];
      this.updateUI();
    } catch (err) {
      console.error('[AgentPanel] Failed to load status:', err);
    }
  }

  private updateUI(): void {
    if (!this.status) return;

    // Update status grid
    const statusGrid = this.element.querySelector('.status-grid');
    if (statusGrid) {
      statusGrid.innerHTML = `
        <div class="status-item">
          <span class="status-label">${t('agent.rssCollector')}</span>
          <span class="status-value status-${this.status.rssCollector.status}">
            ${t(`agent.statuses.${this.status.rssCollector.status}`)}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">${t('agent.webSearch')}</span>
          <span class="status-value">${this.status.webSearch.provider}</span>
        </div>
        <div class="status-item">
          <span class="status-label">${t('agent.itemsCollected')}</span>
          <span class="status-value">${this.status.rssCollector.itemsCollected}</span>
        </div>
      `;
    }

    // Update reports list
    const reportsList = this.element.querySelector('.reports-list');
    if (reportsList) {
      if (this.reports.length === 0) {
        reportsList.innerHTML = `<p class="no-data">${t('agent.noReports')}</p>`;
      } else {
        reportsList.innerHTML = this.reports.map(r => `
          <div class="report-item" data-id="${r.id}">
            <span class="report-category">${r.category || 'general'}</span>
            <span class="report-title">${escapeHtml(r.title)}</span>
            <span class="report-date">${new Date(r.created_at).toLocaleDateString()}</span>
          </div>
        `).join('');

        // Add click handlers to report items
        reportsList.querySelectorAll('.report-item').forEach(item => {
          item.addEventListener('click', () => {
            const id = parseInt((item as HTMLElement).dataset.id || '0');
            if (id > 0) this.showReportDetail(id);
          });
        });
      }
    }
  }

  private startAutoRefresh(): void {
    // Refresh every 5 minutes
    this.refreshInterval = window.setInterval(() => {
      this.loadStatus();
    }, 5 * 60 * 1000);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.element.remove();
  }
}

export default AgentPanel;
