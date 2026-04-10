/**
 * Unified News Panel - Combined Live News with Category Tabs
 * Displays news with tabs for different categories: Tech, Crypto, Defense, etc.
 */

import { useNewsStore, type NewsItem } from '@/stores/newsStore';
import { t, getCurrentLocale } from '@/i18n';
import { escapeHtml } from '@/utils/sanitize';

export class UnifiedNewsPanel {
  private container: HTMLElement;
  private element: HTMLElement;
  private store = useNewsStore;
  private activeCategory = 'all';
  private eventsBound = false;
  private onLanguageChange: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.element = this.createElement();
    this.render();
    // Bind events once
    this.bindEvents();
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'unified-news-panel';
    return el;
  }

  private getElement(): HTMLElement {
    return this.element;
  }

  private render(): void {
    const state = this.store.getState();

    // Use correct categories: tech, crypto, defense, economic, intl
    const categories = [
      { id: 'all', label: t('categories.all') || 'All' },
      { id: 'tech', label: t('categories.tech') || 'Tech' },
      { id: 'crypto', label: t('categories.crypto') || 'Crypto' },
      { id: 'defense', label: t('categories.defense') || 'Defense' },
      { id: 'economic', label: t('categories.economic') || 'Economics' },
      { id: 'intl', label: t('categories.intl') || 'International' },
    ];

    this.element.innerHTML = `
      <div class="news-tabs">
        ${categories.map(cat => `
          <button class="news-tab ${this.activeCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
            ${cat.label}
          </button>
        `).join('')}
      </div>
      <div class="news-list" id="news-list-container">
        ${this.renderNewsItems(state.items)}
      </div>
      ${state.isLoading ? '<div class="news-loading">Loading...</div>' : ''}
    `;
  }

  // URL to readable name mapping
  private readonly sourceNames: Record<string, string> = {
    'feeds.bbci.co.uk': 'BBC',
    'www.bbc.com': 'BBC',
    'reuters.com': 'Reuters',
    'www.reuters.com': 'Reuters',
    'cnn.com': 'CNN',
    'www.cnn.com': 'CNN',
    'nytimes.com': 'NY Times',
    'www.nytimes.com': 'NY Times',
    'theguardian.com': 'Guardian',
    'www.theguardian.com': 'Guardian',
    'washingtonpost.com': 'Wash Post',
    'www.washingtonpost.com': 'Wash Post',
    'wsj.com': 'WSJ',
    'www.wsj.com': 'WSJ',
    'bloomberg.com': 'Bloomberg',
    'www.bloomberg.com': 'Bloomberg',
    'ft.com': 'Financial Times',
    'www.ft.com': 'Financial Times',
    'techcrunch.com': 'TechCrunch',
    'www.techcrunch.com': 'TechCrunch',
    'theverge.com': 'The Verge',
    'www.theverge.com': 'The Verge',
    'arstechnica.com': 'Ars Technica',
    'www.arstechnica.com': 'Ars Technica',
    'wired.com': 'Wired',
    'www.wired.com': 'Wired',
    'coindesk.com': 'CoinDesk',
    'www.coindesk.com': 'CoinDesk',
    'cointelegraph.com': 'CoinTelegraph',
    'www.cointelegraph.com': 'CoinTelegraph',
    'defenseone.com': 'Defense One',
    'www.defenseone.com': 'Defense One',
    'breakingdefense.com': 'Breaking Defense',
    'www.breakingdefense.com': 'Breaking Defense',
    'defensenews.com': 'Defense News',
    'www.defensenews.com': 'Defense News',
    'janes.com': 'Janes',
    'www.janes.com': 'Janes',
    'twz.com': 'The War Zone',
    'www.twz.com': 'The War Zone',
    'cnbc.com': 'CNBC',
    'www.cnbc.com': 'CNBC',
    'marketwatch.com': 'MarketWatch',
    'www.marketwatch.com': 'MarketWatch',
    'finance.yahoo.com': 'Yahoo Finance',
    'aljazeera.com': 'Al Jazeera',
    'www.aljazeera.com': 'Al Jazeera',
    'foreignpolicy.com': 'Foreign Policy',
    'www.foreignpolicy.com': 'Foreign Policy',
    'foreignaffairs.com': 'Foreign Affairs',
    'www.foreignaffairs.com': 'Foreign Affairs',
    'atlanticcouncil.org': 'Atlantic Council',
    'www.atlanticcouncil.org': 'Atlantic Council',
    'npr.org': 'NPR',
    'www.npr.org': 'NPR',
    'apnews.com': 'AP News',
    'www.apnews.com': 'AP News',
    'hnrss.org': 'Hacker News',
    'decrypt.co': 'Decrypt',
    'www.decrypt.co': 'Decrypt',
    'theblock.co': 'The Block',
    'www.theblock.co': 'The Block',
    'venturebeat.com': 'VentureBeat',
    'www.venturebeat.com': 'VentureBeat',
    'mit.edu': 'MIT Tech Review',
    'technologyreview.com': 'MIT Tech Review',
    'www.technologyreview.com': 'MIT Tech Review',
  };

  // Helper to get readable source name
  private getSourceName(url: string | undefined): string {
    if (!url) return 'Unknown';
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      const mapped: string | undefined = this.sourceNames[hostname];
      if (mapped) return mapped;
      return String(hostname.split('.')[0]);
    } catch {
      return 'Unknown';
    }
  }

  // Helper to get display title based on current locale
  private getDisplayTitle(item: NewsItem): string {
    const locale = getCurrentLocale();
    if ((locale === 'zh-cn' || locale === 'zh-tw') && item.title_zh) {
      return item.title_zh;
    }
    return item.title;
  }

  // Helper to get display description based on current locale
  private getDisplayDescription(item: NewsItem): string | null {
    const locale = getCurrentLocale();
    if ((locale === 'zh-cn' || locale === 'zh-tw') && item.description_zh) {
      return item.description_zh;
    }
    return item.description || null;
  }

  private renderNewsItems(items: NewsItem[]): string {
    // Filter by active category
    const filtered = this.activeCategory === 'all'
      ? items
      : items.filter(item => item.category === this.activeCategory);

    if (filtered.length === 0) {
      return '<div class="news-empty">' + (t('news.noNews') || 'No news available') + '</div>';
    }

    // Category display mapping
    const categoryLabels: Record<string, string> = {
      'tech': '科技',
      'crypto': '加密',
      'defense': '国防',
      'economic': '经济',
      'intl': '国际',
      'world': '世界',
    };

    return filtered.slice(0, 50).map((item) => {
      const date = item.pub_date ? this.formatDate(item.pub_date) : '';
      const categoryLabel = item.category ? (categoryLabels[item.category] || item.category) : '';
      const categoryBadge = categoryLabel
        ? `<span class="news-category-badge">${categoryLabel}</span>`
        : '';
      const sourceName = this.getSourceName(item.source);
      const displayTitle = this.getDisplayTitle(item);
      const displayDesc = this.getDisplayDescription(item);

      return `
        <div class="news-item" data-id="${item.id}" data-url="${escapeHtml(item.url || '')}">
          <div class="news-item-header">
            <span class="news-item-source">${escapeHtml(sourceName)}</span>
            ${categoryBadge}
          </div>
          <div class="news-item-title">${escapeHtml(displayTitle)}</div>
          ${displayDesc ? `<div class="news-item-desc">${escapeHtml(displayDesc.substring(0, 100))}...</div>` : ''}
          <div class="news-item-meta">
            <span class="news-item-time">${date}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }

  private bindEvents(): void {
    if (this.eventsBound) return;
    this.eventsBound = true;

    // Store listener reference for proper cleanup
    this.onLanguageChange = () => {
      this.render();
    };
    document.addEventListener('languagechanged', this.onLanguageChange);

    // Use event delegation for tabs - delegate to parent container
    this.element.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.news-tab') as HTMLElement;
      if (target) {
        const newCategory = target.dataset.category || 'all';
        this.activeCategory = newCategory;

        // Update active tab
        this.element.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));
        target.classList.add('active');

        // Update store filter and refetch
        const store = this.store.getState();
        store.setFilter({ category: newCategory === 'all' ? null : newCategory });
        store.fetchNews();
      }

      // Handle news item click
      const newsItem = (e.target as HTMLElement).closest('.news-item') as HTMLElement;
      if (newsItem) {
        const url = newsItem.dataset.url;
        if (url) {
          window.open(url, '_blank');
        }
      }
    });

    // Subscribe to store changes
    this.store.subscribe(() => {
      this.render();
      // Re-update tabs active state after render
      this.element.querySelectorAll('.news-tab').forEach(tab => {
        const cat = (tab as HTMLElement).dataset.category;
        tab.classList.toggle('active', cat === this.activeCategory);
      });
    });
  }

  public mount(): void {
    this.container.appendChild(this.getElement());
    // Initial fetch
    this.store.getState().fetchNews();
  }

  public destroy(): void {
    if (this.onLanguageChange) {
      document.removeEventListener('languagechanged', this.onLanguageChange);
      this.onLanguageChange = null;
    }
    this.element.remove();
  }
}

export default UnifiedNewsPanel;
