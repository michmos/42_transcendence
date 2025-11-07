import { type FastifyInstance } from 'fastify';
import type { User, Friendship } from 'db/generated/client/client.js';
import { friendshipState } from 'db/generated/client/client.js';
import {
  findFriendRecord,
  modifyFriendsState,
} from '../../plugins/database/friends.js';
import * as schemas from './friendshipValidationSchemas.js';

export default async function (app: FastifyInstance): Promise<void> {
  // Send friend request to another user
  app.post<{ Params: schemas.PostAddFriendType }>(
    '/friends/:nickname',
    {
      schema: schemas.PostAddFriend,
    },
    async function (request, reply) {
      try {
        const { nickname } = request.params;
        const uuidOther: string | null = await getUserUuid(nickname);
        if (!uuidOther)
          return reply.code(404).send({ Error: 'user not found' });

        const uuidSelf: string = request.user?.uuid as string;

        const friendRecord = await app.db.findFriendRecord(uuidSelf, uuidOther);
        if (friendRecord)
          return reply.code(409).send({
            Error: 'Conflict - Friendship or pending request already exists',
          });

        const result = await app.db.addFriend(uuidSelf, uuidOther);
        if (!result)
          throw new Error(`Failed making friend request to ${nickname}`);

        return reply.code(200).send({ message: 'Friend request sent' });
      } catch (error) {
        return reply.code(500).send({ Error: `${error}` });
      }
    }
  );

  // Accept or reject a friend request
  app.patch<{
    Params: schemas.PatchFriendRequestParams;
    Body: schemas.PatchFriendRequestBody;
  }>(
    '/friends/:nickname',
    {
      schema: schemas.PatchFriendRequest,
    },
    async function (request, reply) {
      try {
        const { nickname } = request.params as { nickname: string };
        const uuidOther: string | null = await getUserUuid(nickname);
        if (!uuidOther)
          return reply.code(404).send({ Error: 'user not found' });

        const uuidSelf: string = request.user?.uuid as string;

        const friendRecord: Friendship | null = await findFriendRecord(
          uuidSelf,
          uuidOther
        );
        if (!friendRecord)
          return reply
            .code(404)
            .send({ Error: 'Friendship request not found' });

        if (
          friendRecord &&
          (friendRecord.state === friendshipState.ACCEPTED ||
            friendRecord.state === friendshipState.REJECTED)
        )
          return reply
            .code(400)
            .send({ Error: 'Friendship state already ACCEPTED or REJECTED' });

        const { accept } = request.body;
        let result: Friendship;
        if (accept === true)
          result = await modifyFriendsState(
            friendRecord.uuid,
            friendshipState.ACCEPTED
          );
        else
          result = await modifyFriendsState(
            friendRecord.uuid,
            friendshipState.REJECTED
          );
        if (!result)
          throw new Error(`Failed resolving friend request from ${nickname}`);

        if (accept === true)
          return reply.code(200).send({ message: 'Friend request accepted' });
        else
          return reply.code(200).send({ message: 'Friend request rejected' });
      } catch (error) {
        return reply.code(500).send({ Error: `${error}` });
      }
    }
  );

  // Delete a friend request, remove user from rejected friend request, remove friend
  app.delete<{ Params: schemas.DeleteFriendType }>(
    '/friends/:nickname',
    { schema: schemas.DeleteFriend },
    async function (request, reply) {
      try {
        const { nickname } = request.params;
        if (!nickname)
          return reply.code(400).send({ Error: 'Missing nickname' });

        const uuidOther: string | null = await getUserUuid(nickname);
        if (!uuidOther)
          return reply.code(404).send({ Error: 'User not found' });

        const uuidSelf: string = request.user.uuid;

        const friendRecord = await findFriendRecord(uuidSelf, uuidOther);
        if (!friendRecord)
          return reply.code(400).send({ Error: 'No relation with other user' });
        else if (
          uuidSelf === friendRecord.friendAId &&
          friendRecord.state === friendshipState.REJECTED
        )
          return reply.code(400).send({
            Error: 'Cannot delete REJECTED friendship record as requester',
          });

        const result = await app.db.deleteFriend(friendRecord.uuid);
        if (!result)
          return reply
            .code(500)
            .send({ Error: 'Failed deleting friendRecord' });

        if (result.state === friendshipState.REQUESTED)
          return reply
            .code(200)
            .send({ message: 'Friendship request deleted' });
        else if (result.state === friendshipState.REJECTED)
          return reply.code(200).send({
            message: 'User removed from rejected friendship requests',
          });
        else if (result.state === friendshipState.ACCEPTED)
          return reply.code(200).send({ message: 'Friend removed' });
      } catch (error) {
        return reply.code(500).send({ Error: `${error}` });
      }
    }
  );

  // ------------- Helper function

  async function getUserUuid(nickname: string) {
    const user: User | null = await app.db.getUser(nickname);
    if (!user) return null;

    const { uuid } = user;

    return uuid;
  }
}
