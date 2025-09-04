class Socket {
  private socket: WebSocket | null = null;
  private hooks: ((event: MessageEvent) => void)[] = [];

  constructor(url?: string) {
    console.log('📦 Initializing WebSocket connection...');
    if (url) {
      this.connect(url);
    }
  }

  public registerWebSocketHook(hook: (event: MessageEvent) => void) {
    this.hooks.push(hook);
  }

  private executeWebSocketCallbacks(event: MessageEvent) {
    this.hooks.forEach((hook) => hook(event));
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
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
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
}

export default new Socket();
