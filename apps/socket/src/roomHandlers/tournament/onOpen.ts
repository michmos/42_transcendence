import { WSocket } from '../../plugins/rooms/WSocket/index.js';

import * as API from '../../plugins/api/tournament.js';

// TODO: LOW PRIO: maybe implement cache to avoid fetching tournaments on every connection
export async function onOpen(socket: WSocket) {
  // join main room
  socket.join('tournament:main');

  // join current tournament rooms where user is participating
  socket.consoleLog('Fetching current tournaments');
  const currentTournaments = await API.fetchCurrentTournaments(socket);
  for (const uuid of currentTournaments) {
    socket.join(`tournament:${uuid}`);
    socket.consoleLog(`Joined tournament room: tournament:${uuid}`);
  }
}
