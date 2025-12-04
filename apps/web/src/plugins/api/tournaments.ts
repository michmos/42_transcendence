import type { Tournament, TournamentRound } from '../../types/api.js';

const TournamentAPI = {
  async getTournament(id: string): Promise<Tournament | null> {
    try {
      const response = await fetch(`/api/tournaments/${id}`);
      if (!response.ok) return null;
      return (await response.json()) as Tournament;
    } catch (error) {
      console.error('Error fetching tournament:', error);
      return null;
    }
  },

  async getTournamentRound(
    id: string,
    index: number
  ): Promise<TournamentRound | null> {
    try {
      const response = await fetch(`/api/tournaments/${id}/rounds/${index}`);
      if (!response.ok) return null;
      return (await response.json()) as TournamentRound;
    } catch (error) {
      console.error('Error fetching tournament round:', error);
      return null;
    }
  },

  async startTournament(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/tournaments/${id}/start`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error starting tournament:', error);
      return false;
    }
  },

  async joinTournament(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/tournaments/${id}/join`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error joining tournament:', error);
      return false;
    }
  },
};

export default TournamentAPI;
