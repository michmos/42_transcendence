import { type SocketMessage } from '../../types/SocketMessage.js';

class Socket {
  private socket: WebSocket | null = null;
  private hooks: ((event: MessageEvent) => void)[] = [];

  constructor(url?: string) {
    console.log('📦 Initializing WebSocket connection...');
    if (url) {
      this.connect(url);
    }
    return this;
  }

  public registerWebSocketHook(hook: (event: MessageEvent) => void) {
    this.hooks.push(hook);
  }

  private executeWebSocketCallbacks(event: MessageEvent) {
    this.hooks.forEach((hook) => hook(event));
  }

  public connect(url: string, onOpen?: () => void) {
    console.log('Connecting to WebSocket server at', url);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      if (onOpen) onOpen();
    };

    this.socket.onmessage = (event) => {
      this.executeWebSocketCallbacks(event);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
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
