import type { Tournament } from 'db/generated/client/index.js';

const TournamentAPI = {
  async createTournament(specs: {
    tournamentName: string;
    maxPlayers: number;
    minPlayers: number;
  }): Promise<Tournament> {
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
      throw new Error('Failed to create tournament');
    }
    return (await response.json()) as Tournament;
  },
  async joinTournament(tournamentUuid: string, alias: string) {
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
      throw new Error('Failed to join tournament');
    }
    window.socket.joinRoom(`tournament:${tournamentUuid}`);
  },
  async leaveTournament(tournamentUuid: string) {
    const response = await fetch(`/api/tournaments/${tournamentUuid}/users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      throw new Error('Failed to leave tournament');
    }
    window.socket.leaveRoom(`tournament:${tournamentUuid}`);
  },
  async startTournament(tournamentUuid: string) {
    const response = await fetch(`/api/tournaments/${tournamentUuid}/start`, {
      method: 'PATCH',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to start tournament');
    }
  },
};

export default TournamentAPI;
