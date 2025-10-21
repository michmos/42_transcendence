import { Type, type Static } from '@sinclair/typebox';
import { status as statusEnum } from 'db/generated/client/index.js';

// here you can define validation schemas using typebox syntax
// 1. provide an object for runtime validation
// 2. also export the type of that object for compile time validation

// POST /tournaments
export const createTournament = {
  body: Type.Object(
    {
      tournamentName: Type.String({ minLength: 1 }),
      minPlayers: Type.Integer({ minimum: 2 }),
      maxPlayers: Type.Integer({ minimum: 2 }),
      lockTime: Type.Optional(Type.Integer()),
      gameTime: Type.Optional(Type.Integer()),
    },
    { additionalProperties: false }
  ),
} as const;
export type createTournament = Static<typeof createTournament.body>;

// GET /tournaments
export const getTournaments = {
  querystring: Type.Object({
    status: Type.Optional(
      Type.Union(Object.values(statusEnum).map((value) => Type.Literal(value)))
    ),
  }),
};
export type getTournaments = Static<typeof getTournaments.querystring>;

// GET /tournaments/:uuid
export const getTournament = {
  params: Type.Object({
    uuid: Type.String(),
  }),
};
export type getTournament = Static<typeof getTournament.params>;

// POST /tournaments/:tournamentId/users
export const addUser = {
  params: Type.Object({
    uuid: Type.String(),
  }),
  body: Type.Object({
    uuid: Type.Optional(Type.String()),
  }),
};
export type addUserParams = Static<typeof addUser.params>;
export type addUserBody = Static<typeof addUser.body>;

// GET /tournaments/:uuid/rounds/:roundIndex
export const getTournamentRound = {
  params: Type.Object({
    uuid: Type.String(),
    roundIndex: Type.Integer({ minimum: 0 }),
  }),
};
export type getTournamentRound = Static<typeof getTournamentRound.params>;
