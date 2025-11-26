export interface SocketMessage {
  type: 'join-room' | 'leave-room' | 'message';
  room: string;
  data?: object;
}
