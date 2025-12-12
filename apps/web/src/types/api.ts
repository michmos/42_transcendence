/**
 * API Type Definitions
 *
 * This file provides type definitions for API requests and responses.
 * It imports Prisma-generated types from the database package and defines
 * input types for API requests based on backend validation schemas.
 */

// Import Prisma-generated types from database package
import type { status, User as PrismaUser } from 'db/generated/client/index.js';

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
}

/**
 * Input type for joining a tournament
 * Based on validation schema: apps/api/src/routes/tournaments/validationSchemas.ts
 */
export interface JoinTournamentInput {
  alias: string; // required - alias/display name for the tournament
  uuid?: string; // optional - if not provided, adds current user
}
