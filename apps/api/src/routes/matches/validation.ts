import { Type, type Static } from '@sinclair/typebox';
import { status as statusEnum } from 'db/generated/client/index.js';

export const updateMatches = {
  querystring: Type.Object({
    status: Type.Optional(
      Type.Union(Object.values(statusEnum).map((value) => Type.Literal(value)))
    ),
  }),
  body: Type.Object({
    status: Type.Optional(
      Type.Union(Object.values(statusEnum).map((value) => Type.Literal(value)))
    ),
  }),
};
export type updateMatchesQuerystringType = Static<
  typeof updateMatches.querystring
>;
export type updateMatchesBodyType = Static<typeof updateMatches.body>;

export const getMatch = {
  params: Type.Object({
    uuid: Type.String(),
  }),
};
export type singleUuidParam = Static<typeof getMatch.params>;

export const createMatch = {
  body: Type.Object(
    {
      player1Id: Type.String(),
      player2Id: Type.String(),
      status: Type.Optional(
        Type.Union(
          Object.values(statusEnum).map((value) => Type.Literal(value))
        )
      ),
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
      winnerId: Type.Optional(Type.String()),
      score1: Type.Optional(Type.Number()),
      score2: Type.Optional(Type.Number()),
    },
    { additionalProperties: false }
  ),
};
export type updateMatchBodyType = Static<typeof updateMatch.body>;
