import { WSocket } from '../../plugins/rooms/WSocket/index.js';
import { env } from '../../env.js';
import { type TournamentParticipation } from 'types';

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

  const participations =
    (await response.json()) as Array<TournamentParticipation>;
  const tournamentUuids = new Set<string>();
  for (const part of participations) {
    tournamentUuids.add(part.tournamentId);
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
