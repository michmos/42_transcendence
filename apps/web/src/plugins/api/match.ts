import type { MatchResponse } from 'types';

const MatchAPI = {
  /**
   * Get a match by UUID
   * @param matchUuid - Match UUID
   * @returns Promise<MatchResponse | null> - Match details or null if not found
   * @throws Error if request fails
   */
  async getMatch(matchUuid: string): Promise<MatchResponse | null> {
    try {
      const response = await fetch(`/api/match/${matchUuid}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch match: ${response.status}`);
      }

      return (await response.json()) as MatchResponse;
    } catch (error) {
      console.error('Error fetching match:', error);
      return null;
    }
  },
};

export default MatchAPI;
