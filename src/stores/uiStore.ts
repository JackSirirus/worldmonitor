/**
 * UI Store - Zustand store for UI state management
 */

import { create } from 'zustand';

export type LayoutVariant = 'default' | 'expanded-chat' | 'minimal';

interface UIState {
  // Layout state
  layoutVariant: LayoutVariant;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  chatExpanded: boolean;

  // Panel visibility
  visiblePanels: string[];

  // Theme
  theme: 'dark' | 'light';

  // Agent panel state
  agentPanelExpanded: boolean;
  agentPanelTab: 'status' | 'tasks' | 'logs';

  // Actions
  setLayoutVariant: (variant: LayoutVariant) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleChat: () => void;
  setVisiblePanels: (panels: string[]) => void;
  togglePanel: (panelId: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleAgentPanel: () => void;
  setAgentPanelTab: (tab: UIState['agentPanelTab']) => void;
}

// Default visible panels
const defaultPanels = [
  'politics',
  'tech',
  'finance',
  'markets',
  'heatmap',
  'crypto',
  'commodities',
  'monitor',
];

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  layoutVariant: 'default',
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  chatExpanded: false,
  visiblePanels: defaultPanels,
  theme: 'dark',
  agentPanelExpanded: false,
  agentPanelTab: 'status',

  // Actions
  setLayoutVariant: (layoutVariant) => set({ layoutVariant }),

  toggleLeftSidebar: () => set((state) => ({
    leftSidebarOpen: !state.leftSidebarOpen,
  })),

  toggleRightSidebar: () => set((state) => ({
    rightSidebarOpen: !state.rightSidebarOpen,
  })),

  toggleChat: () => set((state) => ({
    chatExpanded: !state.chatExpanded,
  })),

  setVisiblePanels: (visiblePanels) => set({ visiblePanels }),

  togglePanel: (panelId) => set((state) => {
    const panels = state.visiblePanels;
    if (panels.includes(panelId)) {
      return { visiblePanels: panels.filter((p) => p !== panelId) };
    }
    return { visiblePanels: [...panels, panelId] };
  }),

  setTheme: (theme) => set({ theme }),

  toggleAgentPanel: () => set((state) => ({
    agentPanelExpanded: !state.agentPanelExpanded,
  })),

  setAgentPanelTab: (agentPanelTab) => set({ agentPanelTab }),
}));

export default useUIStore;
