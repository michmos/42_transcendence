import { Type, type Static } from '@sinclair/typebox';

export const requestEvent = {
  body: Type.Object({
    event: Type.Union([Type.Literal('friends-updated')]),
    uuid: Type.String(),
  }),
};
export type requestEventBody = Static<typeof requestEvent.body>;
