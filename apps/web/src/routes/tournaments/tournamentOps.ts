import type { Tournament } from '../../types/api.js';
import { handleApiError, showApiError } from '../../utils/api-helpers.js';

export async function createTournament(specs: {
  tournamentName: string;
  maxPlayers: number;
  minPlayers: number;
}): Promise<Tournament | null> {
  const response = await fetch('/api/tournaments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      ...specs,
    }),
  });
  if (!response.ok) {
    const error = await handleApiError(response);
    showApiError(error);
    return null;
  }
  const tournament = (await response.json()) as Tournament;
  return tournament;
}

export async function joinTournament(
  tournamentUuid: string,
  alias: string
): Promise<boolean> {
  const response = await fetch(`/api/tournaments/${tournamentUuid}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      alias,
    }),
  });
  if (!response.ok) {
    const error = await handleApiError(response);
    showApiError(error);
    return false;
  }

  window.socket.joinRoom(`tournament:${tournamentUuid}`);
  return true;
}

export async function leaveTournament(
  tournamentUuid: string
): Promise<boolean> {
  const response = await fetch(`/api/tournaments/${tournamentUuid}/users`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const error = await handleApiError(response);
    showApiError(error);
    return false;
  }
  window.socket.leaveRoom(`tournament:${tournamentUuid}`);
  return true;
}

export async function startTournament(
  tournamentUuid: string
): Promise<boolean> {
  const response = await fetch(`/api/tournaments/${tournamentUuid}/start`, {
    method: 'PATCH',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await handleApiError(response);
    showApiError(error);
    return false;
  }
  return true;
}
