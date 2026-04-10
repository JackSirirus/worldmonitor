/**
 * Report Panel - Reports List and Management
 * Right sidebar panel showing generated reports
 */

import { useReportStore, type Report } from '@/stores';
import { t } from '@/i18n';
import { escapeHtml } from '@/utils/sanitize';

export class ReportPanel {
  private container: HTMLElement;
  private element: HTMLElement;
  private store = useReportStore;
  private onLanguageChange: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.element = this.createElement();
    this.onLanguageChange = () => this.render();
    this.render();
    this.bindEvents();
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'report-panel';
    el.className = 'report-panel';
    return el;
  }

  private getElement(): HTMLElement {
    return this.element;
  }

  private render(): void {
    const state = this.store.getState();

    const reportsHtml = this.renderReports(state.reports);
    const generating = state.isGenerating;

    this.element.innerHTML = `
      <div class="sidebar-header">
        <h3>${t('panels.reports') || 'Reports'}</h3>
        <div class="sidebar-actions">
          <button class="sidebar-action-btn" id="panelSettingsBtn" title="Panel Settings">
            ⚙
          </button>
          <button class="sidebar-action-btn" id="newsSourcesBtn" title="News Sources">
            📡
          </button>
          <button class="sidebar-toggle" id="toggle-right-sidebar" title="Toggle">
            <span class="icon">▶</span>
          </button>
        </div>
      </div>
      <div class="report-actions">
        <button class="report-generate-btn" id="generate-tech-report" ${generating ? 'disabled' : ''}>
          ${t('reports.generateTech') || 'Tech Report'}
        </button>
        <button class="report-generate-btn" id="generate-world-report" ${generating ? 'disabled' : ''}>
          ${t('reports.generateWorld') || 'World Report'}
        </button>
      </div>
      <div class="report-list" id="report-list">
        ${state.isLoading ? '<div class="report-loading">Loading...</div>' : reportsHtml}
      </div>
      ${state.currentReport ? this.renderCurrentReport(state.currentReport) : ''}
    `;
  }

  private renderReports(reports: Report[]): string {
    if (reports.length === 0) {
      return '<div class="report-empty">No reports yet</div>';
    }

    return reports.map(report => {
      const date = new Date(report.created_at).toLocaleDateString();
      const categoryBadge = report.category ? `<span class="report-category">${report.category}</span>` : '';

      return `
        <div class="report-item" data-id="${report.id}">
          <div class="report-item-header">
            <span class="report-item-title">${escapeHtml(report.title)}</span>
            ${categoryBadge}
          </div>
          <div class="report-item-meta">
            <span class="report-item-date">${date}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  private renderCurrentReport(report: Report): string {
    return `
      <div class="report-detail" id="report-detail">
        <div class="report-detail-header">
          <h4>${escapeHtml(report.title)}</h4>
          <button class="report-detail-close" id="close-report-detail">✕</button>
        </div>
        <div class="report-detail-content">
          ${report.content ? escapeHtml(report.content) : 'No content available'}
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // Listen for language changes to re-render
    document.addEventListener('languagechanged', this.onLanguageChange);

    // Generate tech report
    const techBtn = this.element.querySelector('#generate-tech-report');
    techBtn?.addEventListener('click', () => {
      this.store.getState().generateReport('tech');
    });

    // Generate world report
    const worldBtn = this.element.querySelector('#generate-world-report');
    worldBtn?.addEventListener('click', () => {
      this.store.getState().generateReport('world');
    });

    // Panel Settings button - open settings modal
    const settingsBtn = this.element.querySelector('#panelSettingsBtn');
    settingsBtn?.addEventListener('click', () => {
      const modal = document.getElementById('settingsModal');
      if (modal) {
        modal.classList.add('active');
      }
    });

    // News Sources button - open sources modal
    const sourcesBtn = this.element.querySelector('#newsSourcesBtn');
    sourcesBtn?.addEventListener('click', () => {
      const modal = document.getElementById('sourcesModal');
      if (modal) {
        modal.classList.add('active');
      }
    });

    // Toggle sidebar
    const toggleBtn = this.element.querySelector('#toggle-right-sidebar');
    toggleBtn?.addEventListener('click', () => {
      this.element.classList.toggle('collapsed');
      const icon = toggleBtn.querySelector('.icon');
      if (icon) {
        icon.textContent = this.element.classList.contains('collapsed') ? '◀' : '▶';
      }
    });

    // Report item click - attach to container for event delegation
    // Using container instead of #report-list because innerHTML replacement in render() destroys the list element
    this.container.addEventListener('click', async (e) => {
      const targetEl = e.target as HTMLElement;
      const target = targetEl?.closest('.report-item') as HTMLElement;
      if (target) {
        const id = parseInt(target.dataset.id || '0');
        if (id) {
          try {
            const response = await fetch(`/api/reports/${id}`);
            if (response.ok) {
              const report = await response.json();
              this.store.getState().setCurrentReport(report);
              this.render();
            }
          } catch (error) {
            console.error('Failed to fetch report:', error);
          }
        }
      }
    });

    // Close report detail
    const closeBtn = this.element.querySelector('#close-report-detail');
    closeBtn?.addEventListener('click', () => {
      this.store.getState().setCurrentReport(null);
      this.render();
    });

    // Subscribe to store changes
    this.store.subscribe(() => {
      this.render();
    });
  }

  public mount(): void {
    this.container.appendChild(this.getElement());
    // Initial fetch
    this.store.getState().fetchReports();
  }

  public destroy(): void {
    document.removeEventListener('languagechanged', this.onLanguageChange);
    this.element.remove();
  }
}

export default ReportPanel;
