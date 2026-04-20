/**
 * Report Modal - Floating modal for displaying report details
 * Replaces inline report detail rendering in ReportPanel
 */

import { type Report } from '@/stores/reportStore';
import { escapeHtml } from '@/utils/sanitize';

class ReportModal {
  private static instance: ReportModal | null = null;
  private overlay: HTMLElement | null = null;
  private isVisible: boolean = false;

  private constructor() {}

  static getInstance(): ReportModal {
    if (!ReportModal.instance) {
      ReportModal.instance = new ReportModal();
    }
    return ReportModal.instance;
  }

  show(report: Report): void {
    // If modal already open, update content
    if (this.isVisible && this.overlay) {
      this.updateContent(report);
      return;
    }

    this.createModal(report);
    this.isVisible = true;
    document.body.style.overflow = 'hidden'; // Disable body scroll
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.isVisible = false;
    document.body.style.overflow = ''; // Re-enable body scroll
  }

  private createModal(report: Report): void {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'report-modal-overlay';
    this.overlay.className = 'modal-overlay';

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'report-modal';
    modal.className = 'modal-container';

    // Create header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h3 id="modal-title">${escapeHtml(report.title)}</h3>
      <button id="modal-close" class="modal-close-btn" aria-label="Close">×</button>
    `;

    // Create body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.id = 'modal-content';
    body.innerHTML = this.formatContent(report.content || 'No content available');

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    this.overlay.appendChild(modal);

    // Add to DOM
    document.body.appendChild(this.overlay);

    // Bind events
    this.bindEvents();
  }

  private updateContent(report: Report): void {
    if (!this.overlay) return;

    const titleEl = this.overlay.querySelector('#modal-title');
    const contentEl = this.overlay.querySelector('#modal-content');

    if (titleEl) titleEl.textContent = report.title;
    if (contentEl) contentEl.innerHTML = this.formatContent(report.content || 'No content available');
  }

  private formatContent(content: string): string {
    // Simple formatting: preserve line breaks and basic markdown
    // Replace \n with <br> and escape HTML
    const escaped = escapeHtml(content);
    return escaped.replace(/\n/g, '<br>');
  }

  private bindEvents(): void {
    if (!this.overlay) return;

    // Close button
    const closeBtn = this.overlay.querySelector('#modal-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Backdrop click (close when clicking outside modal)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    // ESC key
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }
}

// Export singleton instance getter
export function getReportModal(): ReportModal {
  return ReportModal.getInstance();
}

// Export show/hide helpers for convenience
export function showReportModal(report: Report): void {
  getReportModal().show(report);
}

export function hideReportModal(): void {
  getReportModal().hide();
}

export default ReportModal;
