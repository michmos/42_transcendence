import { Type, type Static } from '@sinclair/typebox';
import { status as statusEnum } from 'db/generated/client/index.js';

// POST /tournaments/broadcast/created
export const tournamentCreated = {
  body: Type.Object({
    tournamentUuid: Type.String(),
  }),
};
export type tournamentCreatedBody = Static<typeof tournamentCreated.body>;

// POST /tournaments/broadcast/joined
export const tournamentJoined = {
  body: Type.Object({
    tournamentUuid: Type.String(),
    userUuid: Type.String(),
    playerCount: Type.Number(),
  }),
};
export type tournamentJoinedBody = Static<typeof tournamentJoined.body>;

// POST /tournaments/broadcast/left
export const tournamentLeft = {
  body: Type.Object({
    tournamentUuid: Type.String(),
    userUuid: Type.String(),
    playerCount: Type.Number(),
  }),
};
export type tournamentLeftBody = Static<typeof tournamentLeft.body>;

// POST /tournaments/broadcast/started
export const tournamentStarted = {
  body: Type.Object({
    tournamentUuid: Type.String(),
    tournamentName: Type.String(),
  }),
};
export type tournamentStartedBody = Static<typeof tournamentStarted.body>;

// POST /tournaments/broadcast/updated
export const tournamentUpdated = {
  body: Type.Object({
    tournamentUuid: Type.String(),
    tournamentName: Type.String(),
    status: Type.Union(
      Object.values(statusEnum).map((value) => Type.Literal(value))
    ),
  }),
};
export type tournamentUpdatedBody = Static<typeof tournamentUpdated.body>;
