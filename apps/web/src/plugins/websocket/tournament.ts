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
  tournamentName?: string;
  data?: unknown;
}

/**
 * Tournament Socket Client
 *
 * Handles WebSocket listeners for tournament real-time updates.
 * Uses the existing window.socket connection (created in app.ts).
 */
class TournamentSocket {
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private isInitialized = false;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor() {
    // Don't auto-initialize - wait for explicit initialization
  }

  /**
   * Initialize tournament socket listeners
   * Call this when entering a tournament-related page
   * Uses the existing window.socket connection
   */
  public initialize() {
    if (this.isInitialized) {
      return; // Already initialized
    }

    if (!window.socket) {
      console.warn(
        'window.socket not available, tournament socket features disabled'
      );
      return;
    }

    // Register message handler on the existing socket
    this.messageHandler = (event: MessageEvent) => {
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
    };

    // TODO: Needs unregister method
    window.socket.registerWebSocketHook(this.messageHandler);
    this.isInitialized = true;
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
      // Pass the full message data (uuid, playerCount, tournamentName, etc.)
      const eventData: unknown = {
        uuid: message.uuid,
        playerCount: message.playerCount,
        tournamentName: message.tournamentName,
        ...[message.data],
      };
      listeners.forEach((callback) => callback(eventData));
    }
  }

  /**
   * Join a specific tournament room
   * Uses window.socket (same as tournamentOps.ts and tournament.ts API)
   */
  public joinTournament(uuid: string) {
    if (window.socket) {
      window.socket.joinRoom(`tournament:${uuid}`);
    }
  }

  /**
   * Leave a specific tournament room
   * Uses window.socket (same as tournamentOps.ts and tournament.ts API)
   */
  public leaveTournament(uuid: string) {
    if (window.socket) {
      window.socket.leaveRoom(`tournament:${uuid}`);
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
   * Cleanup and disconnect
   * Call this when leaving tournament pages
   */
  public disconnect() {
    // Remove message handler from socket
    if (this.messageHandler && window.socket) {
      // Note: Socket class doesn't have unregisterWebSocketHook, but we can clear listeners
      // The hook will remain but won't do anything since listeners are cleared
    }
    // Clear all listeners
    this.listeners.clear();
    this.isInitialized = false;
  }

  /**
   * Check if socket is connected
   */
  public getIsConnected(): boolean {
    return window.socket?.isConnected() === true;
  }
}

// Export singleton instance
export const tournamentSocket = new TournamentSocket();
export default tournamentSocket;
