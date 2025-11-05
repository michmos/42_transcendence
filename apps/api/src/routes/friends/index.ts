import { type FastifyRequest, type FastifyInstance } from 'fastify';
import type { User, Friends } from 'db/generated/client/client.js';
import { friendshipState } from 'db/generated/client/client.js';
import {
  findFriendRecord,
  modifyFriendsState,
} from '../../plugins/database/friends.js';

export default async function (app: FastifyInstance): Promise<void> {
  // Send friendship request to a user whose nickname we know
  app.post('/friends', async function (request, reply) {
    const { nickname } = request.body as { nickname: string };
    const uuidOther: string | null = await getUserUuid(nickname);
    if (!uuidOther) return reply.code(404).send({ Error: 'user not found' });

    const uuidSelf: string = request.user?.uuid as string;

    const result = await app.db.findFriendRecord(uuidSelf, uuidOther);
    if (result)
      return reply.code(409).send({
        Error: 'Conflict - Friendship or pending request already exists',
      });

    const friendAdded = await app.db.addFriend(uuidSelf, uuidOther);

    return reply.code(200).send(friendAdded);
  });

  // Accept or Deny a friend request
  app.patch('/friends', async function (request, reply) {
    try {
      const { nickname } = request.body as { nickname: string };
      const uuidOther: string | null = await getUserUuid(nickname);
      if (!uuidOther) return reply.code(404).send({ Error: 'user not found' });

      const uuidSelf: string = request.user?.uuid as string;

      const friendRecord: Friends | null = await findFriendRecord(
        uuidSelf,
        uuidOther
      );
      if (!friendRecord)
        return reply.code(404).send({ Error: 'Friendship request not found' });

      if (
        (friendRecord && friendRecord.state === friendshipState.ACCEPTED) ||
        friendRecord.state === friendshipState.DENIED
      )
        return reply
          .code(400)
          .send({ Error: 'Friendship state already ACCEPTED or DENIED' });

      const { state } = request.body as { state: friendshipState };
      if (
        state !== friendshipState.ACCEPTED &&
        state !== friendshipState.DENIED
      )
        return reply
          .code(400)
          .send({ Error: `Invalid friend request response (${state})` });
      return await modifyFriendsState(friendRecord.uuid, state);
    } catch (error) {
      return reply.code(500).send({ Error: `${error}` });
    }
  });

  // THIS NEEDS TO BE LOOKED AT BECAUSE OF THE FASTIFY REQUEST LINE AND USING QUERY FOR NICKNAME
  app.delete(
    '/friends',
    async function (
      request: FastifyRequest<{ Querystring: { nickname: string } }>,
      reply
    ) {
      try {
        const nickname: string = request.query.nickname as string;
        if (!nickname)
          return reply.code(400).send({ Error: 'Missing nickname' });

        const uuidOther: string | null = await getUserUuid(nickname);
        if (!uuidOther)
          return reply.code(404).send({ Error: 'user not found' });

        const uuidSelf: string = request.user?.uuid as string;

        const friendRecord = await findFriendRecord(uuidSelf, uuidOther);
        if (!friendRecord)
          return reply.code(400).send({ Error: 'No friend record' });
        else if (
          uuidSelf === friendRecord.friendAId &&
          friendRecord.state === friendshipState.DENIED
        )
          return reply.code(400).send({
            Error: 'Cannot delete DENIED friendship record as requester',
          });

        const result = await app.db.deleteFriend(friendRecord.uuid);
        if (!result)
          return reply
            .code(500)
            .send({ Error: 'Failed deleting friendRecord' });
        return reply.code(200).send(result);
      } catch (error) {
        return reply.code(500).send({ Error: `${error}` });
      }
    }
  );

  // ------------- Helper functions

  async function getUserUuid(nickname: string) {
    const user: User | null = await app.db.getUser(nickname);
    if (!user) return null;

    const { uuid } = user;

    return uuid;
  }
}
