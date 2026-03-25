/**
 * Chat Window - AI Chat Interface
 * Center panel for interacting with AI agent
 */

import { useChatStore, type ChatMessage } from '@/stores';
import { t } from '@/i18n';
import { escapeHtml } from '@/utils/sanitize';

export class ChatWindow {
  private container: HTMLElement;
  private element: HTMLElement;
  private store = useChatStore;

  constructor(container: HTMLElement) {
    this.container = container;
    this.element = this.createElement();
    this.render();
    this.bindEvents();
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'chat-window';
    el.className = 'chat-window';
    return el;
  }

  private getElement(): HTMLElement {
    return this.element;
  }

  private render(): void {
    const state = this.store.getState();

    const messagesHtml = state.messages.map(msg => this.renderMessage(msg)).join('');

    this.element.innerHTML = `
      <div class="chat-header">
        <h3>${t('panels.aiChat') || 'AI Assistant'}</h3>
        <button class="chat-clear-btn" id="chat-clear" title="${t('buttons.clear') || 'Clear'}">
          🗑️
        </button>
      </div>
      <div class="chat-messages" id="chat-messages">
        ${state.messages.length === 0 ? `
          <div class="chat-welcome">
            <p>${t('chat.welcome') || 'Ask me about world events, news analysis, or generate reports.'}</p>
          </div>
        ` : messagesHtml}
      </div>
      <div class="chat-input-container">
        <input
          type="text"
          id="chat-input"
          class="chat-input"
          placeholder="${t('chat.placeholder') || 'Ask a question...'}"
          ${state.isLoading ? 'disabled' : ''}
        />
        <button class="chat-send-btn" id="chat-send" ${state.isLoading ? 'disabled' : ''}>
          ${state.isLoading ? '⏳' : '➤'}
        </button>
      </div>
    `;

    // Scroll to bottom
    const messagesContainer = this.element.querySelector('#chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private renderMessage(msg: ChatMessage): string {
    const time = msg.timestamp.toLocaleTimeString();
    const roleClass = msg.role === 'user' ? 'user' : 'assistant';
    const loadingClass = msg.isLoading ? 'loading' : '';

    return `
      <div class="chat-message ${roleClass} ${loadingClass}">
        <div class="chat-message-header">
          <span class="chat-message-role">${msg.role === 'user' ? t('chat.you') || 'You' : 'AI'}</span>
          <span class="chat-message-time">${time}</span>
        </div>
        <div class="chat-message-content">
          ${msg.isLoading ? `
            <span class="typing-indicator">
              <span>.</span><span>.</span><span>.</span>
            </span>
          ` : this.formatContent(msg.content)}
        </div>
      </div>
    `;
  }

  private formatContent(content: string): string {
    // Simple markdown-like formatting
    let html = escapeHtml(content);

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  private bindEvents(): void {
    // Send button
    const sendBtn = this.element.querySelector('#chat-send');
    sendBtn?.addEventListener('click', () => this.handleSend());

    // Input enter key
    const input = this.element.querySelector('#chat-input') as HTMLInputElement;
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Clear button
    const clearBtn = this.element.querySelector('#chat-clear');
    clearBtn?.addEventListener('click', () => {
      this.store.getState().clearMessages();
      this.render();
    });

    // Subscribe to store changes
    this.store.subscribe(() => {
      this.render();
    });
  }

  private handleSend(): void {
    const input = this.element.querySelector('#chat-input') as HTMLInputElement;
    const message = input?.value.trim();

    if (!message) return;

    input.value = '';
    this.store.getState().sendMessage(message);
  }

  public mount(): void {
    this.container.appendChild(this.getElement());
  }

  public destroy(): void {
    this.element.remove();
  }
}

export default ChatWindow;
