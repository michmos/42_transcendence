import { describe, test, expect } from 'vitest';
import { setUserTo, normalUser } from '../utils.js';
import { app } from '../setup.js';
import { friendshipState } from 'db/generated/client/index.js';

// -----   /user   -   POST NEW FRIEND REQUEST
describe('POST /friend/:nickname', () => {
  // VALID - Adding existing user as friend, while NO existing relational friendship record between the two users exists
  test('VALID - Adding user as friend, with no existing friendship record', async () => {
    setUserTo('MEMBER');
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;

    const response = await app.inject({
      method: 'POST',
      url: `/friends/${otherUser}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'Friend request sent',
    });
  });

  // VALID - Adding existing user as friend, when other user already sent friendship request
  test('VALID - Adding existing user as friend, when other user already sent friendship request', async () => {
    setUserTo('MEMBER');
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    await app.db.addFriend(otherUserResult.uuid, normalUser.uuid);

    const otherUser = otherUserResult.nickname;

    const response = await app.inject({
      method: 'POST',
      url: `/friends/${otherUser}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'Friend accepted',
    });
  });

  // INVALID - Adding non existing user as friend
  test('INVALID - Adding non-existing user as friend', async () => {
    setUserTo('MEMBER');

    const response = await app.inject({
      method: 'POST',
      url: `/friends/timmy`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      Error: 'user not found',
    });
  });

  // INVALID - Adding existing user as friend, while relational friendship already exists (REQUESTED, ACCEPTED, REJECTED)
  test('INVALID - Adding user as friend with already existing relational record', async () => {
    setUserTo('MEMBER');
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    await app.db.addFriend(normalUser.uuid, otherUserResult.uuid);

    const response = await app.inject({
      method: 'POST',
      url: `/friends/${otherUser}`,
      body: {},
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      Error: 'Friendship request already pending, accepted or rejected',
    });
  });
});

