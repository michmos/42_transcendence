import { type SocketMessage } from '../../../plugins/rooms/index.js';
import { WSocket } from '../../../plugins/rooms/WSocket/index.js';

import { handleJoinTournament } from './joinTournament.js';
import { handleTournamentCreation } from './createTournament.js';
import { handleLeaveTournament } from './leaveTournament.js';

export async function onMessage(socket: WSocket, message: SocketMessage) {
  // get tournaments from cache or api
  switch (message.type) {
    case 'join-room':
      if (message.data) {
        await handleTournamentCreation(message.data, socket);
      } else {
        await handleJoinTournament(message.room, socket);
      }
      break;
    case 'leave-room':
      await handleLeaveTournament(message.room, socket);
      break;
    case 'message':
      socket.consoleLog('tournament handler: invalid message type');
      socket.sendError('invalid message type');
      break;
  }
}
