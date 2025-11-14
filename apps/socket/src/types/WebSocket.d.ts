import 'ws';

declare module 'ws' {
  import { type SocketMetaData } from '../plugins/rooms/index.ts';

  interface WebSocket {
    join(roomName: string): void;
    leave(roomName: string): void;
    leaveAll(): void;
    upsertData(overrides: Partial<SocketMetaData>): void;
    getData(): SocketMetaData | undefined;
    isIn(roomName: string): boolean;
    isOnline(): boolean;
  }
}