// -----   /user   -   POST NEW FRIEND REQUEST
describe('PATCH /friends/:nickname', () => {
  // VALID - Accept friend request
  test('VALID - Accept friend request', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    await app.db.addFriend(otherUserResult.uuid, normalUser.uuid);

    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/${otherUser}`,
      body: {
        accept: true,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'Friendship request accepted',
    });
  });

  // VALID - Reject friend request
  test('VALID - Reject friend request', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    await app.db.addFriend(otherUserResult.uuid, normalUser.uuid);

    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/${otherUser}`,
      body: {
        accept: false,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'Friendship request rejected',
    });
  });

  // INVALID - Accept non-existing friend request
  test('INVALID - Accept non-existing friend request', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;

    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/${otherUser}`,
      body: {
        accept: true,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      Error: 'Friendship request not found',
    });
  });

  // INVALID - Reject non-existing friend request
  test('INVALID - Reject non-existing friend request', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;

    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/${otherUser}`,
      body: {
        accept: false,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      Error: 'Friendship request not found',
    });
  });

  // INVALID - Accept a friend request from a non-existing user
  test('INVALID - Accept a friend request from a non-existing user', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/billy`,
      body: {
        accept: true,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      Error: 'user not found',
    });
  });

  // INVALID - Reject a friend request from a non-existing user
  test('INVALID - Reject a friend request from a non-existing user', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/billy`,
      body: {
        accept: false,
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      Error: 'user not found',
    });
  });

  // INVALID - Accept an already accepted friend request
  test('INVALID - Accept an already accepted friend request', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    const result = await app.db.addFriend(
      otherUserResult.uuid,
      normalUser.uuid
    );
    await app.db.modifyFriendsState(result.uuid, friendshipState.ACCEPTED);

    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/${otherUser}`,
      body: {
        accept: true,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      Error: 'Friendship state already ACCEPTED or REJECTED',
    });
  });

  // INVALID - Reject an already accepted friend request
  test('INVALID - Reject an already accepted friend request', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    const result = await app.db.addFriend(
      otherUserResult.uuid,
      normalUser.uuid
    );
    await app.db.modifyFriendsState(result.uuid, friendshipState.ACCEPTED);

    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/${otherUser}`,
      body: {
        accept: false,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      Error: 'Friendship state already ACCEPTED or REJECTED',
    });
  });

  // INVALID - Accept an already rejected friend request
  test('INVALID - Accept an already rejected friend request', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    const result = await app.db.addFriend(
      otherUserResult.uuid,
      normalUser.uuid
    );
    await app.db.modifyFriendsState(result.uuid, friendshipState.REJECTED);

    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/${otherUser}`,
      body: {
        accept: true,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      Error: 'Friendship state already ACCEPTED or REJECTED',
    });
  });

  // INVALID - Reject an already rejected friend request
  test('INVALID - Reject an already rejected friend request', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    const result = await app.db.addFriend(
      otherUserResult.uuid,
      normalUser.uuid
    );
    await app.db.modifyFriendsState(result.uuid, friendshipState.REJECTED);

    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/${otherUser}`,
      body: {
        accept: false,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      Error: 'Friendship state already ACCEPTED or REJECTED',
    });
  });

  // INVALID - Accept a friend request you sent
  test('INVALID - Accept a friend request you sent', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    await app.db.addFriend(normalUser.uuid, otherUserResult.uuid);

    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/${otherUser}`,
      body: {
        accept: true,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      Error: 'Cannot accept or reject friendship request sent by yourself',
    });
  });

  // INVALID - Reject a friend request you sent
  test('INVALID - Reject a friend request you sent', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    await app.db.addFriend(normalUser.uuid, otherUserResult.uuid);

    const response = await app.inject({
      method: 'PATCH',
      url: `/friends/${otherUser}`,
      body: {
        accept: false,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      Error: 'Cannot accept or reject friendship request sent by yourself',
    });
  });
});

// -----   /user   -   DELETE FRIENDSHIP RECORD
describe('DELETE /friends/:nickname', () => {
  // VALID - Delete a friendship request as the requester
  test('VALID - Delete a friendship request as the requester', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    await app.db.addFriend(normalUser.uuid, otherUserResult.uuid);

    const response = await app.inject({
      method: 'DELETE',
      url: `/friends/${otherUser}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'Friendship request deleted',
    });
  });

  // VALID - Delete a friendship request from another user
  test('VALID - Delete a friendship request from another user', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    await app.db.addFriend(otherUserResult.uuid, normalUser.uuid);

    const response = await app.inject({
      method: 'DELETE',
      url: `/friends/${otherUser}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'Friendship request deleted',
    });
  });

  // VALID - Delete an accepted friendship
  test('VALID - Delete an accepted friendship', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    const result = await app.db.addFriend(
      otherUserResult.uuid,
      normalUser.uuid
    );
    await app.db.modifyFriendsState(result.uuid, friendshipState.ACCEPTED);

    const response = await app.inject({
      method: 'DELETE',
      url: `/friends/${otherUser}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'Friend removed',
    });
  });

  // VALID - Delete a rejected friendship as the requested
  test('VALID - Delete a rejected friendship as the requested', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    const result = await app.db.addFriend(
      otherUserResult.uuid,
      normalUser.uuid
    );
    await app.db.modifyFriendsState(result.uuid, friendshipState.REJECTED);

    const response = await app.inject({
      method: 'DELETE',
      url: `/friends/${otherUser}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'User removed from rejected friendship requests',
    });
  });

  // INVALID - Delete a rejected friendship as the requester
  test('INVALID - Delete a rejected friendship as the requester', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;
    const result = await app.db.addFriend(
      normalUser.uuid,
      otherUserResult.uuid
    );
    await app.db.modifyFriendsState(result.uuid, friendshipState.REJECTED);

    const response = await app.inject({
      method: 'DELETE',
      url: `/friends/${otherUser}`,
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      Error: 'Cannot delete REJECTED friendship record as requester',
    });
  });

  // user does not exist
  test('INVALID - User does not exist', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/friends/billy`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      Error: 'User not found',
    });
  });

  // Friendship record does not exist
  test('INVALID - Friendship record does not exist', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@gmail.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;

    const response = await app.inject({
      method: 'DELETE',
      url: `/friends/${otherUser}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      Error: 'No relation with other user',
    });
  });
});
