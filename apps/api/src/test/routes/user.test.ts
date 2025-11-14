import { describe, test, expect } from 'vitest';
import { app } from '../setup.js';
import { setUserTo, normalUser } from '../utils.js';
// import { type User } from 'db/generated/client/index.js';
// import { userRole } from 'db/generated/client/index.js';

// MMOSER'S IMPORTS
// import { createValidTournament} from '../utils.js';
// import {
//   type Tournament,
//   status as statusEnum,
// } from 'db/generated/client/index.js';

// use a describe block for each api route
// describe('GET /user', () => {
//   test('Admin getting all users - valid', async () => {
//     setUserTo('ADMIN');

//     // perform the request
//     const response = await app.inject({
//       method: 'GET',
//       url: '/user',
//     });

//     // compare the response to your expectations
//     expect(response.statusCode).toBe(200);
//     const users = JSON.parse(response.payload) as User[];
//     expect(users).toHaveLength(2);
//   });

//   test('Admin getting all users - valid', async () => {
//     for (let i = 0; i < 10; ++i) {
//       await app.db.addUser(`user${i}@mail.com`, `nickName${i}`);
//     }
//     setUserTo('ADMIN');

//     // perform the request
//     const response = await app.inject({
//       method: 'GET',
//       url: '/user',
//     });

//     // compare the response to your expectations
//     expect(response.statusCode).toBe(200);
//     const users = JSON.parse(response.payload) as User[];
//     expect(users).toHaveLength(12);
//   });

//   test('Member getting all users - invalid', async () => {
//     const response = await app.inject({
//       method: 'GET',
//       url: '/user',
//     });
//     expect(response.statusCode).toBe(403);
//   });
// });

describe('GET /user/me', () => {
  test('User, no friends - valid', async () => {
    setUserTo('MEMBER');
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
    setUserTo('MEMBER');

    for (let i = 0; i < 10; i++) {
      const userResult = await app.db.addUser(
        `friend${i}@mail.com`,
        `friend${i}`
      );
      await app.db.addFriend(normalUser.uuid, userResult.uuid);
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
      });
      expect(friend.avatar === null || typeof friend.avatar === 'string').toBe(
        true
      );
    }
    expect(data.userFriends.length).toBe(10);
  });
});

// the database is reset between each test
// all tests run sequentially to avoid cross-dependencies
// for more info on the setup see ../setup.ts

// MMOSER'S TESTCASES
// describe('GET /user/me/tournaments', () => {
//   setUserTo('MEMBER');

//   test('no tournaments -> 200', async () => {
//     const response = await app.inject({
//       method: 'GET',
//       url: '/user/me/tournaments',
//     });
//     expect(response.statusCode).toBe(200);
//     const tournaments = JSON.parse(response.payload) as Tournament[];
//     expect(tournaments).toHaveLength(0);
//   });

//   test('several tournaments -> 200', async () => {
//     await createValidTournament(app);
//     await createValidTournament(app);
//     await createValidTournament(app);
//     await createValidTournament(app);
//     const response = await app.inject({
//       method: 'GET',
//       url: '/user/me/tournaments',
//     });
//     expect(response.statusCode).toBe(200);
//     const tournaments = JSON.parse(response.payload) as Tournament[];
//     expect(tournaments).toHaveLength(4);
//   });

//   test('tournaments by status -> 200', async () => {
//     const testStatus = async (status: statusEnum) => {
//       const tournament = await createValidTournament(app);
//       await app.db.updateTournament({ uuid: tournament.uuid, status });
//       const response = await app.inject({
//         method: 'GET',
//         url: '/user/me/tournaments',
//         query: { status },
//       });
//       expect(response.statusCode).toBe(200);
//       const tournaments = JSON.parse(response.payload) as Tournament[];
//       expect(tournaments).toHaveLength(1);
//     };

//     for (const status of Object.values(statusEnum)) {
//       await testStatus(status);
//     }
//   });
// });
