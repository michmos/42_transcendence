import type { MatchResponse } from 'types';
import { handleApiError } from '../../utils/api-helpers.js';

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

      if (!response.ok) {
        await handleApiError(response);
        return null;
      }

      return (await response.json()) as MatchResponse;
    } catch (error) {
      console.error('Error fetching match:', error);
      return null;
    }
  },
};

export default MatchAPI;
