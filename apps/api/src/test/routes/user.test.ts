import { describe, test, expect } from 'vitest';
import { createValidTournament, setUserTo } from '../utils.js';
import { app } from '../setup.js';
import {
  type Tournament,
  status as statusEnum,
} from 'db/generated/client/index.js';

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
