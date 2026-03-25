/**
 * WebSocket Server
 * Handles real-time communication with frontend
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface WSMessage {
  type: string;
  payload: unknown;
}

interface WSClient {
  id: string;
  socket: WebSocket;
  subscriptions: Set<string>;
  connectedAt: Date;
}

let wss: WebSocketServer | null = null;
const clients: Map<string, WSClient> = new Map();
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

// Heartbeat interval in ms
const HEARTBEAT_INTERVAL = 30000;

// Allowed origins for WebSocket connections (internal use only)
const ALLOWED_ORIGINS = process.env.WS_ALLOWED_ORIGINS
  ? process.env.WS_ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:5173',  // Vite dev
      'http://localhost:3000', // Common dev
      'https://worldmonitor.app',
      'https://tech.worldmonitor.app',
    ];

/**
 * Validate origin header for security
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.startsWith(allowed.replace(/\/$/, ''))
  );
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket, req) => {
    const origin = req.headers.origin;
    const clientIp = req.socket.remoteAddress || 'unknown';

    // Security: Check Origin header
    if (!isOriginAllowed(origin)) {
      console.warn(`[WS] Connection rejected - invalid origin: ${origin} from ${clientIp}`);
      socket.close(4001, 'Origin not allowed');
      return;
    }

    const clientId = generateClientId();
    const client: WSClient = {
      id: clientId,
      socket,
      subscriptions: new Set(),
      connectedAt: new Date(),
    };

    clients.set(clientId, client);
    console.log(`[WS] Client connected: ${clientId} from ${origin} (${clientIp})`);

    // Send welcome message
    sendToClient(clientId, {
      type: 'connected',
      payload: { clientId, message: 'Connected to WorldMonitor' },
    });

    // Handle messages
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        handleMessage(clientId, message);
      } catch (err) {
        console.error('[WS] Invalid message:', err);
      }
    });

    // Handle close
    socket.on('close', () => {
      clients.delete(clientId);
      console.log(`[WS] Client disconnected: ${clientId}`);
    });

    // Handle errors
    socket.on('error', (err) => {
      console.error(`[WS] Client error: ${clientId}`, err);
      clients.delete(clientId);
    });
  });

  console.log('[WS] WebSocket server initialized');

  // Start heartbeat
  startHeartbeat();
}

/**
 * Start heartbeat to detect dead connections
 */
function startHeartbeat(): void {
  if (heartbeatInterval) return;

  heartbeatInterval = setInterval(() => {
    const now = Date.now();

    for (const [clientId, client] of clients.entries()) {
      if (client.socket.readyState !== WebSocket.OPEN) {
        clients.delete(clientId);
        continue;
      }

      // Send ping
      try {
        client.socket.send(JSON.stringify({ type: 'ping', timestamp: now }));
      } catch {
        // Connection dead, remove client
        clients.delete(clientId);
      }
    }
  }, HEARTBEAT_INTERVAL);

  console.log('[WS] Heartbeat started');
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(clientId: string, message: WSMessage): void {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'subscribe':
      if (typeof message.payload === 'string') {
        client.subscriptions.add(message.payload);
        sendToClient(clientId, {
          type: 'subscribed',
          payload: message.payload,
        });
      }
      break;

    case 'unsubscribe':
      if (typeof message.payload === 'string') {
        client.subscriptions.delete(message.payload);
        sendToClient(clientId, {
          type: 'unsubscribed',
          payload: message.payload,
        });
      }
      break;

    case 'ping':
      sendToClient(clientId, { type: 'pong', payload: null });
      break;

    default:
      console.log(`[WS] Unknown message type: ${message.type}`);
  }
}

/**
 * Send message to specific client
 */
export function sendToClient(clientId: string, message: WSMessage): void {
  const client = clients.get(clientId);
  if (!client || client.socket.readyState !== WebSocket.OPEN) return;

  try {
    client.socket.send(JSON.stringify(message));
  } catch (err) {
    console.error(`[WS] Failed to send to ${clientId}:`, err);
  }
}

/**
 * Broadcast message to all connected clients
 */
export function broadcast(message: WSMessage, filter?: (client: WSClient) => boolean): void {
  const messageStr = JSON.stringify(message);

  for (const client of clients.values()) {
    if (client.socket.readyState !== WebSocket.OPEN) continue;
    if (filter && !filter(client)) continue;

    try {
      client.socket.send(messageStr);
    } catch (err) {
      console.error(`[WS] Broadcast error:`, err);
    }
  }
}

/**
 * Broadcast to clients subscribed to a specific channel
 */
export function broadcastToChannel(channel: string, message: WSMessage): void {
  broadcast(message, (client) => client.subscriptions.has(channel));
}

/**
 * Get connected client count
 */
export function getClientCount(): number {
  return clients.size;
}

/**
 * Get all client IDs
 */
export function getClientIds(): string[] {
  return Array.from(clients.keys());
}

/**
 * Send agent status update
 */
export function broadcastAgentStatus(status: {
  agentId: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}): void {
  broadcastToChannel('agents', {
    type: 'agent_status',
    payload: status,
  });
}

/**
 * Send task progress update
 */
export function broadcastTaskProgress(taskId: string, progress: number, message?: string): void {
  broadcastToChannel('tasks', {
    type: 'task_progress',
    payload: { taskId, progress, message },
  });
}

/**
 * Send news update
 */
export function broadcastNewsUpdate(count: number): void {
  broadcastToChannel('news', {
    type: 'news_update',
    payload: { count, timestamp: new Date().toISOString() },
  });
}

/**
 * Send log entry
 */
export function broadcastLogEntry(entry: {
  level: string;
  message: string;
  taskId?: string;
  sessionId?: string;
}): void {
  broadcastToChannel('logs', {
    type: 'log_entry',
    payload: { ...entry, timestamp: new Date().toISOString() },
  });
}

/**
 * Stop WebSocket server
 */
export function stopWebSocket(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (wss) {
    wss.close();
    wss = null;
    clients.clear();
    console.log('[WS] WebSocket server stopped');
  }
}

/**
 * Generate unique client ID
 */
function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default {
  initializeWebSocket,
  sendToClient,
  broadcast,
  broadcastToChannel,
  getClientCount,
  getClientIds,
  broadcastAgentStatus,
  broadcastTaskProgress,
  broadcastNewsUpdate,
  broadcastLogEntry,
  stopWebSocket,
};
