import { type SocketMessage, userIsOnline } from '../../plugins/rooms/index.js';
import {
  RoomManager,
  WSocket,
  User,
} from '../../plugins/rooms/WSocket/index.js';

export default {
  onStartup: async () => {
    console.log('This code is being run on server start');
    // e.g. fetching api for ongoing tournaments
  },
  onOpen: async (socket: WSocket) => {
    socket.join('online:main');

    // GET user nickname through their uuid


    if (socket.getUser()?.getConnectionCount() === 1) {
      RoomManager.get('online:main')?.broadcast(`${socket.uuid} went online`);
    }
  },
  onClose: async (socket: WSocket) => {
    socket.leave('online:main');

    // GET user nickname through their uuid
    // const nickname = 

    if (!userIsOnline(socket.uuid)) {
      RoomManager.get('online:main')?.broadcast(`${socket.uuid} went offline`);
    }
  },
};
