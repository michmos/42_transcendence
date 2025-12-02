import { type FastifyInstance } from 'fastify';
import * as schemas from './validation.js';
import type { Match } from 'db/generated/client/index.js';
import { getPlayerName } from './utils.js';
import { type MatchResponse } from 'types';

export default async function (app: FastifyInstance): Promise<void> {
  app.get<{ Params: schemas.singleUuidParam }>(
    '/:uuid',
    {
      schema: schemas.getMatch,
    },
    async (request, reply) => {
      const { uuid } = request.params;
      const match: Match | null = await app.db.getMatch(uuid);
      if (!match) {
        return reply.status(404).send({ message: 'Match not found' });
      }
      const player1Name = match.player1Id
        ? await getPlayerName(app, match.player1Id, match)
        : null;
      const player2Name = match.player2Id
        ? await getPlayerName(app, match.player2Id, match)
        : null;
      return reply.status(200).send({
        uuid: match.uuid,
        status: match.status,
        player1Name,
        player2Name,
        score1: match.Score1,
        score2: match.Score2,
      } as MatchResponse);
    }
  );
}
