import { RoomManager, WSocket } from '../../../plugins/rooms/WSocket/index.js';

import {
  type Tournament,
  status as statusEnum,
} from 'db/generated/client/index.js';

async function deleteParticipant(uuid: string, socket: WSocket) {
  const response = await fetch(
    `http://localhost/api/tournament/${uuid}/users/${socket.uuid}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  if (!response.ok) {
    throw new Error(
      `Cannot leave tournament: ${response.status} ${response.statusText}`
    );
  }
  return (await response.json()) as Tournament;
}

export async function handleLeaveTournament(room: string, socket: WSocket) {
  if (!socket.isInRoom(room)) {
    socket.sendError(`Not in room ${room}`);
    return;
  }
  const tournament: Tournament = RoomManager.get(room)?.getData();

  // check status
  if (tournament.status !== statusEnum.outstanding) {
    socket.sendError(
      `Cannot leave tournament \'${tournament.uuid}\': status: ${tournament.status}`
    );
    return;
  }

  const updatedTournament = await deleteParticipant(tournament.uuid, socket);
  RoomManager.get(room)?.setData(updatedTournament);

  socket.getUser()?.leave(room);
  socket.sendSuccess();

  RoomManager.get('tournament:main')?.broadcast(
    JSON.stringify({
      type: 'tournament-updated',
      data: {
        uuid: updatedTournament.uuid,
        status: updatedTournament.status,
        playerCount: updatedTournament.playerCount,
      },
    })
  );
}
