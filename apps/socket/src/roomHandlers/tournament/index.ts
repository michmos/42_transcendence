import { type SocketMessage } from '../../plugins/rooms/index.js';
import { WSocket } from '../../plugins/rooms/WSocket/index.js';
import { onOpen } from './onOpen.js';
import { onMessage } from './onMessage.js';

export default {
  onOpen: async (socket: WSocket) => {
    await onOpen(socket);
  },
  onMessage: async (socket: WSocket, message: SocketMessage) => {
    await onMessage(socket, message);
  },
};
