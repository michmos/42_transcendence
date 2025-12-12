import type {
  CreateTournamentInput,
  JoinTournamentInput,
  TournamentParticipantsResponse,
} from '../../types/api.js';

import type { Tournament, status } from 'db/generated/client/index.js';

import type { TournamentParticipation, TournamentRoundResponse } from 'types';

/**
 * Tournament API Client
 *
 * Provides functions to interact with tournament endpoints.
 * All functions use credentials: 'include' for authentication.
 */

const TournamentsAPI = {
  /**
   * Get all tournaments, optionally filtered by status
   * @param status - Optional status filter ('outstanding' | 'ongoing' | 'finished' | 'canceled')
   * @returns Promise<Tournament[]> - Array of tournaments
   */
  async getTournaments(status?: status): Promise<Tournament[]> {
    try {
      const url = status
        ? `/api/tournaments?status=${status}`
        : '/api/tournaments';
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tournaments: ${response.status}`);
      }

      return (await response.json()) as Tournament[];
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      return [];
    }
  },

  /**
   * Get tournaments where the current user is a participant
   * @param status - Optional status filter ('outstanding' | 'ongoing' | 'finished' | 'canceled')
   * @returns Promise<TournamentParticipation[]> - Array of tournament participations with tournamentId and alias
   */
  async getMyTournaments(status?: status): Promise<TournamentParticipation[]> {
    try {
      const url = status
        ? `/api/user/me/tournaments?status=${status}`
        : '/api/user/me/tournaments';
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch my tournaments: ${response.status}`);
      }

      return (await response.json()) as TournamentParticipation[];
    } catch (error) {
      console.error('Error fetching my tournaments:', error);
      return [];
    }
  },

  /**
   * Get a single tournament by UUID
   * @param uuid - Tournament UUID
   * @returns Promise<Tournament | null> - Tournament or null if not found
   */
  async getTournament(uuid: string): Promise<Tournament | null> {
    try {
      const response = await fetch(`/api/tournaments/${uuid}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch tournament: ${response.status}`);
      }

      return (await response.json()) as Tournament;
    } catch (error) {
      console.error('Error fetching tournament:', error);
      return null;
    }
  },

  /**
   * Create a new tournament
   * @param data - Tournament creation data
   * @returns Promise<Tournament> - Created tournament
   * @throws Error if creation fails (400 validation, 401 unauthorized)
   */
  async createTournament(data: CreateTournamentInput): Promise<Tournament> {
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in to create a tournament');
      }

      if (response.status === 400) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errorData.error || 'Validation error - Please check your input'
        );
      }

      if (!response.ok) {
        throw new Error(`Failed to create tournament: ${response.status}`);
      }

      return (await response.json()) as Tournament;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  },

  /**
   * Join a tournament (add user to tournament)
   * @param tournamentUuid - Tournament UUID
   * @param alias - Alias/display name for the tournament
   * @param userUuid - Optional user UUID (if not provided, adds current user)
   * @returns Promise<Tournament> - Updated tournament
   * @throws Error if join fails (401, 404, 422)
   */
  async joinTournament(
    tournamentUuid: string,
    alias: string,
    userUuid?: string
  ): Promise<Tournament> {
    try {
      const body: JoinTournamentInput = { alias };
      if (userUuid) {
        body.uuid = userUuid;
      }

      const response = await fetch(`/api/tournaments/${tournamentUuid}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in to join a tournament');
      }

      if (response.status === 404) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error || 'Tournament or user not found');
      }

      if (response.status === 422) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errorData.error ||
            'Tournament cannot be joined (full, locked, or canceled)'
        );
      }

      if (!response.ok) {
        throw new Error(`Failed to join tournament: ${response.status}`);
      }

      // Join socket room if available
      if (window.socket) {
        window.socket.joinRoom(`tournament:${tournamentUuid}`);
      }

      // Response is 204, but backend returns tournament in body
      return (await response.json()) as Tournament;
    } catch (error) {
      console.error('Error joining tournament:', error);
      throw error;
    }
  },

  /**
   * Leave a tournament (remove user from tournament)
   * @param tournamentUuid - Tournament UUID
   * @returns Promise<void>
   * @throws Error if leave fails (401, 404, 422)
   */
  async leaveTournament(tournamentUuid: string): Promise<void> {
    try {
      const response = await fetch(`/api/tournaments/${tournamentUuid}/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in to leave a tournament');
      }

      if (response.status === 404) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error || 'Tournament not found');
      }

      if (response.status === 422) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errorData.error ||
            'Tournament cannot be left (already started or canceled)'
        );
      }

      if (!response.ok) {
        throw new Error(`Failed to leave tournament: ${response.status}`);
      }

      // Leave socket room if available
      if (window.socket) {
        window.socket.leaveRoom(`tournament:${tournamentUuid}`);
      }
    } catch (error) {
      console.error('Error leaving tournament:', error);
      throw error;
    }
  },

  /**
   * Start a tournament (only if user is participant and min players reached)
   * @param tournamentUuid - Tournament UUID
   * @returns Promise<Tournament> - Updated tournament
   * @throws Error if start fails (401, 403 not participant, 404, 422 validation)
   */
  async startTournament(tournamentUuid: string): Promise<Tournament> {
    try {
      const response = await fetch(`/api/tournaments/${tournamentUuid}/start`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - Please log in to start a tournament');
      }

      if (response.status === 403) {
        throw new Error(
          'Forbidden - You must be a participant to start this tournament'
        );
      }

      if (response.status === 404) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error || 'Tournament not found');
      }

      if (response.status === 422) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errorData.error ||
            'Tournament cannot be started (not enough players or wrong status)'
        );
      }

      if (!response.ok) {
        throw new Error(`Failed to start tournament: ${response.status}`);
      }

      return (await response.json()) as Tournament;
    } catch (error) {
      console.error('Error starting tournament:', error);
      throw error;
    }
  },

  async getTournamentParticipants(
    tournamentUuid: string
  ): Promise<TournamentParticipantsResponse> {
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentUuid}/participants`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      // TODO: @pminialg -> maybe you want to handle differently
      if (response.status === 404) {
        throw new Error(`Tournament not found: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch tournament: ${response.status}`);
      }

      return (await response.json()) as TournamentParticipantsResponse;
    } catch (error) {
      // TODO: @pminialg -> maybe you want to handle differently
      console.error('Error fetching tournament:', error);
      throw error;
    }
  },

  /**
   * Get a tournament round by tournament UUID and round index
   * @param tournamentUuid - Tournament UUID
   * @param roundIndex - Round index (0-based)
   * @returns Promise<TournamentRound | null> - Tournament round or null if not found
   * @throws Error if access fails (403 not participant, 404 not found)
   */
  async getTournamentRound(
    tournamentUuid: string,
    roundIndex: number
  ): Promise<TournamentRoundResponse | null> {
    try {
      const response = await fetch(
        `/api/tournaments/${tournamentUuid}/rounds/${roundIndex}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.status === 403) {
        throw new Error(
          'Forbidden - You must be a participant to view this round'
        );
      }

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch tournament round: ${response.status}`);
      }

      return (await response.json()) as TournamentRoundResponse;
    } catch (error) {
      console.error('Error fetching tournament round:', error);
      return null;
    }
  },
};

export default TournamentsAPI;
