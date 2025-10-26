import { describe, test, expect, assert } from 'vitest';
import { setUserTo, normalUser, adminUser } from '../utils.js';
import { app } from '../setup.js';
import type { Tournament } from 'db/generated/client/index.js';

const validTournamentBody = {
  tournamentName: 'TestTournament',
  maxPlayers: 4,
  minPlayers: 2,
  lockTime: 1,
  gameTime: 1,
};

async function createValidTournament() {
  const response = await app.inject({
    method: 'POST',
    url: '/tournaments',
    body: {
      ...validTournamentBody,
    },
  });
  assert(response.statusCode === 201);
  return (await JSON.parse(response.payload)) as Tournament;
}

describe('POST /tournaments', () => {
  setUserTo('MEMBER');
  test('valid settings -> 201', async () => {
    await createValidTournament();
  });
  test('valid settings: required fields only -> 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        tournamentName: 'TestTournament',
        maxPlayers: 4,
        minPlayers: 2,
      },
    });
    expect(response.statusCode).toBe(201);
  });
  test('valid settings: extra fields -> 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        ...validTournamentBody,
        someRandomExtraField: 'extra value',
      },
    });
    expect(response.statusCode).toBe(201);
  });
  test('valid settings: maxPlayers = minPlayers -> 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        ...validTournamentBody,
        maxPlayers: 2,
        minPlayers: 2,
      },
    });
    expect(response.statusCode).toBe(201);
  });
  test('invalid settings: missing fields -> 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        maxPlayers: 2,
        minPlayers: 3,
      },
    });
    expect(response.statusCode).toBe(400);
  });
  test('invalid settings: maxPlayers < minPlayers -> 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        ...validTournamentBody,
        maxPlayers: 2,
        minPlayers: 3,
      },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /tournaments', async () => {
  setUserTo('MEMBER');

  test('valid: Get tournaments without status filter', async () => {
    // Create multiple tournaments in this test
    const createdTournaments: Tournament[] = [];
    for (let i = 0; i < 3; i++) {
      const tournament = await createValidTournament();
      createdTournaments.push(tournament);
    }

    const response = await app.inject({
      method: 'GET',
      url: '/tournaments',
    });
    expect(response.statusCode).toBe(200);

    const tournaments = JSON.parse(response.payload) as Tournament[];
    expect(tournaments).toHaveLength(3);

    // Validate that all created tournaments are returned
    tournaments.forEach((tournament) => {
      expect(tournament.tournamentName).toBe('TestTournament');
      expect(tournament.maxPlayers).toBe(4);
      expect(tournament.minPlayers).toBe(2);
      expect(tournament.status).toBe('outstanding');
      expect(createdTournaments.some((ct) => ct.uuid === tournament.uuid)).toBe(
        true
      );
    });
  });

  test('valid: Get tournaments with status filter (outstanding)', async () => {
    // Create a tournament
    const createdTournament = await createValidTournament();

    const response = await app.inject({
      method: 'GET',
      url: '/tournaments?status=outstanding',
    });
    expect(response.statusCode).toBe(200);

    const tournaments = JSON.parse(response.payload) as Tournament[];
    expect(tournaments).toHaveLength(1);
    expect(tournaments[0]!.status).toBe('outstanding');
    expect(tournaments[0]!.uuid).toBe(createdTournament.uuid);
  });

  test('valid: Get tournaments with empty result for non-matching status', async () => {
    // Create a tournament (which will have status 'outstanding')
    await createValidTournament();

    // Query for 'finished' tournaments should return empty array
    const response = await app.inject({
      method: 'GET',
      url: '/tournaments?status=finished',
    });
    expect(response.statusCode).toBe(200);

    const tournaments = JSON.parse(response.payload) as Tournament[];
    expect(tournaments).toHaveLength(0);
  });

  test('valid: Get tournaments returns empty array when no tournaments exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/tournaments',
    });
    expect(response.statusCode).toBe(200);

    const tournaments = JSON.parse(response.payload) as Tournament[];
    expect(tournaments).toHaveLength(0);
  });

  test('invalid: Get tournaments with invalid status -> 400', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/tournaments?status=invalid',
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /tournaments/{uuid}', () => {
  setUserTo('MEMBER');

  test('valid: Get tournament by uuid -> 200', async () => {
    // Create tournament in each test since DB is cleared beforeEach
    const createdTournament = await createValidTournament();

    const response = await app.inject({
      method: 'GET',
      url: `/tournaments/${createdTournament.uuid}`,
    });
    expect(response.statusCode).toBe(200);

    const tournament = JSON.parse(response.payload) as Tournament;
    expect(tournament.tournamentName).toBe('TestTournament');
    expect(tournament.maxPlayers).toBe(4);
    expect(tournament.minPlayers).toBe(2);
    expect(tournament.lockTime).toBe(1);
    expect(tournament.gameTime).toBe(1);
    expect(tournament.status).toBe('outstanding');
    expect(tournament.playerCount).toBeGreaterThan(0);
  });

  test('invalid: Get tournament with non-existent uuid -> 404', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/tournaments/12345678-1234-1234-1234-123456789012',
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('POST /tournaments/{uuid}/users', () => {
  setUserTo('MEMBER');

  test('valid: Add yourself to tournament -> 204', async () => {
    // user to create tournament
    setUserTo('MEMBER');

    const tournament = await createValidTournament();

    // user to request to join the tournament -- should be other user since creator is added on creation
    setUserTo('ADMIN');

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {},
    });
    expect(response.statusCode).toBe(204);
    console.log('received following response: ' + JSON.stringify(response));

    // Verify the user was actually added by checking the tournament
    const getTournamentResponse = await app.inject({
      method: 'GET',
      url: `/tournaments/${tournament.uuid}`,
    });
    const updatedTournament = JSON.parse(
      getTournamentResponse.payload
    ) as Tournament;
    expect(updatedTournament.playerCount).toBeGreaterThan(
      tournament.playerCount
    );
  });

  test('valid: Add yourself to tournament that you created (again) -> 204', async () => {
    // user to create tournament
    setUserTo('MEMBER');

    const tournament = await createValidTournament();

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {},
    });
    expect(response.statusCode).toBe(204);

    // Verify the no further user was added
    const getTournamentResponse = await app.inject({
      method: 'GET',
      url: `/tournaments/${tournament.uuid}`,
    });
    const updatedTournament = JSON.parse(
      getTournamentResponse.payload
    ) as Tournament;
    expect(updatedTournament.playerCount).toBe(tournament.playerCount);
  });

  // TODO: try to join 'non-outstanding' tournament

  test('valid: Admin adds specific user to tournament -> 204', async () => {
    setUserTo('ADMIN');
    const tournament = await createValidTournament();

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: normalUser.uuid,
      },
    });
    expect(response.statusCode).toBe(204);
  });

  test('invalid: Add other user to tournament as non-admin-> 403', async () => {
    setUserTo('MEMBER');
    const tournament = await createValidTournament();

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: adminUser.uuid,
      },
    });
    expect(response.statusCode).toBe(403);
  });

  test('invalid: Add user to non-existent tournament -> 404', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments/12345678-1234-1234-1234-123456789012/users',
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /tournaments/{uuid}/rounds/{roundIdx}', () => {
  setUserTo('MEMBER');

  test('valid: Get tournament round data as participant -> 200', async () => {
    // Create tournament and add a round
    const tournament = await createValidTournament();

    // Create a tournament round using the database function
    const roundData = await app.db.createTournamentRound(
      tournament.uuid,
      0,
      []
    );
    assert(roundData !== null);

    const response = await app.inject({
      method: 'GET',
      url: `/tournaments/${tournament.uuid}/rounds/0`,
    });
    expect(response.statusCode).toBe(200);

    const responseRoundData = JSON.parse(response.payload);
    expect(responseRoundData.index).toBe(0);
    expect(Array.isArray(responseRoundData.matches)).toBe(true);
    expect(responseRoundData.tournamentId).toBe(tournament.uuid);
  });

  test('valid: Get tournament round data as admin -> 200', async () => {
    setUserTo('ADMIN');
    const tournament = await createValidTournament();

    // Create a tournament round
    await app.db.createTournamentRound(tournament.uuid, 0, []);

    const response = await app.inject({
      method: 'GET',
      url: `/tournaments/${tournament.uuid}/rounds/0`,
    });
    expect(response.statusCode).toBe(200);

    const roundData = JSON.parse(response.payload);
    expect(roundData.index).toBe(0);
  });

  test('invalid: Get round from non-existent tournament -> 404', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/tournaments/12345678-1234-1234-1234-123456789012/rounds/0',
    });
    expect(response.statusCode).toBe(404);
  });

  test('invalid: Get non-existent round -> 404', async () => {
    const tournament = await createValidTournament();

    const response = await app.inject({
      method: 'GET',
      url: `/tournaments/${tournament.uuid}/rounds/0`,
    });
    expect(response.statusCode).toBe(404);
  });

  test('invalid: Get round with invalid tournament uuid -> 404', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/tournaments/invalid-uuid/rounds/0',
    });
    expect(response.statusCode).toBe(404);
  });

  test('invalid: Get round with invalid round index -> 404', async () => {
    const tournament = await createValidTournament();

    const response = await app.inject({
      method: 'GET',
      url: `/tournaments/${tournament.uuid}/rounds/99`,
    });
    expect(response.statusCode).toBe(404);
  });

  test('invalid: Non-participant access -> 403', async () => {
    setUserTo('ADMIN'); // Create tournament as admin
    const tournament = await createValidTournament();

    setUserTo('MEMBER'); // Switch to member who isn't a participant
    const response = await app.inject({
      method: 'GET',
      url: `/tournaments/${tournament.uuid}/rounds/0`,
    });
    expect(response.statusCode).toBe(403);
  });
});
