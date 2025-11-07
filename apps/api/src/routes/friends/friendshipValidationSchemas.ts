import { Type, type Static } from '@sinclair/typebox';

export const PostAddFriend = {
  params: Type.Object(
    {
      nickname: Type.String({
        maxLength: 30,
        minLength: 3,
        pattern: '^[a-zA-Z0-9_-]+$',
      }),
    },
    {
      additionalProperties: false,
    }
  ),
} as const;
export type PostAddFriendType = Static<typeof PostAddFriend.params>;

export const PatchFriendRequest = {
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
  body: Type.Object(
    {
      accept: Type.Boolean(),
    },
    { additionalProperties: false }
  ),
} as const;
export type PatchFriendRequestParams = Static<typeof PatchFriendRequest.params>;
export type PatchFriendRequestBody = Static<typeof PatchFriendRequest.body>;

export const DeleteFriend = {
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
export type DeleteFriendType = Static<typeof DeleteFriend.params>;
