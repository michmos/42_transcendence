import { RoomManager, WSocket } from '../../../plugins/rooms/WSocket/index.js';

import { type Tournament } from 'db/generated/client/index.js';

async function postTournament(data: any, socket: WSocket) {
  const response = await fetch(`http://localhost:5173/api/tournaments`, {
    // TODO: hardcoded localhost
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session=${socket.jwt}`,
      credentials: 'include',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(
      `Tournament creation failed: ${response.status} ${response.statusText}`
    );
  }
  return (await response.json()) as Tournament;
}

export async function handleTournamentCreation(data: any, socket: WSocket) {
  const tournament = await postTournament(data, socket);
  const user = socket.getUser();
  if (!user) {
    throw new Error('Runtime error: socket has no associated user');
  }

  user.join(`tournament:${tournament.uuid}`);
  socket.send('success'); // TODO: change

  RoomManager.get(`tournament:${tournament.uuid}`)?.setData(tournament);

  RoomManager.get('tournament:main')?.broadcast(
    JSON.stringify({
      type: 'tournament-created',
      data: tournament,
    })
  );
}
