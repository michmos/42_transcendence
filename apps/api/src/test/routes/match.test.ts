import { describe, test, expect, assert } from 'vitest';
import { setUserTo, normalUser, adminUser } from '../utils.js';
import { app } from '../setup.js';
import { type MatchResponse } from 'types';
import { type TournamentRoundResponse } from 'types';

describe('GET /match/:uuid', () => {
  setUserTo('MEMBER');

  test('get existing match -> 200', async () => {
    const match = await app.db.addMatch({
      player1Id: normalUser.uuid,
      player2Id: adminUser.uuid,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/match/${match.uuid}`,
    });
    expect(response.statusCode).toBe(200);
  });

  test('get existing tournament match -> 200', async () => {
    // create tournament
    const tournament = await app.db.createTournament({
      tournamentName: 'name',
      minPlayers: 2,
      maxPlayers: 4,
    });

    // mock tournament participation //

    // join tournament
    await app.db.addUserToTournament(
      normalUser.uuid,
      tournament.uuid,
      'normalAlias'
    );
    await app.db.addUserToTournament(
      adminUser.uuid,
      tournament.uuid,
      'adminAlias'
    );

    // matchmaking
    const tournamentRoundCreated = await app.db.createTournamentRound(
      tournament.uuid,
      0,
      [{ player1Id: normalUser.uuid, player2Id: adminUser.uuid }]
    );
    assert(tournamentRoundCreated !== null);

    // get matchId
    const tournamentRound: TournamentRoundResponse | null =
      await app.db.getTournamentRound(tournament.uuid, 0);
    assert(tournamentRound !== null);
    assert(tournamentRound.matches[0] !== undefined);
    const matchId = tournamentRound.matches[0].uuid;

    // get match
    const response = await app.inject({
      method: 'GET',
      url: `/match/${matchId}`,
    });

    const matchResponse = JSON.parse(response.body) as MatchResponse;
    expect(response.statusCode).toBe(200);
    expect(matchResponse.player1Name).toBe('normalAlias');
    expect(matchResponse.player2Name).toBe('adminAlias');
  });

  test('get non-existent match -> 404', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/match/non-existent-match-uuid`,
    });
    expect(response.statusCode).toBe(404);
  });
});
