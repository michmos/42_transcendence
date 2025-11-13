import { describe, test, expect } from 'vitest';
import { app } from '../setup.js';
import { createValidTournament, setUserTo } from '../utils.js';
import {
  type Tournament,
  status as statusEnum,
} from 'db/generated/client/index.js';

// use a describe block for each api route
describe('GET /user', () => {
  test('Admin getting all users - valid', async () => {
    setUserTo('ADMIN');

    // perform the request
    const response = await app.inject({
      method: 'GET',
      url: '/user',
    });

    // compare the response to your expectations
    console.warn(`reponse: `, JSON.stringify(response));
    expect(response.statusCode).toBe(200);
  });

  test('Member getting all users - invalid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/user',
    });

    // compare the response to your expectations
    expect(response.statusCode).toBe(403);
  });

  // more tests ...
});

// the database is reset between each test
// all tests run sequentially to avoid cross-dependencies
// for more info on the setup see ../setup.ts

// other api route
describe('GET /endpoint1', () => {
  // more tests
});

// other api route
describe('POST /endpoint2', () => {
  // more tests
});

// more routes ...

// MMOSER'S TESTCASES
describe('GET /user/me/tournaments', () => {
  setUserTo('MEMBER');

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
