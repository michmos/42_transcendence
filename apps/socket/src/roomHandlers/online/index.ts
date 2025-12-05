import {
  RoomManager,
  WSocket,
  User,
} from '../../plugins/rooms/WSocket/index.js';

export default {
  onStartup: async () => {
    console.log('Loading up Online room');
  },
  onOpen: async (socket: WSocket) => {

    socket.join('online');

    // If user's now only has 1 socket with online room, broadcast
    // RoomManager.get('online')?.broadcast({ nickname: 'name', isOnline: true});
  },
  onClose: async (socket: WSocket) => {
    console.log('This code is run if a socket disconnects from a server');
    // e.g. remove him from tournament rooms (or leave him in)

    socket.leave('online');

    // If use robject has no more active sockets:
    // RoomManager.get('online')?.broadcast({ nickname: 'name' ,isOnline: false});
  },
};
