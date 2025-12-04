import { WSocket } from '../../plugins/rooms/WSocket/index.js';
import { type Tournament } from 'db/generated/client/index.js';

async function fetchTournaments(socket: WSocket, queryString: string) {
  //TODO: api should be adapted to handle multiple statuses at once
  const response = await fetch(
    `http://localhost:5173/api/user/me/tournaments?${queryString}`,
    {
      // TODO: hardcoded localhost
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session=${socket.jwt}`,
      },
      credentials: 'include',
    }
  );
  if (!response.ok) {
    throw new Error(
      `Fetching tournaments failed: ${response.status} ${response.statusText}`
    );
  }

  const tournaments = (await response.json()) as Array<
    Partial<Tournament> & {
      uuid: string;
    }
  >;
  //TODO: api should be adapted to only return uuids in the first place
  const tournamentUuids = new Set<string>();
  for (const tournament of tournaments) {
    if (tournament.uuid) {
      tournamentUuids.add(tournament.uuid);
    }
  }
  return tournamentUuids;
}

async function fetchCurrentTournaments(socket: WSocket) {
  const myOutstandingTournaments = await fetchTournaments(
    socket,
    'status=outstanding'
  );
  const myOngoingTournaments = await fetchTournaments(socket, 'status=ongoing');
  const currentTournaments = new Set<string>([
    ...myOutstandingTournaments,
    ...myOngoingTournaments,
  ]);
  return currentTournaments;
}

// TODO: maybe implement cache to avoid fetching tournaments on every connection
export async function onOpen(socket: WSocket) {
  // join main room
  socket.join('tournament:main');

  // join current tournament rooms where user is participating
  socket.consoleLog('Fetching current tournaments');
  const currentTournaments = await fetchCurrentTournaments(socket);
  for (const uuid of currentTournaments) {
    socket.join(`tournament:${uuid}`);
    socket.consoleLog(`Joined tournament room: tournament:${uuid}`);
  }
}
