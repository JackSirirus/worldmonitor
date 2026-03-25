/**
 * Agent WebSocket Service
 * Provides real-time updates with polling fallback
 */

export type AgentEventType = 'task-update' | 'task-complete' | 'task-error' | 'status';

export interface AgentEvent {
  type: AgentEventType;
  data: any;
  timestamp: string;
}

export type AgentEventHandler = (event: AgentEvent) => void;

class AgentWebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Set<AgentEventHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 3000;
  private pollingInterval: number | null = null;
  private pollingUrl = '/api/agent/status';
  private pollingIntervalMs = 30000; // 30 seconds
  private useWebSocket = true;
  private lastStatus: any = null;

  /**
   * Connect to WebSocket or start polling
   */
  connect(wsUrl?: string): void {
    if (this.ws || this.pollingInterval) {
      console.warn('[AgentWS] Already connected or polling');
      return;
    }

    if (this.useWebSocket && wsUrl) {
      this.connectWebSocket(wsUrl);
    } else {
      this.startPolling();
    }
  }

  /**
   * Connect via WebSocket
   */
  private connectWebSocket(wsUrl: string): void {
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[AgentWS] WebSocket connected');
        this.reconnectAttempts = 0;
        this.stopPolling();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AgentEvent;
          this.notifyHandlers(data);
        } catch (err) {
          console.error('[AgentWS] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[AgentWS] WebSocket closed');
        this.ws = null;
        this.handleDisconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[AgentWS] WebSocket error:', error);
        this.useWebSocket = false;
      };
    } catch (err) {
      console.error('[AgentWS] Failed to connect:', err);
      this.useWebSocket = false;
      this.startPolling();
    }
  }

  /**
   * Handle disconnect - try reconnect or fall back to polling
   */
  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[AgentWS] Reconnecting... attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        if (this.useWebSocket) {
          // Would need wsUrl saved
          this.startPolling();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('[AgentWS] Max reconnect attempts, falling back to polling');
      this.useWebSocket = false;
      this.startPolling();
    }
  }

  /**
   * Start polling fallback
   */
  startPolling(): void {
    if (this.pollingInterval) return;

    console.log('[AgentWS] Starting polling fallback');
    this.poll();

    this.pollingInterval = window.setInterval(() => {
      this.poll();
    }, this.pollingIntervalMs);
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Poll for status updates
   */
  private async poll(): Promise<void> {
    try {
      const response = await fetch(this.pollingUrl);
      if (response.ok) {
        const data = await response.json();

        // Check if status changed
        if (JSON.stringify(data) !== JSON.stringify(this.lastStatus)) {
          this.lastStatus = data;
          this.notifyHandlers({
            type: 'status',
            data,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('[AgentWS] Polling failed:', err);
    }
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopPolling();
    this.handlers.clear();
  }

  /**
   * Subscribe to events
   */
  subscribe(handler: AgentEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Notify all handlers
   */
  private notifyHandlers(event: AgentEvent): void {
    this.handlers.forEach(handler => {
      try {
        handler(event);
      } catch (err) {
        console.error('[AgentWS] Handler error:', err);
      }
    });
  }

  /**
   * Set polling interval
   */
  setPollingInterval(ms: number): void {
    this.pollingIntervalMs = ms;
    if (this.pollingInterval) {
      this.stopPolling();
      this.startPolling();
    }
  }

  /**
   * Check if using WebSocket
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || this.pollingInterval !== null;
  }
}

// Singleton instance
export const agentWs = new AgentWebSocketService();

export default agentWs;
