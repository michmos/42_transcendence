import { type FastifyInstance } from 'fastify';
import * as schemas from './validationSchemas.js';
import { isAdmin, getUuid } from '../../plugins/auth/utils.js';
import generateTournamentPlan from './matchmaking.js';
import { messageSocketServer } from './utils.js';
import { status as statusEnum, type User } from 'db/generated/client/index.js';
import { type TournamentRoundResponse } from 'types';
import { Prisma } from 'db/generated/client';

export default function (app: FastifyInstance): void {
  // create tournament
  app.post<{ Body: schemas.createTournamentBody }>(
    '/',
    {
      schema: schemas.createTournament,
      preHandler: (request, reply, done) => {
        if (request.body.minPlayers > request.body.maxPlayers) {
          reply.status(400).send({
            error: 'maxPlayers must be >= minPlayers',
          });
        }
        done();
      },
    },
    async function (request, reply) {
      const tournament = await app.db.createTournament({
        ...request.body,
      });
      reply.status(201).send(tournament);
      await messageSocketServer('/tournaments/broadcast/created', {
        tournamentUuid: tournament.uuid,
      });
    }
  );

  // start tournament
  app.patch<{
    Params: schemas.singleUuidParam;
  }>(
    '/:uuid/start',
    {
      schema: schemas.startTournament,
    },
    async function (request, reply) {
      const tournamentUuid = request.params.uuid;
      // is existing tournament
      const tournament = await app.db.getTournament(tournamentUuid);
      if (!tournament) {
        return reply.status(404).send({
          error: `Tournament with ${tournamentUuid} does not exist`,
        });
      }

      // status is outstanding
      if (tournament.status !== statusEnum.outstanding) {
        return reply.status(422).send({
          error: `Tournament cannot be started: status: ${tournament.status}`,
        });
      }

      // enough players
      if (tournament.playerCount < tournament.minPlayers) {
        return reply.status(422).send({
          error: `Tournament cannot be started: not enough players (current: ${tournament.playerCount}, min: ${tournament.minPlayers})`,
        });
      }

      // user participates in tournament
      if (
        !(await app.db.participatesInTournament(
          getUuid(request),
          request.params.uuid
        ))
      ) {
        return reply.status(403).send({
          error: 'Unauthorized: User does not participate in Tournament',
        });
      }

      // generate Tournament plan
      await generateTournamentPlan(request.params.uuid, app);

      // change tournament status
      const updatedTournament = await app.db.updateTournament({
        uuid: request.params.uuid,
        status: statusEnum.ongoing,
      });

      // notify socket server
      await messageSocketServer(`/tournaments/broadcast/started`, {
        tournamentUuid: tournament.uuid,
        tournamentName: updatedTournament.tournamentName,
      });

      return reply.status(200).send(updatedTournament);
    }
  );

  // join tournament
  app.post<{
    Params: schemas.singleUuidParam;
    Body: schemas.joinTournamentBody;
  }>(
    '/:uuid/users',
    {
      schema: schemas.joinTournament,
      preHandler: (request, reply, done) => {
        if (request.body.uuid !== undefined && !isAdmin(request, reply)) {
        }
        done();
      },
    },
    async function (request, reply) {
      const tournamentUuid = request.params.uuid;
      // is existing tournament
      const tournament = await app.db.getTournament(tournamentUuid);
      if (!tournament) {
        return reply.status(404).send({
          error: `Tournament with ${tournamentUuid} does not exist`,
        });
      }

      // status is outstanding
      if (tournament.status !== statusEnum.outstanding) {
        return reply.status(422).send({
          error: `Tournament cannot be joined: status: ${tournament.status}`,
        });
      }

      let userUuid = getUuid(request);
      if (request.body.uuid !== undefined) {
        userUuid = request.body.uuid;
        // user exists
        if (!(await app.db.getUser(userUuid))) {
          return reply.status(404).send({ error: 'User not found' });
        }
      }

      // user not already in tournament
      if (await app.db.participatesInTournament(userUuid, tournamentUuid)) {
        return reply
          .status(409)
          .send({ error: 'User already participates in tournament' });
      }

      // tournament is not yet full
      if (tournament.playerCount >= tournament.maxPlayers) {
        return reply.status(409).send({
          error: 'Tournament cannot be joined: max amount of players reached',
        });
      }

      // add user
      try {
        const updatedTournament = await app.db.addUserToTournament(
          userUuid,
          tournamentUuid,
          request.body.alias
        );

        // notify socket server
        await messageSocketServer(`/tournaments/broadcast/joined`, {
          tournamentUuid: tournament.uuid,
          userUuid,
          playerCount: updatedTournament.playerCount,
        });
        return reply.status(200).send(updatedTournament);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return reply
            .status(409)
            .send('Alias already taken in this tournament');
        } else {
          throw error;
        }
      }
    }
  );

  // leave tournament
  app.delete<{
    Params: schemas.singleUuidParam;
    Body: schemas.leaveTournamentBody;
  }>(
    '/:uuid/users',
    {
      schema: schemas.leaveTournament,
      preHandler: (request, reply, done) => {
        if (request.body.uuid !== undefined && !isAdmin(request, reply)) {
        }
        done();
      },
    },
    async function (request, reply) {
      const tournamentUuid = request.params.uuid;
      // is existing tournament
      const tournament = await app.db.getTournament(tournamentUuid);
      if (!tournament) {
        return reply.status(404).send({
          error: `Tournament with ${tournamentUuid} does not exist`,
        });
      }

      // status is outstanding
      if (tournament.status !== statusEnum.outstanding) {
        return reply.status(422).send({
          error: `Tournament cannot be left: status: ${tournament.status}`,
        });
      }

      let userUuid = getUuid(request);
      if (request.body.uuid !== undefined) {
        userUuid = request.body.uuid;
        // user exists
        if (!(await app.db.getUser(userUuid))) {
          return reply.status(404).send({ error: 'User not found' });
        }
      }

      // user is in tournament
      if (!(await app.db.participatesInTournament(userUuid, tournamentUuid))) {
        return reply
          .status(409)
          .send({ error: 'User does not participate in tournament' });
      }

      // remove user
      const updatedTournament = await app.db.removeUserFromTournament(
        userUuid,
        tournamentUuid
      );

      // notify socket server
      await messageSocketServer(`/tournaments/broadcast/left`, {
        tournamentUuid: tournament.uuid,
        userUuid,
        playerCount: updatedTournament.playerCount,
      });
      return reply.status(200).send(updatedTournament);
    }
  );

  // update tournament
  app.patch<{
    Body: schemas.updateTournamentBody;
    Params: schemas.singleUuidParam;
  }>(
    '/:uuid',
    {
      schema: schemas.updateTournament,
      preHandler: (request, reply, done) => {
        if (!isAdmin(request, reply)) {
          return done();
        }
        if (Object.values(request.body).length === 0) {
          reply.status(400).send({
            error: 'Only status and tournamentName can be updated',
          });
          return done();
        }
        done();
      },
    },
    async function (request, reply) {
      const tournamentUuid = request.params.uuid;

      // check existss
      const existingTournament = await app.db.getTournament(
        request.params.uuid
      );
      if (!existingTournament) {
        return reply.status(404).send({
          error: `Tournament with uuid: ${tournamentUuid} not found`,
        });
      }

      const updatedTournament = await app.db.updateTournament({
        uuid: request.params.uuid,
        ...request.body,
      });

      // notify socket server
      await messageSocketServer(`/tournaments/broadcast/updated`, {
        tournamentUuid: updatedTournament.uuid,
        status: updatedTournament.status,
        tournamentName: updatedTournament.tournamentName,
      });
      return reply.status(200).send(updatedTournament);
    }
  );

  // get tournaments
  app.get<{ Querystring: schemas.getTournamentsQuerystring }>(
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

  // get specific tournament
  app.get<{ Params: schemas.singleUuidParam }>(
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

  // get tournament participants
  app.get<{ Params: schemas.singleUuidParam }>(
    '/:uuid/participants',
    { schema: schemas.getTournamentParticipants },
    async function (request, reply) {
      const tournamentId = request.params.uuid;
      // check exists
      const tournament = await app.db.getTournament(tournamentId);
      if (!tournament) {
        return reply.status(404).send({
          error: `Tournament with uuid: ${request.params.uuid} not found`,
        });
      }

      const participants: User[] =
        await app.db.getTournamentParticipants(tournamentId);

      const participantNames = await Promise.all(
        participants.map((user) => app.db.getUserAlias(user.uuid, tournamentId))
      );
      return reply.status(200).send(participantNames);
    }
  );

  // get tournament round
  app.get<{ Params: schemas.getTournamentRoundParams }>(
    '/:uuid/rounds/:roundIndex',
    {
      schema: schemas.getTournamentRound,
    },
    async function (request, reply) {
      const tournamentUuid = request.params.uuid;

      // check exists
      const tournament = await app.db.getTournament(tournamentUuid);
      if (!tournament) {
        return reply.status(404).send({
          error: `Tournament with uuid: ${request.params.uuid} not found`,
        });
      }

      // check participation or admin status
      if (
        !(await app.db.participatesInTournament(
          getUuid(request),
          request.params.uuid
        )) &&
        !isAdmin(request, reply)
      ) {
        return reply
          .status(403)
          .send({ error: `User is not participating in this tournament` });
      }

      // get round
      const round: TournamentRoundResponse | null =
        await app.db.getTournamentRound(
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
