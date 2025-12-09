/* eslint-disable */

import { describe, test, expect } from 'vitest';
import { app } from '../setup.js';
import { setUserTo, normalUser, createValidTournament } from '../utils.js';
import {
  friendshipState,
  type User,
  type Match,
} from 'db/generated/client/index.js';
import {
  type Tournament,
  status as statusEnum,
} from 'db/generated/client/index.js';

// -----   /user   -   GET ALL USERS
describe('GET /user', () => {
  // ------------------------------------------------------------------------ 1
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

  // ------------------------------------------------------------------------ 2
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

  // ------------------------------------------------------------------------ 3
  test('Member getting all users - invalid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/user',
    });
    expect(response.statusCode).toBe(403);
  });
});

// -----   /user/me   -   USER'S OWN PROFILE
describe('GET /user/me/dashboard', () => {
  // ------------------------------------------------------------------------ 4
  test('User, no friends - valid', async () => {
    await app.db.setUserMeAvatar(
      normalUser.uuid,
      'https://cdn.example.com/someAvatar'
    );
    const response = await app.inject({
      method: 'GET',
      url: '/user/me/dashboard',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      cleanedUserData: {
        createdAt: expect.any(String),
        avatar: 'https://cdn.example.com/someAvatar',
        nickname: expect.any(String),
        role: expect.any(String),
        gamesPlayed: expect.any(Number),
        gamesWon: expect.any(Number),
        tournamentsPlayed: expect.any(Number),
        tournamentsWon: expect.any(Number),
      },
      cleanedUserFriends: expect.any(Array),
      userMatches: expect.any(Array),
    });
    const data = response.json();
    expect(data.cleanedUserFriends).toHaveLength(0);
  });

  // ------------------------------------------------------------------------ 5
  test('VALID - User, with friends and match history', async () => {
    // setUserTo('MEMBER');

    await app.db.setUserMeAvatar(
      normalUser.uuid,
      'https://cdn.example.com/someAvatar'
    );

    let i;
    for (i = 0; i < 10; i++) {
      let otherUser = await app.db.addUser(`friend${i}@mail.com`, `friend${i}`);
      otherUser = await app.db.setUserMeAvatar(
        otherUser.uuid,
        'https://cdn.example.com/someAvatar'
      );
      const friendshipRecord = await app.db.addFriend(
        otherUser.uuid,
        normalUser.uuid
      );
      if (i % 2 === 0) {
        await app.db.modifyFriendsState(
          friendshipRecord.uuid,
          friendshipState.ACCEPTED
        );
        const player1Id = normalUser.uuid;
        const player2Id = otherUser.uuid;
        const match: Match = await app.db.addMatch({ player1Id, player2Id });
        const uuid: string = match.uuid;
        await app.db.updateMatch({
          uuid,
          score1: 5,
          score2: 10,
          winnerId: otherUser.uuid,
          status: 'finished',
        });
      } else {
        await app.db.modifyFriendsState(
          friendshipRecord.uuid,
          friendshipState.REJECTED
        );
        const player1Id = normalUser.uuid;
        const player2Id = otherUser.uuid;
        const match = await app.db.addMatch({ player1Id, player2Id });
        const uuid: string = match.uuid;
        await app.db.updateMatch({
          uuid,
          score1: 10,
          score2: 2,
          winnerId: normalUser.uuid,
          status: 'finished',
        });
      }
    }
    for (i = 10; i < 20; i++) {
      let otherUser = await app.db.addUser(`friend${i}@mail.com`, `friend${i}`);
      otherUser = await app.db.setUserMeAvatar(
        otherUser.uuid,
        'https://cdn.example.com/someAvatar'
      );
      const friendshipRecord = await app.db.addFriend(
        normalUser.uuid,
        otherUser.uuid
      );
      if (i % 2 === 0) {
        await app.db.modifyFriendsState(
          friendshipRecord.uuid,
          friendshipState.ACCEPTED
        );
        const player1Id = normalUser.uuid;
        const player2Id = otherUser.uuid;
        const match: Match = await app.db.addMatch({ player1Id, player2Id });
        const uuid: string = match.uuid;
        await app.db.updateMatch({
          uuid,
          score1: 10,
          score2: 2,
          winnerId: normalUser.uuid,
          status: 'finished',
          // tournamentRoundId: `t-round-${i}`,
        });
      } else {
        await app.db.modifyFriendsState(
          friendshipRecord.uuid,
          friendshipState.REJECTED
        );
      }
    }
    for (i = 20; i < 30; i++) {
      let otherUser = await app.db.addUser(`friend${i}@mail.com`, `friend${i}`);
      otherUser = await app.db.setUserMeAvatar(
        otherUser.uuid,
        'https://cdn.example.com/someAvatar'
      );
      if (i % 2 === 0) {
        await app.db.addFriend(normalUser.uuid, otherUser.uuid);
      } else {
        await app.db.addFriend(otherUser.uuid, normalUser.uuid);
      }
    }

    const response = await app.inject({
      method: 'GET',
      url: '/user/me/dashboard',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      cleanedUserData: {
        createdAt: expect.any(String),
        avatar: 'https://cdn.example.com/someAvatar',
        nickname: expect.any(String),
        role: expect.any(String),
        gamesPlayed: expect.any(Number),
        gamesWon: expect.any(Number),
        tournamentsPlayed: expect.any(Number),
        tournamentsWon: expect.any(Number),
      },
      cleanedUserFriends: expect.any(Array),
      userMatches: expect.any(Array),
    });
    const data = response.json();
    if (data.cleanedUserFriends.length > 0) {
      const friend = data.cleanedUserFriends[0];
      expect(friend).toMatchObject({
        otherUser: expect.any(String),
        state: expect.any(String),
        isRequester: expect.any(Boolean),
      });
      expect(friend.avatar === null || typeof friend.avatar === 'string').toBe(
        true
      );
    }
    if (data.userMatches.length > 0) {
      const match = data.userMatches[0];
      expect(match).toMatchObject({
        date: expect.any(String),
        score1: expect.any(Number),
        score2: expect.any(Number),
        player1: expect.any(String),
        player2: expect.any(String),
        result: expect.any(String),
        gameType: expect.any(String),
      });
    }
    expect(data.cleanedUserFriends.length).toBe(25);
  }, 10000);
});

