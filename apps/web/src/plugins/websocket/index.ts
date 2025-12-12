import { type SocketMessage } from '../../types/SocketMessage.js';

class Socket {
  private socket: WebSocket | null = null;
  private hooks: Array<(_event: MessageEvent) => void> = [];
  private connectionTries: number = 0;
  private reconnection: boolean = false;

  constructor(url?: string) {
    console.log('📦 Initializing WebSocket connection...');
    if (url) {
      this.connect(url);
    }
    return this;
  }

  public registerWebSocketHook(hook: (_event: MessageEvent) => void) {
    this.hooks.push(hook);
    return () => {
      this.hooks = this.hooks.filter((h) => h !== hook);
    };
  }

  private executeWebSocketCallbacks(event: MessageEvent) {
    this.hooks.forEach((hook) => hook(event));
  }

  private reconnect(url: string): void {
    this.reconnection = true;
    this.connectionTries += 1;

    if (this.connectionTries > 3) {
      if (
        window.confirm(
          'Unable to connect to the server after multiple attempts. Click OK to finish this Evaluation.'
        )
      ) {
        window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        return;
      }
      this.connectionTries = 0;
      this.reconnect(url);
      return;
    }
    console.log('Reconnecting to WebSocket server...');
    this.connect(url);

    setTimeout(() => {
      if (!this.isConnected()) {
        console.log('Reconnection attempt failed.');
        this.reconnect(url);
      } else {
        console.log('Reconnected to WebSocket server successfully.');
        this.reconnection = false;
        this.connectionTries = 0;
        return;
      }
    }, 1000);
  }

  public connect(url: string) {
    console.log('Connecting to WebSocket server at', url);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.socket.onmessage = (event) => {
      this.executeWebSocketCallbacks(event);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      if (!this.reconnection) this.reconnect(url);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (!this.reconnection) this.reconnect(url);
    };
  }

  public send(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.error('WebSocket is not open. Unable to send message:', message);
    }
  }

  public joinRoom(room: string, data?: object) {
    const message: SocketMessage = {
      type: 'join-room',
      room: room,
      ...(data && { data: data }),
    };
    this.send(JSON.stringify(message));
  }

  public leaveRoom(room: string, data?: object) {
    const message: SocketMessage = {
      type: 'leave-room',
      room: room,
      ...(data && { data: data }),
    };
    this.send(JSON.stringify(message));
  }

  public sendMessage(room: string, data: object) {
    const socketMessage: SocketMessage = {
      type: 'message',
      room: room,
      ...(data && { data: data }),
    };
    this.send(JSON.stringify(socketMessage));
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public getSocket(): WebSocket {
    return this.socket as WebSocket;
  }
}

export { Socket };
