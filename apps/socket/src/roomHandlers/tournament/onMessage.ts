import { type SocketMessageType } from '../../plugins/rooms/index.js';
import { RoomManager, WSocket } from '../../plugins/rooms/WSocket/index.js';
import { participatesInTournament } from '../../routes/tournaments/index.js';

function handleJoinRoom(room: string, socket: WSocket) {
  const tournamentUuid = room.split(':')[1] as string;
  // check participation
  if (!participatesInTournament(socket.uuid, tournamentUuid)) {
    socket.consoleError(`tried to join tournament room without participation`);
    return;
  }

  // add USER to tournament room
  socket.getUser()?.join(room);
}

function handleLeaveRoom(room: string, socket: WSocket) {
  // check whether is in room
  if (!RoomManager.get(room)?.has(socket)) {
    socket.consoleError(
      `tried to leave tournament room without being in there`
    );
    return;
  }
  socket.getUser()?.leave(room);
}

export function onMessage(socket: WSocket, message: SocketMessageType) {
  // get tournaments from cache or api
  switch (message.type) {
    case 'join-room':
      handleJoinRoom(message.room, socket);
      break;
    case 'leave-room':
      handleLeaveRoom(message.room, socket);
      break;
  }
}
