/**
 * Report Store - Zustand store for report state management
 */

import { create } from 'zustand';

export interface Report {
  id: number;
  title: string;
  content?: string;
  format: string;
  category: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

interface ReportState {
  // State
  reports: Report[];
  currentReport: Report | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  filter: {
    category: string | null;
  };

  // Actions
  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  setCurrentReport: (report: Report | null) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: Partial<ReportState['filter']>) => void;
  fetchReports: () => Promise<void>;
  fetchReport: (id: number) => Promise<void>;
  generateReport: (category: string) => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  // Initial state
  reports: [],
  currentReport: null,
  isLoading: false,
  isGenerating: false,
  error: null,
  filter: {
    category: null,
  },

  // Actions
  setReports: (reports) => set({ reports }),

  addReport: (report) => set((state) => ({
    reports: [report, ...state.reports],
  })),

  setCurrentReport: (currentReport) => set({ currentReport }),

  setLoading: (isLoading) => set({ isLoading }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setError: (error) => set({ error }),

  setFilter: (filter) => set((state) => ({
    filter: { ...state.filter, ...filter },
  })),

  fetchReports: async () => {
    const { filter } = get();

    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (filter.category) params.set('type', filter.category);

      const response = await fetch(`/api/reports?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }

      const data = await response.json();

      set({
        reports: data.reports || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  fetchReport: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/reports/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.status}`);
      }

      const data = await response.json();

      set({
        currentReport: data,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  generateReport: async (category) => {
    set({ isGenerating: true, error: null });

    try {
      const response = await fetch(`/api/reports/generate/${category}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.status}`);
      }

      const data = await response.json();

      // Add new report to list
      if (data.report) {
        set((state) => ({
          reports: [data.report, ...state.reports],
          currentReport: data.report,
        }));
      }

      set({ isGenerating: false });

      // Refresh reports list
      get().fetchReports();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isGenerating: false,
      });
    }
  },
}));

export default useReportStore;
