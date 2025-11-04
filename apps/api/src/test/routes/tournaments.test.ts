import { describe, test, expect, assert } from 'vitest';
import { setUserTo, normalUser, adminUser } from '../utils.js';
import { app } from '../setup.js';
import {
  status as statusEnum,
  type Tournament,
} from 'db/generated/client/index.js';

const validTournamentBody = {
  tournamentName: 'TestTournament',
  maxPlayers: 4,
  minPlayers: 2,
  lockTime: 1,
  gameTime: 1,
};

async function createValidTournament(
  overrides?: Partial<typeof validTournamentBody>
) {
  const response = await app.inject({
    method: 'POST',
    url: '/tournaments',
    body: {
      ...validTournamentBody,
      ...overrides,
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
    const postTournament = async (
      body: Partial<typeof validTournamentBody>
    ) => {
      return app.inject({
        method: 'POST',
        url: '/tournaments',
        body: body,
      });
    };

    expect(
      (await postTournament({ minPlayers: 2, maxPlayers: 2 })).statusCode
    ).toBe(400);
    expect(
      (await postTournament({ tournamentName: 'whatever', maxPlayers: 2 }))
        .statusCode
    ).toBe(400);
    expect(
      (await postTournament({ tournamentName: 'whatever', minPlayers: 2 }))
        .statusCode
    ).toBe(400);
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

  test('invalid settings: maxPlayers > 16 -> 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        ...validTournamentBody,
        maxPlayers: 17,
        minPlayers: 3,
      },
    });
    expect(response.statusCode).toBe(400);
  });

  test('invalid settings: minPlayers > 8 -> 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        ...validTournamentBody,
        minPlayers: 8,
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
      const tournament = await createValidTournament({
        tournamentName: `tournament${i}`,
      });
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
    for (let i = 0; i < 3; i++) {
      expect(tournaments[i]?.tournamentName).toBe(`tournament${i}`);
    }
  });

  test('valid: Get tournaments with status filter', async () => {
    const testStatus = async (status: statusEnum) => {
      await app.db.updateTournament({
        uuid: createdTournament.uuid,
        status: status,
      });
      const response = await app.inject({
        method: 'GET',
        url: `/tournaments?status=${status}`,
      });
      expect(response.statusCode).toBe(200);
    };

    // Create a tournament
    const createdTournament = await createValidTournament();

    for (const [, value] of Object.entries(statusEnum)) {
      await testStatus(value);
    }
  });

  test('invalid: Get tournaments with invalid status -> 400', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/tournaments?status=invalid',
    });
    expect(response.statusCode).toBe(400);
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
});

describe('GET /tournaments/{uuid}', () => {
  setUserTo('MEMBER');

  test('valid: Get tournament by uuid -> 200', async () => {
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
    await createValidTournament();

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

    // Verify the user was actually added by checking
    // the tournament's player count and participants list
    const updatedTournament = await app.db.getTournament(tournament.uuid);
    assert(updatedTournament !== null);
    expect(updatedTournament.playerCount).toBe(2);

    const participants = await app.db.getTournamentParticipants(
      tournament.uuid
    );
    const isParticipant = participants.some(
      (user) => user.uuid === adminUser.uuid
    );
    expect(isParticipant).toBe(true);
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

  test('valid: last player to join triggers matchmaking', async () => {
    // user to create tournament
    setUserTo('MEMBER');
    const maxPlayers = 4;

    // create tournament
    const tournament = await createValidTournament({ maxPlayers });

    // add players up to maxPlayers - 1
    for (let i = tournament.playerCount; i < maxPlayers - 1; i++) {
      try {
        const tempUser = await app.db.addUser(`email${i}`, `user${i}`);
        assert(tempUser !== null);
        await app.db.addUserToTournament(tempUser.uuid, tournament.uuid);
      } catch (error) {
        assert(false, `Failed to add user to tournament: ${error}`);
      }
    }

    // switch to another user to join as the last player
    setUserTo('ADMIN');

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {},
    });
    expect(response.statusCode).toBe(204);

    // Verify that tournament status changed and matchmaking was done
    const updatedTournament = await app.db.getTournament(tournament.uuid);
    assert(updatedTournament !== null);
    expect(updatedTournament.playerCount).toBe(tournament.maxPlayers);
    expect(updatedTournament.status).toBe(statusEnum.ongoing);
    expect(updatedTournament.currentRound).toBe(0);
    expect(updatedTournament.numberOfRounds).toBe(tournament.maxPlayers - 1);
  });

  test('invalid: join non-outstanding tournament -> 204', async () => {
    // user to create tournament
    setUserTo('MEMBER');

    const tournament = await createValidTournament();
    // update tournament to non-outstanding
    await app.db.updateTournament({
      uuid: tournament.uuid,
      status: statusEnum.ongoing,
    });

    // user to request to join the tournament -- should be other user since creator is added on creation
    setUserTo('ADMIN');

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {},
    });
    expect(response.statusCode).toBe(422);
  });

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

  test('invalid: Admin adds specific user to ongoing tournament -> 422', async () => {
    setUserTo('ADMIN');
    const tournament = await createValidTournament();
    await app.db.updateTournament({
      uuid: tournament.uuid,
      status: statusEnum.ongoing,
    });

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: normalUser.uuid,
      },
    });
    expect(response.statusCode).toBe(422);
  });

  test('invalid: Admin adds non-existent user to tournament -> 404', async () => {
    setUserTo('ADMIN');
    const tournament = await createValidTournament();

    const randomUserUuid = '12345678-1234-1234-1234-123456789012';
    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: randomUserUuid,
      },
    });
    expect(response.statusCode).toBe(404);
  });

  test('invalid: non-admin adds specific user to tournament -> 403', async () => {
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

  test('invalid: join non-existent tournament -> 404', async () => {
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

  test('invalid: Non-participant access -> 403', async () => {
    setUserTo('ADMIN'); // Create tournament as admin
    const tournament = await createValidTournament();

    // Create a tournament round
    await app.db.createTournamentRound(tournament.uuid, 0, []);

    setUserTo('MEMBER'); // Switch to member who isn't a participant
    const response = await app.inject({
      method: 'GET',
      url: `/tournaments/${tournament.uuid}/rounds/0`,
    });
    expect(response.statusCode).toBe(403);
  });
});
