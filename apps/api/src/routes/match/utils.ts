import { type FastifyInstance } from 'fastify';
import type { Match, Tournament } from 'db/generated/client/index.js';

/*
 * returns the player nickname for a normal game, or the alias for a
 * tournament game
 */
export async function getPlayerName(
  app: FastifyInstance,
  userId: string,
  match: Match
) {
  if (match.tournamentRoundId) {
    const tournament: Tournament = await app.db.getTournamentByRound(
      match.tournamentRoundId
    );
    return app.db.getUserAlias(userId, tournament.uuid);
  }
  const user = await app.db.getUser(userId);
  if (!user) {
    throw new Error('getPlayerName(): invalid userId');
  }
  return user.nickname;
}
