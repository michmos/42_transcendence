import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { setUserTo } from '../utils.js';
import app from '../setup.js';

describe('Create Tournament', () => {
  setUserTo('ADMIN');
  test('should create a tournament successfully', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        tournamentName: 'TestTournament',
        maxPlayers: 4,
        minPlayers: 2,
        lockTime: 1,
        gameTime: 1,
      },
    });
    expect(response.statusCode).toBe(201);
  });
});
