import { RoomManager, WSocket } from '../../../plugins/rooms/WSocket/index.js';

import {
  type Tournament,
  status as statusEnum,
} from 'db/generated/client/index.js';

async function fetchTournament(uuid: string, socket: WSocket) {
  const response = await fetch(
    `http://localhost:5173/api/tournaments/${uuid}`,
    {
      // TODO: hardcoded localhost
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session=${socket.jwt}`,
        credentials: 'include',
      },
    }
  );
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(
      `Fetching tournament failed: ${response.status} ${response.statusText}`
    );
  }
  return (await response.json()) as Tournament;
}

export async function getTournament(uuid: string, socket: WSocket) {
  // get Tournament from RoomManager
  let tournament: Tournament | null = RoomManager.get(
    `tournament:${uuid}`
  )?.getData();
  if (!tournament) {
    // get Tournament from API
    tournament = await fetchTournament(uuid, socket);
  }
  return tournament;
}

async function postNewParticipant(uuid: string, socket: WSocket) {
  const response = await fetch(
    `http://localhost/api/tournaments/${uuid}/users`, // TODO: hardcoded localhost
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uuid: socket.uuid }),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Cannot join tournament: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

export async function handleJoinTournament(room: string, socket: WSocket) {
  const uuid = room.split(':')[1] as string;
  // get Tournament
  const tournament = await getTournament(uuid, socket);
  if (!tournament) {
    socket.sendError(`Tournament not found`);
    return;
  }

  // check status
  if (tournament.status !== statusEnum.outstanding) {
    socket.sendError(
      `Cannot join tournament \'${tournament.uuid}\': status: ${tournament.status}`
    );
    return;
  }

  const updatedTournament = await postNewParticipant(tournament.uuid, socket);
  RoomManager.get(`tournament:${tournament.uuid}`)?.setData(updatedTournament);

  socket.getUser()?.join(`tournament:${tournament.uuid}`);
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
