import { Type, type Static } from '@sinclair/typebox';
import { status as statusEnum } from 'db/generated/client/index.js';

// POST /tournaments/broadcast
export const tournamentCreated = {
  body: Type.Object({
    uuid: Type.String(),
    key: Type.String(),
  }),
};
export type tournamentCreatedBody = Static<typeof tournamentCreated.body>;

// POST /tournaments/:uuid/broadcast
export const tournamentUpdated = {
  params: Type.Object({
    uuid: Type.String(),
  }),
  body: Type.Object({
    status: Type.Optional(
      Type.Union(Object.values(statusEnum).map((value) => Type.Literal(value)))
    ),
    playerCount: Type.Optional(Type.Number()),
    key: Type.String(),
  }),
};
export type tournamentUpdatedParams = Static<typeof tournamentUpdated.params>;
export type tournamentUpdatedBody = Static<typeof tournamentUpdated.body>;
