import { WSocket } from '../../plugins/rooms/WSocket/index.js';
import { type Tournament } from 'db/generated/client/index.js';
import { env } from '../../env.js';

export async function fetchTournaments(socket: WSocket, queryString: string) {
  const response = await fetch(
    `${env.API_SERVER}/user/me/tournaments?${queryString}`,
    {
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

export async function fetchCurrentTournaments(socket: WSocket) {
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
