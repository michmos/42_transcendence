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
