import WebSocket from 'ws';

class Socket {
  private socket: WebSocket | null = null;
  private sessionCookie: string | null = null;

  constructor(url?: string, sessionCookie?: string) {
    this.sessionCookie = sessionCookie || null;
    if (url) {
      this.connect(url, sessionCookie);
    }
    return this;
  }

  public waitingForConnection(): Promise<void> {
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.isConnected()) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  public connect(url: string, sessionCookie?: string): void {
    if (sessionCookie) {
      this.sessionCookie = sessionCookie;
    }

    const options: WebSocket.ClientOptions = {};
    if (this.sessionCookie) {
      options.headers = {
        Cookie: `session=${this.sessionCookie}`,
      };
    }

    this.socket = new WebSocket(url, options);

    this.socket.on('message', (data: WebSocket.Data): void => {
      console.log('Received message:', data.toString());
    });

    this.socket.on('close', (code: number, reason: Buffer): void => {
      console.log(
        `WebSocket connection closed: [${code}] ${reason.toString()}`
      );
    });

    this.socket.on('error', (error: Error): void => {
      console.error('WebSocket error:', error);
    });
  }

  public sendMessage(room: string, data: object) {
    const message = {
      type: 'message',
      room: room,
      data: data,
    };
    this.send(JSON.stringify(message));
  }

  public send(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.error('WebSocket is not open. Unable to send message:', message);
    }
  }

  public joinRoom(room: string) {
    const message = JSON.stringify({ type: 'join-room', room });
    console.log('Sending join-room message:', message);
    this.send(message);
  }

  public leaveRoom(room: string) {
    const message = JSON.stringify({ type: 'leave-room', room });
    console.log('Sending leave-room message:', message);
    this.send(message);
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public getSocket(): WebSocket {
    return this.socket as WebSocket;
  }
}

export { Socket, WebSocket };
