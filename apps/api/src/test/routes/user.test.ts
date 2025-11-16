import { describe, test, expect } from 'vitest';
import { app } from '../setup.js';
import { setUserTo, normalUser } from '../utils.js';
import { friendshipState, type User } from 'db/generated/client/index.js';
// import { userRole } from 'db/generated/client/index.js';

// MMOSER'S IMPORTS
import { createValidTournament } from '../utils.js';
import {
  type Tournament,
  status as statusEnum,
} from 'db/generated/client/index.js';

// -----   /user   -   GET ALL USERS
describe('GET /user', () => {
  test('Admin getting all users - valid', async () => {
    setUserTo('ADMIN');

    const response = await app.inject({
      method: 'GET',
      url: '/user',
    });

    expect(response.statusCode).toBe(200);
    const users = JSON.parse(response.payload) as User[];
    expect(users).toHaveLength(2);
  });

  test('Admin getting all users - valid', async () => {
    for (let i = 0; i < 10; ++i) {
      await app.db.addUser(`user${i}@mail.com`, `nickName${i}`);
    }
    setUserTo('ADMIN');

    const response = await app.inject({
      method: 'GET',
      url: '/user',
    });

    expect(response.statusCode).toBe(200);
    const users = JSON.parse(response.payload) as User[];
    expect(users).toHaveLength(12);
  });

  test('Member getting all users - invalid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/user',
    });
    expect(response.statusCode).toBe(403);
  });
});

// -----   /user/me   -   USER'S OWN PROFILE
describe('GET /user/me', () => {
  test('User, no friends - valid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/user/me',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      cleanedUserData: {
        createdAt: expect.any(String),
        email: expect.any(String),
        email_verified: true,
        avatar: null,
        fullName: null,
        nickname: expect.any(String),
        role: expect.any(String),
        gamesPlayed: expect.any(Number),
        gamesWon: expect.any(Number),
        tournamentsPlayed: expect.any(Number),
        tournamentsWon: expect.any(Number),
      },
      userFriends: expect.any(Array),
    });
    const data = response.json();
    expect(data.userFriends.length === 0);
  });

  test('User, with friends - valid', async () => {
    // setUserTo('MEMBER');

    let i;
    for (i = 0; i < 10; i++) {
      const userResult = await app.db.addUser(
        `friend${i}@mail.com`,
        `friend${i}`
      );
      const friendshipRecord = await app.db.addFriend(
        userResult.uuid,
        normalUser.uuid
      );
      if (i % 2 === 0)
        await app.db.modifyFriendsState(
          friendshipRecord.uuid,
          friendshipState.ACCEPTED
        );
      else
        await app.db.modifyFriendsState(
          friendshipRecord.uuid,
          friendshipState.REJECTED
        );
    }
    for (i = 10; i < 20; i++) {
      const userResult = await app.db.addUser(
        `friend${i}@mail.com`,
        `friend${i}`
      );
      const friendshipRecord = await app.db.addFriend(
        normalUser.uuid,
        userResult.uuid
      );
      if (i % 2 === 0)
        await app.db.modifyFriendsState(
          friendshipRecord.uuid,
          friendshipState.ACCEPTED
        );
      else
        await app.db.modifyFriendsState(
          friendshipRecord.uuid,
          friendshipState.REJECTED
        );
    }
    for (i = 20; i < 30; i++) {
      const userResult = await app.db.addUser(
        `friend${i}@mail.com`,
        `friend${i}`
      );
      if (i % 2 === 0) {
        await app.db.addFriend(normalUser.uuid, userResult.uuid);
      } else {
        await app.db.addFriend(userResult.uuid, normalUser.uuid);
      }
    }

    const response = await app.inject({
      method: 'GET',
      url: '/user/me',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      cleanedUserData: {
        createdAt: expect.any(String),
        email: expect.any(String),
        email_verified: true,
        avatar: null,
        fullName: null,
        nickname: expect.any(String),
        role: expect.any(String),
        gamesPlayed: expect.any(Number),
        gamesWon: expect.any(Number),
        tournamentsPlayed: expect.any(Number),
        tournamentsWon: expect.any(Number),
      },
      userFriends: expect.any(Array),
    });
    const data = response.json();
    if (data.userFriends.length > 0) {
      const friend = data.userFriends[0];
      expect(friend).toMatchObject({
        nickname: expect.any(String),
        state: expect.stringMatching(/^(ACCEPTED|REQUESTED)$/),
        isRequester: expect.any(Boolean),
      });
      expect(friend.avatar === null || typeof friend.avatar === 'string').toBe(
        true
      );
    }
    expect(data.userFriends.length).toBe(25);
  });
});

