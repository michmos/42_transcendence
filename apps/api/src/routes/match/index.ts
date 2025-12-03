import { type FastifyInstance } from 'fastify';
import * as schemas from './validation.js';
import type { Match } from 'db/generated/client/index.js';
import { getPlayerName } from './utils.js';
import { type MatchResponse } from 'types';
import { isAdmin } from '../../plugins/auth/utils.js';
import type { singleUuidParam } from '../tournaments/validationSchemas.js';

export default async function (app: FastifyInstance): Promise<void> {
  app.get<{ Params: schemas.singleUuidParam }>(
    '/:uuid',
    {
      schema: schemas.getMatch,
      // TODO: define access restriction
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

  app.post<{ Body: schemas.createMatchBodyType }>(
    '/',
    {
      schema: schemas.createMatch,
      preHandler: async (request, reply) => {
        if (!isAdmin(request, reply)) return;
      },
    },
    async (request, reply) => {
      try {
        const match = await app.db.addMatch(request.body);
        return reply.status(201).send(match);
      } catch (error) {}
    }
  );

  app.patch<{ Body: schemas.updateMatchBodyType; Params: singleUuidParam }>(
    '/:uuid',
    {
      schema: schemas.updateMatch,
      preHandler: async (request, reply) => {
        if (!isAdmin(request, reply)) return;
      },
    },
    async (request, reply) => {
      const updatedMatch = await app.db.updateMatch({
        ...request.body,
        uuid: request.params.uuid,
      });
      return reply.status(200).send(updatedMatch);
    }
  );
}
