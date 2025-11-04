import { type FastifyInstance } from 'fastify';
import { status as statusEnum } from 'db/generated/client/index.js';
import * as schemas from './validationSchemas.js';
import { isAdmin, getUuid } from '../../plugins/auth/utils.js';
import { isOpenTournament, isParticipant } from './utils.js';
import generateTournamentPlan from './matchmaking.js';

export default async function (app: FastifyInstance): Promise<void> {
  app.post<{ Body: schemas.createTournament }>(
    '/',
    {
      schema: schemas.createTournament,
      preHandler: async (request, reply) => {
        if (request.body.minPlayers > request.body.maxPlayers) {
          reply.status(400).send({
            error: 'maxPlayers must be >= minPlayers',
          });
        }
      },
    },
    async function (request, reply) {
      const tournament = await app.db.createTournament({
        ...request.body,
        userUuid: getUuid(request),
      });
      return reply.status(201).send(tournament);
    }
  );

  app.get<{ Querystring: schemas.getTournaments }>(
    '/',
    { schema: schemas.getTournaments },
    async function (request, reply) {
      let tournaments;
      if (request.query.status) {
        tournaments = await app.db.getTournamentsByStatus(request.query.status);
      } else {
        tournaments = await app.db.getAllTournaments();
      }
      return reply.status(200).send(tournaments);
    }
  );

  app.get<{ Params: schemas.getTournament }>(
    '/:uuid',
    { schema: schemas.getTournament },
    async function (request, reply) {
      const tournament = await app.db.getTournament(request.params.uuid);
      if (!tournament) {
        return reply.status(404).send({
          error: `Tournament with uuid: ${request.params.uuid} not found`,
        });
      }
      return reply.status(200).send(tournament);
    }
  );

  app.post<{ Params: schemas.addUserParams; Body: schemas.addUserBody }>(
    '/:uuid/users',
    {
      schema: schemas.addUser,
      preHandler: async (request, reply) => {
        if (!isOpenTournament(request.params.uuid, app, reply)) return;
        if (request.body.uuid !== undefined && !isAdmin(request, reply)) return;
      },
    },
    async function (request, reply) {
      const userUuid = request.body.uuid || getUuid(request);
      // add user
      let tournamentWithUser;
      try {
        tournamentWithUser = await app.db.addUserToTournament(
          userUuid,
          request.params.uuid
        );
      } catch (error) {
        return reply.status(404).send({
          error: `User not found: ${getUuid(request)}`,
        });
      }

      // update tournament status
      if (tournamentWithUser.playerCount === tournamentWithUser.maxPlayers) {
        await generateTournamentPlan(request.params.uuid, app);
        tournamentWithUser = await app.db.updateTournament({
          uuid: request.params.uuid,
          status: statusEnum.ongoing,
        });
      }
      return reply.status(204).send(tournamentWithUser);
    }
  );

  app.get<{ Params: schemas.getTournamentRound }>(
    '/:uuid/rounds/:roundIndex',
    {
      schema: schemas.getTournamentRound,
      preHandler: async (request, reply) => {
        if (!(await app.db.getTournament(request.params.uuid))) {
          return reply.status(404).send({
            error: `Tournament with uuid: $(request.params.uuid) not found`,
          });
        }
        if (!(await isParticipant(request, reply, app))) return;
      },
    },
    async function (request, reply) {
      const round = await app.db.getTournamentRound(
        request.params.uuid,
        request.params.roundIndex
      );
      if (!round) {
        return reply.status(404).send({
          error: `Tournament round with index: ${request.params.roundIndex} not found`,
        });
      }
      return reply.status(200).send(round);
    }
  );
}
