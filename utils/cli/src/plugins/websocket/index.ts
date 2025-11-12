import WebSocket from 'ws';

class Socket {
  private socket: WebSocket | null = null;

  constructor(url?: string) {
    if (url) {
      this.connect(url);
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

  public connect(url: string): void {
    this.socket = new WebSocket(url);

    // this.socket.on('message', (data: WebSocket.Data): void => {
    //   console.log('Received message:', data.toString());
    // });

    this.socket.on('close', (code: number, reason: Buffer): void => {
      console.log(
        `WebSocket connection closed: [${code}] ${reason.toString()}`
      );
    });

    this.socket.on('error', (error: Error): void => {
      console.error('WebSocket error:', error);
    });
  }

  public sendMessage(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.error('WebSocket is not open. Unable to send message:', message);
    }
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public getSocket(): WebSocket {
    return this.socket as WebSocket;
  }
}

export { Socket };
