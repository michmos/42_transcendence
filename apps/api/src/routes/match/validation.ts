import { Type, type Static } from '@sinclair/typebox';
import { status as statusEnum } from 'db/generated/client/index.js';

export const getMatch = {
  params: Type.Object({
    uuid: Type.String(),
  }),
};
export type singleUuidParam = Static<typeof getMatch.params>;

export const createMatch = {
  body: Type.Object(
    {
      status: Type.Optional(
        Type.Union(
          Object.values(statusEnum).map((value) => Type.Literal(value))
        )
      ),
      score1: Type.Optional(Type.Number()),
      score2: Type.Optional(Type.Number()),
      player1Id: Type.Optional(Type.String()),
      player2Id: Type.Optional(Type.String()),
      winnerId: Type.Optional(Type.String()),
      tournamentId: Type.Optional(Type.String()),
    },
    { additionalProperties: false }
  ),
};
export type createMatchBodyType = Static<typeof createMatch.body>;

export const updateMatch = {
  params: Type.Object({
    uuid: Type.String(),
  }),
  body: Type.Object(
    {
      status: Type.Optional(
        Type.Union(
          Object.values(statusEnum).map((value) => Type.Literal(value))
        )
      ),
      player1Id: Type.Optional(Type.String()),
      player2Id: Type.Optional(Type.String()),
      winnerId: Type.Optional(Type.String()),
      score1: Type.Optional(Type.Number()),
      score2: Type.Optional(Type.Number()),
    },
    { additionalProperties: false }
  ),
};
export type updateMatchBodyType = Static<typeof updateMatch.body>;
