export type SocketMessage = {
  type: 'join-room' | 'leave-room' | 'message';
  room: string;
  data?: any;
};
