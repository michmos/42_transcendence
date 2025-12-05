import { type FastifyInstance } from 'fastify';
import * as schemas from './validation.js';
import { type Match, Prisma } from 'db/generated/client/index.js';
import { getPlayerName, isFinishedTournamentRound } from './utils.js';
import { type MatchResponse } from 'types';
import { isAdmin } from '../../plugins/auth/utils.js';
import { messageSocketServer } from '../tournaments/utils.js';

export default function (app: FastifyInstance): void {
  app.get<{ Params: schemas.singleUuidParam }>(
    '/:uuid',
    {
      schema: schemas.getMatch,
    },
    async (request, reply) => {
      const { uuid } = request.params;
      const match: Match | null = await app.db.getMatch(uuid);
      if (!match) {
        return reply
          .status(404)
          .send({ error: `match ${request.params.uuid} not found` });
      }
      // determine displayable names
      const player1Name = match.player1Id
        ? await getPlayerName(app, match.player1Id, match)
        : null;
      const player2Name = match.player2Id
        ? await getPlayerName(app, match.player2Id, match)
        : null;
      const matchResponse: MatchResponse = {
        uuid: match.uuid,
        status: match.status,
        player1Name,
        player2Name,
        score1: match.score1,
        score2: match.score2,
      };
      return reply.status(200).send(matchResponse);
    }
  );

  app.post<{ Body: schemas.createMatchBodyType }>(
    '/',
    {
      schema: schemas.createMatch,
      preHandler: (request, reply, done) => {
        if (!isAdmin(request, reply)) {
        }
        done();
        return;
      },
    },
    async (request, reply) => {
      try {
        const match = await app.db.addMatch(request.body);
        return reply.status(201).send(match);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return reply.status(404).send({ error: `user not found` });
          }
        }
        throw error;
      }
    }
  );

  app.patch<{
    Body: schemas.updateMatchesBodyType;
    Querystring: schemas.updateMatchesQuerystringType;
  }>(
    '/',
    {
      schema: schemas.updateMatches,
      preHandler: (request, reply, done) => {
        if (!isAdmin(request, reply)) {
        }
        done();
        return;
      },
    },
    async (request, reply) => {
      if (Object.keys(request.body).length === 0) {
        return reply.status(400).send({ error: 'Body cannot be empty' });
      }
      const matches = await app.db.updateMatchesByStatus(
        request.body,
        request.query.status
      );
      reply.status(204).send();

      // notify socket server about finished rounds
      for (const match of matches) {
        if (
          match.tournamentRoundId !== null &&
          (await isFinishedTournamentRound(app, match.tournamentRoundId))
        ) {
          messageSocketServer('/tournaments/broadcast/updated', {
            matchUuid: match.uuid,
            ...request.body,
          });
        }
      }
    }
  );

  app.patch<{
    Body: schemas.updateMatchBodyType;
    Params: schemas.singleUuidParam;
  }>(
    '/:uuid',
    {
      schema: schemas.updateMatch,
      preHandler: (request, reply, done) => {
        if (!isAdmin(request, reply)) {
        }
        done();
        return;
      },
    },
    async (request, reply) => {
      try {
        const updatedMatch = await app.db.updateMatch({
          ...request.body,
          uuid: request.params.uuid,
        });

        return reply.status(200).send(updatedMatch);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return reply
              .status(404)
              .send({ error: `match ${request.params.uuid} not found` });
          }
        }
        throw error;
      }
    }
  );
}
