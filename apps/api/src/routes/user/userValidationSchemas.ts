import { Type, type Static } from '@sinclair/typebox';

export const PatchUserMeSetNickname = {
  body: Type.Object(
    {
      newNickname: Type.String({
        maxLength: 30,
        minLength: 3,
        pattern: '^[a-zA-Z0-9_-]+$',
      }),
    },
    { additionalProperties: false }
  ),
} as const;
export type PatchUserMeSetNicknameType = Static<
  typeof PatchUserMeSetNickname.body
>;

export const GetOtherUserProfile = {
  params: Type.Object(
    {
      nickname: Type.String({
        maxLength: 30,
        minLength: 3,
        pattern: '^[a-zA-Z0-9_-]+$',
      }),
    },
    { additionalProperties: false }
  ),
} as const;
export type GetOtherUserProfileType = Static<typeof GetOtherUserProfile.params>;

export const changeStatus = {
  params: Type.Object({
    boolean: Type.Boolean(),
  }),
};
export type changeStatusParamsType = Static<typeof changeStatus.params>;
