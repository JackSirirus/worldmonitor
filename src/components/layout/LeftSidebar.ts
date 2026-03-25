/**
 * Left Sidebar - News Panel
 * Displays news list with filtering options
 */

import { useNewsStore, type NewsItem } from '@/stores';
import { t } from '@/i18n';
import { escapeHtml } from '@/utils/sanitize';

export class LeftSidebar {
  private container: HTMLElement;
  private store = useNewsStore;
  private element: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.element = this.createElement();
    this.render();
    this.bindEvents();
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'left-sidebar';
    el.className = 'left-sidebar';
    return el;
  }

  private getElement(): HTMLElement {
    return this.element;
  }

  private render(): void {
    const state = this.store.getState();

    const categories = ['politics', 'tech', 'finance', 'defense', 'economic'];
    const langOptions = [
      { value: 'all', label: t('common.all') || 'All' },
      { value: 'en', label: 'English' },
      { value: 'zh', label: '中文' },
    ];

    const filterHtml = `
      <div class="sidebar-filter">
        <select id="news-category-filter" class="filter-select">
          <option value="">${t('common.allCategories') || 'All Categories'}</option>
          ${categories.map(cat => `
            <option value="${cat}" ${state.filter.category === cat ? 'selected' : ''}>
              ${t(`categories.${cat}`) || cat}
            </option>
          `).join('')}
        </select>
        <select id="news-lang-filter" class="filter-select">
          ${langOptions.map(opt => `
            <option value="${opt.value}" ${state.filter.lang === opt.value ? 'selected' : ''}>
              ${opt.label}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="news-list" id="news-list-container">
        ${this.renderNewsItems(state.items)}
      </div>
      ${state.isLoading ? '<div class="sidebar-loading">Loading...</div>' : ''}
    `;

    this.element.innerHTML = `
      <div class="sidebar-header">
        <h3>${t('panels.liveNews') || 'Live News'}</h3>
        <button class="sidebar-toggle" id="toggle-left-sidebar" title="Toggle">
          <span class="icon">◀</span>
        </button>
      </div>
      ${filterHtml}
    `;
  }

  private renderNewsItems(items: NewsItem[]): string {
    if (items.length === 0) {
      return '<div class="news-empty">No news available</div>';
    }

    return items.slice(0, 50).map((item) => {
      const date = item.pub_date ? new Date(item.pub_date).toLocaleString() : '';
      const langBadge = item.lang ? `<span class="news-lang-badge">${item.lang.toUpperCase()}</span>` : '';

      return `
        <div class="news-item" data-id="${item.id}" data-url="${escapeHtml(item.url || '')}">
          <div class="news-item-header">
            <span class="news-item-source">${escapeHtml(item.source || 'Unknown')}</span>
            ${langBadge}
          </div>
          <div class="news-item-title">${escapeHtml(item.title)}</div>
          <div class="news-item-meta">
            <span class="news-item-time">${date}</span>
            ${item.category ? `<span class="news-item-category">${item.category}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  private bindEvents(): void {
    // Category filter
    const categorySelect = this.element.querySelector('#news-category-filter') as HTMLSelectElement;
    categorySelect?.addEventListener('change', () => {
      this.store.getState().setFilter({ category: categorySelect.value || null });
      this.store.getState().fetchNews();
      this.render();
    });

    // Language filter
    const langSelect = this.element.querySelector('#news-lang-filter') as HTMLSelectElement;
    langSelect?.addEventListener('change', () => {
      this.store.getState().setFilter({ lang: langSelect.value as 'all' | 'en' | 'zh' });
      this.store.getState().fetchNews();
      this.render();
    });

    // Toggle sidebar
    const toggleBtn = this.element.querySelector('#toggle-left-sidebar');
    toggleBtn?.addEventListener('click', () => {
      this.element.classList.toggle('collapsed');
      const icon = toggleBtn.querySelector('.icon');
      if (icon) {
        icon.textContent = this.element.classList.contains('collapsed') ? '▶' : '◀';
      }
    });

    // News item click
    const newsList = this.element.querySelector('#news-list-container');
    newsList?.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.news-item') as HTMLElement;
      if (target) {
        const url = target.dataset.url;
        if (url) {
          window.open(url, '_blank');
        }
      }
    });

    // Subscribe to store changes
    this.store.subscribe(() => {
      this.render();
    });
  }

  public mount(): void {
    this.container.appendChild(this.getElement());
    // Initial fetch
    this.store.getState().fetchNews();
  }

  public destroy(): void {
    this.element.remove();
  }
}

export default LeftSidebar;