// -----   /user/me/nickname   -   GET OTHER USER'S RELEVANT DATA
describe('GET /user/me/nickname', () => {
  // current username: normalUserName

  test('Changing nickname - valid', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/user/me/nickname',
      body: {
        newNickname: 'newNickname',
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      createdAt: expect.any(String),
      email: expect.any(String),
      email_verified: true,
      avatar: null,
      fullName: null,
      nickname: expect.any(String),
      role: expect.any(String),
      gamesPlayed: expect.any(Number),
      gamesWon: expect.any(Number),
      tournamentsPlayed: expect.any(Number),
      tournamentsWon: expect.any(Number),
    });
  });

  test('Changing nickname, but nickname already exists', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/user/me/nickname',
      body: {
        newNickname: 'normalUserName',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      Error: `Nickname normalUserName already exists and must be unique`,
    });
  });

  // Nicknames should be between 3 - 30 characters - NOTE: This should be checked on frontend already, but does get reach backend through curl
  test('Changing nickname, but invalid amount of characters', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/user/me/nickname',
      body: {
        newNickname: 'Hi', // 2 characters
      },
    });
    expect(response.statusCode).toBe(400);
  });
  test('Changing nickname, but invalid amount of characters', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/user/me/nickname',
      body: {
        newNickname: '0123456789012345678901234567890', // 31 characters
      },
    });
    expect(response.statusCode).toBe(400);
  });
});

// -----   /user/:nickname   -   GET OTHER USER'S RELEVANT DATA
// describe('PATCH /user/me/avatar', async () => {
//   // TODO
// });

// -----   /user/:nickname   -   GET OTHER USER'S RELEVANT DATA
describe('GET /user/:nickname', () => {
  test('Other user data - valid', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@email.com',
      'otherUser'
    );
    const otherUser = otherUserResult.nickname;

    const response = await app.inject({
      method: 'GET',
      url: `/user/${otherUser}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      nickname: expect.any(String),
      avatar: null,
      gamesPlayed: 0,
      gamesWon: 0,
      tournamentsPlayed: 0,
      tournamentsWon: 0,
    });
  });

  test('Other user, but user doesnt exist - invalid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/user/somename',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      Error: 'user not found',
    });
  });
});

// MMOSER'S TESTCASES
// -----   /user/me/tournaments  -   GET OTHER USER'S RELEVANT DATA
describe('GET /user/me/tournaments', () => {
  // setUserTo('MEMBER');

  test('no tournaments -> 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/user/me/tournaments',
    });
    expect(response.statusCode).toBe(200);
    const tournaments = JSON.parse(response.payload) as Tournament[];
    expect(tournaments).toHaveLength(0);
  });

  test('several tournaments -> 200', async () => {
    await createValidTournament(app);
    await createValidTournament(app);
    await createValidTournament(app);
    await createValidTournament(app);
    const response = await app.inject({
      method: 'GET',
      url: '/user/me/tournaments',
    });
    expect(response.statusCode).toBe(200);
    const tournaments = JSON.parse(response.payload) as Tournament[];
    expect(tournaments).toHaveLength(4);
  });

  test('tournaments by status -> 200', async () => {
    const testStatus = async (status: statusEnum) => {
      const tournament = await createValidTournament(app);
      await app.db.updateTournament({ uuid: tournament.uuid, status });
      const response = await app.inject({
        method: 'GET',
        url: '/user/me/tournaments',
        query: { status },
      });
      expect(response.statusCode).toBe(200);
      const tournaments = JSON.parse(response.payload) as Tournament[];
      expect(tournaments).toHaveLength(1);
    };

    for (const status of Object.values(statusEnum)) {
      await testStatus(status);
    }
  });
});
