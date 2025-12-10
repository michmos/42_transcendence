import type { Tournament } from '../../types/api.js';

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
    // TODO: handle error
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
    // TODO: handle error
    return false;
  }

  // Store the alias in localStorage for this tournament
  // This allows us to identify the user's matches without relying on backend participants data
  localStorage.setItem(`tournament-${tournamentUuid}-alias`, alias);
  console.log(
    `💾 Stored tournament alias: "${alias}" for tournament ${tournamentUuid}`
  );

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
    // TODO: handle error
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
    // TODO: handle error
    return false;
  }
  return true;
}
