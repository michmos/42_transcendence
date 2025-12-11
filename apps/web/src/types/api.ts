/**
 * API Type Definitions
 *
 * This file provides type definitions for API requests and responses.
 * It imports Prisma-generated types from the database package and defines
 * input types for API requests based on backend validation schemas.
 */

// Import Prisma-generated types from database package
import type {
  Tournament as PrismaTournament,
  TournamentRound as PrismaTournamentRound,
  Match as PrismaMatch,
  status,
  User as PrismaUser,
} from 'db/generated/client/index.js';

// Extend types to include relations used in the frontend
export type Match = PrismaMatch;

export interface TournamentRound extends PrismaTournamentRound {
  matches: Match[];
}

export interface Tournament extends PrismaTournament {
  participants?: Array<{
    uuid: string; // Participation record UUID (not user UUID)
    alias: string; // Tournament-specific alias
    user: {
      uuid: string; // User UUID
      nickname?: string;
    };
  }>;
  rounds?: TournamentRound[];
}

export type { status };
export type User = PrismaUser;

// Import TournamentParticipation from types package
export type { TournamentParticipation } from 'types';

/**
 * Input type for creating a tournament
 * Based on validation schema: apps/api/src/routes/tournaments/validationSchemas.ts
 */
export interface CreateTournamentInput {
  tournamentName: string; // minLength: 1
  minPlayers: number; // minimum: 2, maximum: 8
  maxPlayers: number; // minimum: 2, maximum: 16
  alias: string; // minLength: 1, maxLength: 50
  lockTime?: number; // optional
  gameTime?: number; // optional
}

/**
 * Input type for joining a tournament
 * Based on validation schema: apps/api/src/routes/tournaments/validationSchemas.ts
 */
export interface JoinTournamentInput {
  alias: string; // required - alias/display name for the tournament
  uuid?: string; // optional - if not provided, adds current user
}
