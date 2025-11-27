import { type SocketMessage } from '../../plugins/rooms/index.js';
import { WSocket } from '../../plugins/rooms/WSocket/index.js';
import { onOpen } from './onOpen.js';
import { onMessage } from './onMessage.js';

export default {
  onOpen: (socket: WSocket) => {
    onOpen(socket);
  },
  onMessage: (socket: WSocket, message: SocketMessage) => {
    onMessage(socket, message);
  },
};
