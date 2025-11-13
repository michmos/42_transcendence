import 'ws';

declare module 'ws' {
  interface WebSocket {
    join(roomName: string): void;
    leave(roomName: string): void;
    leaveAll(): void;
    setData(data: any): void;
    getData(): any;
    isIn(roomName: string): boolean;
  }
}
