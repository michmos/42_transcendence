import { type FastifyInstance } from 'fastify';
import type { User, Friendship } from 'db/generated/client/client.js';
import { friendshipState } from 'db/generated/client/client.js';
import {
  findFriendRecord,
  modifyFriendsState,
} from '../../plugins/database/friendship.js';
import {
  type fullFriendshipRecord,
  type cleanedFriendshipRecord,
} from './types.js';
import { cleanFriendshipRecord } from './utils.js';
import * as schemas from './friendshipValidationSchemas.js';

export default function (app: FastifyInstance): void {
  // Send friend request to another user
  app.post<{ Params: schemas.PostAddFriendType }>(
    '/:nickname',
    {
      schema: schemas.PostAddFriend,
    },
    async function (request, reply) {
      try {
        const { nickname } = request.params;
        const uuidOther: string | null = await getUserUuid(nickname);
        if (!uuidOther)
          return reply.code(404).send({ Error: 'user not found' });

        const uuidSelf: string = request.user.uuid;

        const friendRecord = await app.db.findFriendRecord(uuidSelf, uuidOther);
        if (
          friendRecord &&
          friendRecord.friendBId === uuidSelf &&
          friendRecord.state === friendshipState.REQUESTED
        ) {
          const updatedFriendRecord: fullFriendshipRecord =
            await app.db.modifyFriendsState(
              friendRecord.uuid,
              friendshipState.ACCEPTED
            );
          const cleanedFriendshipRecord: cleanedFriendshipRecord =
            cleanFriendshipRecord(uuidSelf, updatedFriendRecord);
          return reply
            .code(200)
            .send({ cleanedFriendshipRecord, message: 'Friend accepted' });
        } else if (friendRecord)
          return reply.code(409).send({
            Error: 'Friendship request already pending, accepted or rejected',
          });

        const addedFriendResult = await app.db.addFriend(uuidSelf, uuidOther);
        if (!addedFriendResult)
          throw new Error(`Failed making friend request to ${nickname}`);

        const cleanedFriendshipRecord: cleanedFriendshipRecord =
          cleanFriendshipRecord(uuidSelf, addedFriendResult);
        return reply
          .code(200)
          .send({ cleanedFriendshipRecord, message: 'Friend request sent' });
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({ Error: 'Failed looking up user' });
      }
    }
  );

  // Accept or reject a friend request
  app.patch<{
    Params: schemas.PatchFriendRequestParams;
    Body: schemas.PatchFriendRequestBody;
  }>(
    '/:nickname',
    {
      schema: schemas.PatchFriendRequest,
    },
    async function (request, reply) {
      try {
        const { nickname } = request.params as { nickname: string };
        const uuidOther: string | null = await getUserUuid(nickname);
        if (!uuidOther)
          return reply.code(404).send({ Error: 'user not found' });

        const uuidSelf: string = request.user.uuid;

        const friendRecord: Friendship | null = await findFriendRecord(
          uuidSelf,
          uuidOther
        );
        if (!friendRecord)
          return reply
            .code(404)
            .send({ Error: 'Friendship request not found' });

        if (uuidSelf === friendRecord.friendAId)
          return reply.code(409).send({
            Error:
              'Cannot accept or reject friendship request sent by yourself',
          });

        if (
          friendRecord.state === friendshipState.ACCEPTED ||
          friendRecord.state === friendshipState.REJECTED
        )
          return reply
            .code(409)
            .send({ Error: 'Friendship state already ACCEPTED or REJECTED' });

        const { accept } = request.body;
        let updatedFriendshipState: fullFriendshipRecord;
        if (accept === true)
          updatedFriendshipState = await modifyFriendsState(
            friendRecord.uuid,
            friendshipState.ACCEPTED
          );
        else
          updatedFriendshipState = await modifyFriendsState(
            friendRecord.uuid,
            friendshipState.REJECTED
          );
        if (!updatedFriendshipState)
          throw new Error(`Failed resolving friend request from ${nickname}`);

        const cleanedFriendshipRecord: cleanedFriendshipRecord =
          cleanFriendshipRecord(uuidSelf, updatedFriendshipState);

        if (accept === true)
          return reply.code(200).send({
            cleanedFriendshipRecord,
            message: 'Friendship request accepted',
          });
        else
          return reply.code(200).send({
            cleanedFriendshipRecord,
            message: 'Friendship request rejected',
          });
      } catch (error) {
        app.log.error(error);
        return reply
          .code(500)
          .send({ Error: 'Failed modifying friend request' });
      }
    }
  );

  // Delete a friend request, remove user from rejected friend request, remove friend
  app.delete<{ Params: schemas.DeleteFriendType }>(
    '/:nickname',
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
          return reply.code(404).send({ Error: 'No relation with other user' });
        else if (
          uuidSelf === friendRecord.friendAId &&
          friendRecord.state === friendshipState.REJECTED
        )
          return reply.code(409).send({
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
        app.log.error(error);
        return reply.code(500).send({ Error: 'Failed deleting friendRecord' });
      }
    }
  );

  // ------------- Helper function

  async function getUserUuid(nickname: string) {
    const user: User | null = await app.db.getUserByNickname(nickname);
    if (!user) return null;

    const { uuid } = user;

    return uuid;
  }
}
