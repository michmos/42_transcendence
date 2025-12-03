import { describe, test, expect, assert } from 'vitest';
import {
  setUserTo,
  normalUser,
  adminUser,
  createValidTournament,
  validTournamentBody,
} from '../utils.js';
import { app } from '../setup.js';
import {
  status as statusEnum,
  type Tournament,
} from 'db/generated/client/index.js';

import { type TournamentRoundResponse } from 'types';

describe('POST /tournaments', () => {
  setUserTo('MEMBER');

  test('valid settings -> 201', async () => {
    await createValidTournament(app);
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

  test('invalid settings: wrong field names -> 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        name: 'hello',
        maplayers: 2,
        miayers: 3,
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
        maxPlayers: 10,
        minPlayers: 9,
      },
    });
    expect(response.statusCode).toBe(400);
  });

  test('invalid settings: minPlayers < 2 -> 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        ...validTournamentBody,
        maxPlayers: 10,
        minPlayers: 1,
      },
    });
    expect(response.statusCode).toBe(400);
  });

  test('invalid settings: maxPlayers < 2 -> 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        ...validTournamentBody,
        maxPlayers: 2,
        minPlayers: 0,
      },
    });
    expect(response.statusCode).toBe(400);
  });

  test('invalid settings: negative values -> 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments',
      body: {
        ...validTournamentBody,
        maxPlayers: -1,
        minPlayers: -2,
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
      const tournament = await createValidTournament(app, {
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
    const createdTournament = await createValidTournament(app);

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
    await createValidTournament(app);

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
    const createdTournament = await createValidTournament(app);

    const response = await app.inject({
      method: 'GET',
      url: `/tournaments/${createdTournament.uuid}`,
    });
    expect(response.statusCode).toBe(200);

    const tournament = JSON.parse(response.payload) as Tournament;
    expect(tournament.tournamentName).toBe('TestTournament');
    expect(tournament.maxPlayers).toBe(4);
    expect(tournament.minPlayers).toBe(2);
    expect(tournament.status).toBe('outstanding');
    expect(tournament.playerCount).toBe(0);
  });

  test('invalid: Get tournament with non-existent uuid -> 404', async () => {
    await createValidTournament(app);

    const response = await app.inject({
      method: 'GET',
      url: '/tournaments/12345678-1234-1234-1234-123456789012',
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('PATCH /tournaments/{uuid}', () => {
  test('valid: change status (admin)-> 200', async () => {
    const tournament = await createValidTournament(app);

    setUserTo('ADMIN');
    const response = await app.inject({
      method: 'PATCH',
      url: `/tournaments/${tournament.uuid}`,
      body: {
        status: statusEnum.finished,
      },
    });
    expect(response.statusCode).toBe(200);
    const updatedTournament = JSON.parse(response.payload) as Tournament;
    expect(updatedTournament.status).toBe(statusEnum.finished);
  });
  test('valid: change name (admin)-> 200', async () => {
    const tournament = await createValidTournament(app);

    setUserTo('ADMIN');
    const newName = 'newTournamentName';
    const response = await app.inject({
      method: 'PATCH',
      url: `/tournaments/${tournament.uuid}`,
      body: {
        tournamentName: newName,
      },
    });
    expect(response.statusCode).toBe(200);
    const updatedTournament = JSON.parse(response.payload) as Tournament;
    expect(updatedTournament.tournamentName).toBe(newName);
  });

  test('invalid: change sth else than name or status (admin) -> 400', async () => {
    const tournament = await createValidTournament(app);

    setUserTo('ADMIN');
    const response = await app.inject({
      method: 'PATCH',
      url: `/tournaments/${tournament.uuid}`,
      body: {
        playerCount: 8,
      },
    });
    expect(response.statusCode).toBe(400);
  });

  test('invalid: change name of non-existent tournament (admin) -> 404', async () => {
    setUserTo('ADMIN');
    const response = await app.inject({
      method: 'PATCH',
      url: `/tournaments/non-existent-uuid`,
      body: {
        tournamentName: 'hello',
      },
    });
    expect(response.statusCode).toBe(404);
  });
  test('invalid: change name (user) -> 403', async () => {
    const tournament = await createValidTournament(app);
    const newName = 'newTournamentName';
    const response = await app.inject({
      method: 'PATCH',
      url: `/tournaments/${tournament.uuid}`,
      body: {
        tournamentName: newName,
      },
    });
    expect(response.statusCode).toBe(403);
  });
});

describe('PATCH /tournaments/{uuid}/start', () => {
  test('valid: start tournament -> 200', async () => {
    const tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );
    await app.db.updateTournament({
      uuid: tournament.uuid,
      playerCount: tournament.minPlayers,
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/tournaments/${tournament.uuid}/start`,
      body: {},
    });
    expect(response.statusCode).toBe(200);
  });

  test('invalid: start non-outstanding tournament', async () => {
    const tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );
    await app.db.updateTournament({
      uuid: tournament.uuid,
      playerCount: tournament.minPlayers,
      status: statusEnum.ongoing,
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/tournaments/${tournament.uuid}/start`,
      body: {},
    });
    expect(response.statusCode).toBe(422);
  });

  test('invalid: start tournament with playerCount < minPlayers -> 422', async () => {
    const tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );

    const response = await app.inject({
      method: 'PATCH',
      url: `/tournaments/${tournament.uuid}/start`,
      body: {},
    });
    expect(response.statusCode).toBe(422);
  });

  test('invalid: start non-existent tournament -> 404', async () => {
    const tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );

    const response = await app.inject({
      method: 'PATCH',
      url: `/tournaments/invalid-tournament-id/start`,
      body: {},
    });
    expect(response.statusCode).toBe(404);
  });

  test('invalid: start existing tournament without participating-> 403', async () => {
    const tournament = await createValidTournament(app);
    await app.db.updateTournament({
      uuid: tournament.uuid,
      playerCount: tournament.minPlayers,
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/tournaments/${tournament.uuid}/start`,
      body: {},
    });
    expect(response.statusCode).toBe(403);
  });
});

describe('POST /tournaments/{uuid}/users', () => {
  setUserTo('MEMBER');

  test('valid: Add yourself to own tournament -> 200', async () => {
    const tournament = await createValidTournament(app);

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(200);

    const updatedTournament = await app.db.getTournament(tournament.uuid);
    assert(updatedTournament !== null);
    expect(updatedTournament.playerCount).toBe(1);

    const participants = await app.db.getTournamentParticipants(
      tournament.uuid
    );
    const isParticipant = participants.some(
      (user) => user.uuid === normalUser.uuid
    );
    expect(isParticipant).toBe(true);
  });

  test('valid: Add yourself to others tournament -> 200', async () => {
    // user to create tournament
    setUserTo('MEMBER');

    const tournament = await createValidTournament(app);

    setUserTo('ADMIN');
    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(200);

    // Verify the no further user was added
    const updatedTournament = await app.db.getTournament(tournament.uuid);
    assert(updatedTournament !== null);
    expect(updatedTournament.playerCount).toBe(1);
  });

  test('valid: Add other person to tournament as admin -> 200', async () => {
    const tournament = await createValidTournament(app);

    setUserTo('ADMIN');
    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: normalUser.uuid,
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(200);
  });

  test('invalid: Add yourself to full tournament -> 409', async () => {
    // user to create tournament
    setUserTo('MEMBER');
    const maxPlayers = 4;

    // create tournament
    const tournament = await createValidTournament(app, { maxPlayers });

    for (let i = tournament.playerCount; i < maxPlayers; i++) {
      try {
        const tempUser = await app.db.addUser(`email${i}`, `user${i}`);
        assert(tempUser !== null);
        await app.db.addUserToTournament(
          tempUser.uuid,
          tournament.uuid,
          `someAlias${i}`
        );
      } catch (error) {
        assert(false, `Failed to add user to tournament: ${error}`);
      }
    }

    // add yourself
    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(409);

    // Verify that tournament playerCount hasn't changed
    const updatedTournament = await app.db.getTournament(tournament.uuid);
    expect(updatedTournament?.playerCount).toBe(4);
  });

  test('invalid: Add yourself twice -> 409', async () => {
    const tournament = await createValidTournament(app);

    let response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        alias: 'someAlias',
      },
    });
    assert(response.statusCode === 200);
    response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(409);

    // Verify the no further user was added
    const updatedTournament = await app.db.getTournament(tournament.uuid);
    assert(updatedTournament !== null);
    expect(updatedTournament.playerCount).toBe(1);
  });

  test('invalid: Add other person twice as admin -> 409', async () => {
    const tournament = await createValidTournament(app);

    setUserTo('ADMIN');
    let response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: normalUser.uuid,
        alias: 'someAlias',
      },
    });
    assert(response.statusCode === 200);
    response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: normalUser.uuid,
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(409);

    // Verify the no further user was added
    const updatedTournament = await app.db.getTournament(tournament.uuid);
    assert(updatedTournament !== null);
    expect(updatedTournament.playerCount).toBe(1);
  });

  test('invalid: join non-outstanding tournament -> 422', async () => {
    // user to create tournament
    setUserTo('MEMBER');

    const tournament = await createValidTournament(app);
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
      body: {
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(422);
  });

  test('invalid: Admin adds specific user to ongoing tournament -> 422', async () => {
    setUserTo('ADMIN');
    const tournament = await createValidTournament(app);
    await app.db.updateTournament({
      uuid: tournament.uuid,
      status: statusEnum.ongoing,
    });

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: normalUser.uuid,
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(422);
  });

  test('invalid: Admin adds non-existent user to tournament -> 404', async () => {
    setUserTo('ADMIN');
    const tournament = await createValidTournament(app);

    const randomUserUuid = '12345678-1234-1234-1234-123456789012';
    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: randomUserUuid,
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(404);
  });

  test('invalid: non-admin adds specific user to tournament -> 403', async () => {
    setUserTo('MEMBER');
    const tournament = await createValidTournament(app);

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: adminUser.uuid,
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(403);
  });

  test('invalid: join non-existent tournament -> 404', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tournaments/12345678-1234-1234-1234-123456789012/users',
      body: {
        alias: 'someAlias',
      },
    });
    expect(response.statusCode).toBe(404);
  });

  test('invalid: join with same alias as other player-> 409', async () => {
    setUserTo('MEMBER');
    const tournament = await createValidTournament(app);

    const response = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        alias: 'sameAlias',
      },
    });
    expect(response.statusCode).toBe(200);
    setUserTo('ADMIN');
    const response2 = await app.inject({
      method: 'POST',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        alias: 'sameAlias',
      },
    });
    expect(response2.statusCode).toBe(409);
    const updatedTournament = await app.db.getTournament(tournament.uuid);
    assert(updatedTournament);
    expect(updatedTournament.playerCount).toBe(1);
  });
});

describe('DELETE /tournaments/{tournamentId}/users/', () => {
  test('valid: remove yourself from tournament -> 200', async () => {
    const tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );

    const response = await app.inject({
      method: 'DELETE',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {},
    });
    expect(response.statusCode).toBe(200);
  });
  test('valid: remove sb else from tournament as Admin -> 200', async () => {
    const tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );

    setUserTo('ADMIN');
    const response = await app.inject({
      method: 'DELETE',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: normalUser.uuid,
      },
    });
    expect(response.statusCode).toBe(200);
  });
  test('invalid: remove yourself from ongoing tournament as Member -> 422', async () => {
    const tournament = await createValidTournament(app);
    await app.db.updateTournament({ uuid: tournament.uuid, status: 'ongoing' });

    const response = await app.inject({
      method: 'DELETE',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {},
    });
    expect(response.statusCode).toBe(422);
  });
  test('invalid: remove sb else from ongoing tournament as Admin -> 422', async () => {
    const tournament = await createValidTournament(app);
    await app.db.updateTournament({ uuid: tournament.uuid, status: 'ongoing' });

    setUserTo('ADMIN');
    const response = await app.inject({
      method: 'DELETE',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: normalUser.uuid,
      },
    });
    expect(response.statusCode).toBe(422);
  });
  test('invalid: remove sb else from tournament as Member -> 403', async () => {
    setUserTo('ADMIN');
    const tournament = await createValidTournament(app);

    setUserTo('MEMBER');
    const response = await app.inject({
      method: 'DELETE',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: adminUser.uuid,
      },
    });
    expect(response.statusCode).toBe(403);
  });
  test('invalid: remove yourself from non-existent tournament -> 404', async () => {
    await createValidTournament(app);

    const response = await app.inject({
      method: 'DELETE',
      url: `/tournaments/invalid-uuid/users`,
      body: {},
    });
    expect(response.statusCode).toBe(404);
  });
  test('invalid: remove non-existent user from tournament as Admin -> 404', async () => {
    const tournament = await createValidTournament(app);

    setUserTo('ADMIN');
    const response = await app.inject({
      method: 'DELETE',
      url: `/tournaments/${tournament.uuid}/users`,
      body: {
        uuid: 'invalid-user-uuid',
      },
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('GET /tournaments/{uuid}/rounds/{roundIdx}', () => {
  setUserTo('MEMBER');

  test('valid: Get tournament round data as participant -> 200', async () => {
    // Create tournament and add a round
    const tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );

    // Create a tournament round using the database function
    const roundData = await app.db.createTournamentRound(tournament.uuid, 0, [
      { player1Id: normalUser.uuid, player2Id: adminUser.uuid },
    ]);
    assert(roundData !== null);

    const response = await app.inject({
      method: 'GET',
      url: `/tournaments/${tournament.uuid}/rounds/0`,
    });
    expect(response.statusCode).toBe(200);

    const responseRoundData = JSON.parse(
      response.payload
    ) as TournamentRoundResponse;
    expect(responseRoundData.index).toBe(0);
    expect(Array.isArray(responseRoundData.matches)).toBe(true);
    expect(responseRoundData.matches).toHaveLength(1);
    expect(responseRoundData.matches[0]).toHaveProperty('uuid');
  });

  test('valid: Get tournament round data as admin -> 200', async () => {
    const tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      adminUser.uuid,
      tournament.uuid,
      'someAlias'
    );

    // Create a tournament round
    await app.db.createTournamentRound(tournament.uuid, 0, []);

    setUserTo('ADMIN');
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
    const tournament = await createValidTournament(app);
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'someAlias'
    );

    const response = await app.inject({
      method: 'GET',
      url: `/tournaments/${tournament.uuid}/rounds/0`,
    });
    expect(response.statusCode).toBe(404);
  });

  test('invalid: Non-participant access -> 403', async () => {
    setUserTo('ADMIN'); // Create tournament as admin
    const tournament = await createValidTournament(app);

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
