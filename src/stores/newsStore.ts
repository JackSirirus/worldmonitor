/**
 * News Store - Zustand store for news state management
 */

import { create } from 'zustand';

export interface NewsItem {
  id: number;
  title: string;
  description?: string;
  source?: string;
  url?: string;
  pub_date: string;
  category?: string;
  lang?: 'en' | 'zh';
}

interface NewsState {
  // State
  items: NewsItem[];
  isLoading: boolean;
  error: string | null;
  filter: {
    category: string | null;
    source: string | null;
    lang: 'all' | 'en' | 'zh';
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };

  // Actions
  setItems: (items: NewsItem[]) => void;
  addItems: (items: NewsItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: Partial<NewsState['filter']>) => void;
  setPage: (page: number) => void;
  setTotal: (total: number) => void;
  fetchNews: () => Promise<void>;
}

export const useNewsStore = create<NewsState>((set, get) => ({
  // Initial state
  items: [],
  isLoading: false,
  error: null,
  filter: {
    category: null,
    source: null,
    lang: 'all',
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
  },

  // Actions
  setItems: (items) => set({ items }),

  addItems: (newItems) => set((state) => ({
    items: [...state.items, ...newItems],
  })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setFilter: (filter) => set((state) => ({
    filter: { ...state.filter, ...filter },
    pagination: { ...state.pagination, page: 1 }, // Reset to page 1 on filter change
  })),

  setPage: (page) => set((state) => ({
    pagination: { ...state.pagination, page },
  })),

  setTotal: (total) => set((state) => ({
    pagination: { ...state.pagination, total },
  })),

  fetchNews: async () => {
    const { filter, pagination } = get();

    set({ isLoading: true, error: null });

    try {
      // Check if RSS refresh is needed
      try {
        const refreshCheck = await fetch('/api/rss-collector/refresh-needed');
        const refreshData = await refreshCheck.json();

        if (refreshData.needsRefresh) {
          console.log(`[NewsStore] RSS refresh needed (${refreshData.staleSourceCount} stale sources)`);
          // Trigger RSS collection in background
          fetch('/api/rss-collector/collect', { method: 'POST' }).catch(err => {
            console.warn('[NewsStore] Background RSS collection failed:', err);
          });
        }
      } catch (refreshErr) {
        console.warn('[NewsStore] Failed to check RSS refresh status:', refreshErr);
      }

      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));

      if (filter.category) params.set('category', filter.category);
      if (filter.source) params.set('source', filter.source);
      if (filter.lang !== 'all') params.set('lang', filter.lang);

      const response = await fetch(`/api/news?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const data = await response.json();

      set({
        items: data.items || [],
        pagination: {
          ...pagination,
          total: data.pagination?.total || 0,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },
}));

export default useNewsStore;
