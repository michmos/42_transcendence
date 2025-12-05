import { Socket } from './index.js';

/**
 * Tournament Socket Message Types
 * Note: Messages use 'event' field, not 'type' field
 */
interface TournamentSocketMessage {
  event:
    | 'tournament-created'
    | 'tournament-started'
    | 'tournament-joined'
    | 'tournament-left'
    | 'tournament-updated'
    | 'match-updated'
    | 'round-completed';
  uuid?: string;
  playerCount?: number;
  data?: unknown;
}

/**
 * Tournament Socket Client
 *
 * Handles WebSocket connections for tournament real-time updates.
 * Works gracefully without backend support (falls back to polling).
 *
 * Note: Your teammate will provide joinTournament/leaveTournament functions
 * that use window.socket - this client is for listening to updates.
 */
class TournamentSocket {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private isInitialized = false;

  constructor() {
    // Don't auto-connect - wait for explicit initialization
  }

  /**
   * Initialize the tournament socket connection
   * Call this when entering a tournament-related page
   */
  public initialize() {
    if (this.isInitialized) {
      return; // Already initialized
    }

    try {
      const wsUrl = `${
        window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      }//${window.location.host}/websocket`;
      this.socket = new Socket(wsUrl);

      this.socket.registerWebSocketHook((event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data as string) as unknown;
          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'event' in parsed
          ) {
            const message = parsed as TournamentSocketMessage;
            this.handleMessage(message);
          }
        } catch {
          // Not a tournament message, ignore
        }
      });

      // Wait for connection to be established before joining rooms
      // The socket will auto-connect, but we need to wait a bit
      setTimeout(() => {
        if (this.socket?.isConnected()) {
          this.joinTournamentList();
        }
      }, 500);

      this.isConnected = true;
      this.isInitialized = true;
      this.reconnectAttempts = 0;
    } catch (error) {
      console.warn(
        'Tournament socket connection failed, falling back to polling:',
        error
      );
      this.isConnected = false;
      this.attemptReconnect();
    }
  }

  /**
   * Handle incoming socket messages
   */
  private handleMessage(message: TournamentSocketMessage) {
    // Only handle tournament-related messages
    if (!message.event || !message.event.startsWith('tournament-')) {
      return;
    }

    // Trigger listeners for this event type
    const listeners = this.listeners.get(message.event);
    if (listeners) {
      // Pass the full message data (uuid, playerCount, etc.)
      const eventData: unknown = {
        uuid: message.uuid,
        playerCount: message.playerCount,
        ...message.data,
      };
      listeners.forEach((callback) => callback(eventData));
    }
  }

  /**
   * Join the tournament list room (tournament:main)
   * This allows receiving updates about all tournaments
   */
  public joinTournamentList() {
    if (!this.socket || !this.socket.isConnected()) {
      console.warn('Socket not connected, cannot join tournament list');
      return;
    }
    try {
      this.socket.joinRoom('tournament:main');
    } catch (error) {
      console.warn('Failed to join tournament list room:', error);
    }
  }

  /**
   * Join a specific tournament room
   * Note: Your teammate will provide joinTournament() function that uses window.socket
   * This is a helper that uses our internal socket instance
   */
  public joinTournament(uuid: string) {
    if (!this.socket || !this.socket.isConnected()) {
      console.warn('Socket not connected, cannot join tournament');
      return;
    }
    try {
      this.socket.joinRoom(`tournament:${uuid}`);
    } catch (error) {
      console.warn(`Failed to join tournament ${uuid} room:`, error);
    }
  }

  /**
   * Leave a specific tournament room
   * Note: Your teammate will provide leaveTournament() function that uses window.socket
   */
  public leaveTournament(uuid: string) {
    if (!this.socket || !this.socket.isConnected()) return;
    try {
      this.socket.leaveRoom(`tournament:${uuid}`);
    } catch (error) {
      console.warn(`Failed to leave tournament ${uuid} room:`, error);
    }
  }

  /**
   * Register a listener for tournament events
   */
  public on(
    event:
      | 'tournament-created'
      | 'tournament-started'
      | 'tournament-joined'
      | 'tournament-left'
      | 'tournament-updated'
      | 'match-updated'
      | 'round-completed',
    callback: (data: unknown) => void
  ) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(callback);
    }
  }

  /**
   * Remove a listener for tournament events
   */
  public off(
    event:
      | 'tournament-created'
      | 'tournament-started'
      | 'tournament-joined'
      | 'tournament-left'
      | 'tournament-updated'
      | 'match-updated'
      | 'round-completed',
    callback: (data: unknown) => void
  ) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Attempt to reconnect if connection failed
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(
        'Max reconnection attempts reached, socket features disabled'
      );
      return;
    }
    this.reconnectAttempts++;
    setTimeout(() => {
      this.isInitialized = false; // Reset to allow re-initialization
      this.initialize();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Cleanup and disconnect
   * Call this when leaving tournament pages
   */
  public disconnect() {
    // Clear all listeners
    this.listeners.clear();
    // Note: Socket class doesn't have explicit disconnect, but we mark as disconnected
    this.isConnected = false;
    this.isInitialized = false;
    // The socket will be garbage collected if not referenced elsewhere
  }

  /**
   * Check if socket is connected
   */
  public getIsConnected(): boolean {
    return this.isConnected && this.socket?.isConnected() === true;
  }
}

// Export singleton instance
export const tournamentSocket = new TournamentSocket();
export default tournamentSocket;
