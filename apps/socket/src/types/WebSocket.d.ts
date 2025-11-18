import 'ws';

declare module 'ws' {
  import { type SocketMetaData } from '../plugins/rooms/index.ts';
  import { Room } from '../plugins/rooms/RoomManager/index.ts';

  interface WebSocket {
    join(roomName: string): Room;
    leave(roomName: string): Room;
    leaveAll(): void;
    upsertData(overrides: Partial<SocketMetaData>): SocketMetaData;
    getData(): SocketMetaData | undefined;
    isInRoom(roomName: string): boolean;
    isOnline(): boolean;
    sendSuccess(): void;
    sendError(message?: string): void;
    updateConnection(uuid: string, jwt: string);
  }
}