// -----   /user/me/nickname   -   GET OTHER USER'S RELEVANT DATA
describe('GET /user/me/nickname', () => {
  // ------------------------------------------------------------------------ 6
  test('VALID - Changing nickname', async () => {
    await app.db.setUserMeAvatar(
      normalUser.uuid,
      'https://cdn.example.com/someAvatar'
    );
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
      avatar: 'https://cdn.example.com/someAvatar',
      nickname: expect.any(String),
      role: expect.any(String),
      gamesPlayed: expect.any(Number),
      gamesWon: expect.any(Number),
      tournamentsPlayed: expect.any(Number),
      tournamentsWon: expect.any(Number),
    });
  });

  // ------------------------------------------------------------------------ 7
  test('INVALID - Changing nickname, but nickname already exists', async () => {
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

  // ------------------------------------------------------------------------ 8
  // Nicknames should be between 3 - 30 characters - NOTE: This should be checked on frontend already, but does get reach backend through curl
  test('INVALID - Changing nickname, but invalid amount of characters', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/user/me/nickname',
      body: {
        newNickname: 'Hi', // 2 characters
      },
    });
    expect(response.statusCode).toBe(400);
  });
  // ------------------------------------------------------------------------ 9
  test('INVALID - Changing nickname, but invalid amount of characters', async () => {
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
  // ------------------------------------------------------------------------ 10
  test('VALID - Other user data', async () => {
    const otherUserResult = await app.db.addUser(
      'otherUser@email.com',
      'otherUser'
    );
    await app.db.setUserMeAvatar(
      otherUserResult.uuid,
      'https://cdn.example.com/someAvatar'
    );
    const otherUser = otherUserResult.nickname;

    const response = await app.inject({
      method: 'GET',
      url: `/user/${otherUser}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      nickname: expect.any(String),
      avatar: 'https://cdn.example.com/someAvatar',
      gamesPlayed: 0,
      gamesWon: 0,
      tournamentsPlayed: 0,
      tournamentsWon: 0,
    });
  });

  // ------------------------------------------------------------------------ 11
  test('INVALID - Other user, but user doesnt exist', async () => {
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
  setUserTo('MEMBER');
  // ------------------------------------------------------------------------ 12
  test('no tournaments -> 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/user/me/tournaments',
    });
    expect(response.statusCode).toBe(200);
    const tournaments = JSON.parse(response.payload) as Tournament[];
    expect(tournaments).toHaveLength(0);
  });

  // ------------------------------------------------------------------------ 13
  test('several tournaments -> 200', async () => {
    let tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );
    tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );
    tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );
    tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );
    const response = await app.inject({
      method: 'GET',
      url: '/user/me/tournaments',
    });
    expect(response.statusCode).toBe(200);
    const tournaments = JSON.parse(response.payload) as Tournament[];
    expect(tournaments).toHaveLength(4);
  });

  // ------------------------------------------------------------------------ 14
  test('VALID - tournaments by status -> 200', async () => {
    const testStatus = async (status: statusEnum) => {
      const tournament = await createValidTournament(app);
      await app.db.addUserToTournament(
        normalUser.uuid,
        tournament.uuid,
        'someAlias'
      );
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

describe('PATCH /user/me/isOnline/:boolean', () => {
  test('set to true -> 204', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/user/me/isOnline/true'
    })
    expect(response.statusCode).toBe(204);
    const user = await app.db.getUser(normalUser.uuid);
    expect(user!.isOnline).toBe(true);
  });
  test('set to false -> 204', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/user/me/isOnline/false'
    })
    expect(response.statusCode).toBe(204);
    const user = await app.db.getUser(normalUser.uuid);
    expect(user!.isOnline).toBe(false);
  })
});