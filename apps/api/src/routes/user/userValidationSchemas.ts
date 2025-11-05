import { Type, type Static } from '@sinclair/typebox';

// PAtCH set nickname
export const PatchUserMeSetNickname = {
  body: Type.Object(
    {
      newNickname: Type.String({
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_-]+$',
      }),
    },
    { additionalProperties: false }
  ),
} as const;
export type PatchUserMeSetNicknameType = Static<
  typeof PatchUserMeSetNickname.body
>;

// ----- Image thing validation still needs work
// POST set avatar
// export const PatchUserMeSetAvatar = {
//   body: Type.Object(
//     {
//       newAvatar: Type.String(),
//     },
//     { additionalProperties: false }
//   ),
// } as const;
// export type PatchUserMeSetAvatarType = Static<typeof PatchUserMeSetAvatar.body>;

// GET other user's profile through /user/:nickname
export const getOtherUserProfile = {
  params: Type.Object(
    {
      nickname: Type.String({
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_-]+$',
      }),
    },
    { additionalProperties: false }
  ),
} as const;
export type getOtherUserProfileType = Static<typeof getOtherUserProfile.params>;

// Not sure if needed to validate this or not
// Validate whether the request contains user.uuid
export const validateUserUuid = {
  user: Type.Object({
    uuid: Type.String({
      maxLength: 36,
      minLength: 36,
      pattern: '^[a-zA-Z0-9_-]+$',
    }),
  }),
} as const;
export type validateUserUuidType = Static<typeof validateUserUuid.user>;
