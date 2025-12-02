import { type SocketMessageType } from '../../plugins/rooms/index.js';
import { WSocket } from '../../plugins/rooms/WSocket/index.js';
import { onOpen } from './onOpen.js';
import { onMessage } from './onMessage.js';

export default {
  onOpen: async (socket: WSocket) => {
    await onOpen(socket);
  },
  onMessage: async (socket: WSocket, message: SocketMessageType) => {
    await onMessage(socket, message);
  },
};
