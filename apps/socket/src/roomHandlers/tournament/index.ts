import { type SocketMessage } from '../../plugins/rooms/index.js';
import { WebSocket } from 'ws';

export default {
  onStartup: async () => {
    console.log('This code is being run on server start');
    // e.g. fetching api for ongoing tournaments
  },
  onOpen: (socket: WebSocket) => {
    console.log('This code is run if a socket connects to the server');
    // e.g. add him to general tournaments channel
    // socket.join('tournament:main');
  },
  onMessage: (socket: WebSocket, message: SocketMessage) => {
    console.log('This code is run if a socket sends a message TO THIS HANDLER');
    // e.g. Tournament logic (create tournament, join tournament, leave tournament)
  },
  onClose: (socket: WebSocket) => {
    console.log('This code is run if a socket disconnects from a server');
    // e.g. remove him from tournament rooms (or leave him in)
  },
};
