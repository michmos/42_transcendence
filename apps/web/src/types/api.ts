/**
 * API Type Definitions
 *
 * This file provides type definitions for API requests and responses.
 * It imports Prisma-generated types from the database package and defines
 * input types for API requests based on backend validation schemas.
 */

// Import Prisma-generated types from database package
import type {
  Tournament,
  TournamentRound,
  Match,
  status,
} from 'db/generated/client/index.js';

// Re-export Prisma types for convenience
export type { Tournament, TournamentRound, Match, status };

/**
 * Input type for creating a tournament
 * Based on validation schema: apps/api/src/routes/tournaments/validationSchemas.ts
 */
export interface CreateTournamentInput {
  tournamentName: string; // minLength: 1
  minPlayers: number; // minimum: 2, maximum: 8
  maxPlayers: number; // minimum: 2, maximum: 16
  lockTime?: number; // optional
  gameTime?: number; // optional
}

/**
 * Input type for joining a tournament
 * Based on validation schema: apps/api/src/routes/tournaments/validationSchemas.ts
 */
export interface JoinTournamentInput {
  uuid?: string; // optional - if not provided, adds current user
}
