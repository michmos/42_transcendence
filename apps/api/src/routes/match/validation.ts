import { Type, type Static } from '@sinclair/typebox';

export const getMatch = {
  params: Type.Object({
    uuid: Type.String(),
  }),
};
export type singleUuidParam = Static<typeof getMatch.params>;
