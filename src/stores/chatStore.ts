/**
 * Chat Store - Zustand store for chat/AI interaction
 */

import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatState {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  context: {
    newsIds?: number[];
    summary?: string;
  } | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setContext: (context: ChatState['context']) => void;
  sendMessage: (content: string) => Promise<void>;
}

let messageId = 0;

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  isLoading: false,
  error: null,
  context: null,

  // Actions
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    ),
  })),

  removeMessage: (id) => set((state) => ({
    messages: state.messages.filter((msg) => msg.id !== id),
  })),

  clearMessages: () => set({ messages: [] }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setContext: (context) => set({ context }),

  sendMessage: async (content) => {
    const { messages, context } = get();

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${++messageId}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Add placeholder for assistant response
    const assistantMessage: ChatMessage = {
      id: `msg-${++messageId}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    set({
      messages: [...messages, userMessage, assistantMessage],
      isLoading: true,
      error: null,
    });

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, context }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();

      // Update assistant message with response
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: data.response || 'No response', isLoading: false }
            : msg
        ),
        isLoading: false,
      }));
    } catch (error) {
      // Update assistant message with error
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                isLoading: false,
              }
            : msg
        ),
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      }));
    }
  },
}));

export default useChatStore;
