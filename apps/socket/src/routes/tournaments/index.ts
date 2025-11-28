import { type FastifyInstance } from 'fastify';
import * as schemas from './validation.js';
import RoomManager from '../../plugins/rooms/WSocket/RoomManager.js';

const cachedTournamentParticipations = new Map<string, Set<string>>();

export function participatesInTournament(
  userUuid: string,
  tournamentUuid: string
) {
  return (
    cachedTournamentParticipations.get(tournamentUuid)?.has(userUuid) === true
  );
}

export default async function (app: FastifyInstance): Promise<void> {
  app.post<{ Body: schemas.tournamentCreatedBody }>(
    '/broadcast/created',
    {
      schema: schemas.tournamentCreated,
    },
    async function (request, reply) {
      RoomManager.get('tournament:main')?.broadcast(
        JSON.stringify({
          event: 'tournament-created',
          uuid: request.body.tournamentUuid,
        })
      );

      cachedTournamentParticipations.set(
        request.body.tournamentUuid,
        new Set<string>()
      );
      return reply.status(200);
    }
  );
  app.post<{ Body: schemas.tournamentStartedBody }>(
    '/broadcast/started',
    {
      schema: schemas.tournamentStarted,
    },
    async function (request, reply) {
      RoomManager.get('tournament:main')?.broadcast(
        JSON.stringify({
          event: 'tournament-started',
          uuid: request.body.tournamentUuid,
        })
      );

      // TODO: handle tournament start here
      RoomManager.get(`tournament:${request.body.tournamentUuid}`)?.broadcast(
        JSON.stringify({
          event: 'notify',
          message: `Join the first match of ${request.body.tournamentName} in the next 60 seconds!`,
        })
      );
      return reply.status(200);
    }
  );
  app.post<{ Body: schemas.tournamentJoinedBody }>(
    '/broadcast/joined',
    {
      schema: schemas.tournamentJoined,
    },
    async function (request, reply) {
      const { userUuid, tournamentUuid } = request.body;

      RoomManager.get('tournament:main')?.broadcast(
        JSON.stringify({
          event: 'tournament-joined',
          uuid: tournamentUuid,
          playerCount: request.body.playerCount,
        })
      );

      const participants = cachedTournamentParticipations.get(tournamentUuid);
      if (!participants) {
        return reply.status(409);
      }
      participants.add(userUuid);
      return reply.status(200);
    }
  );
  app.post<{ Body: schemas.tournamentLeftBody }>(
    '/broadcast/left',
    {
      schema: schemas.tournamentLeft,
    },
    async function (request, reply) {
      const { userUuid, tournamentUuid } = request.body;

      RoomManager.get('tournament:main')?.broadcast(
        JSON.stringify({
          event: 'tournament-left',
          uuid: tournamentUuid,
          playerCount: request.body.playerCount,
        })
      );

      const participants = cachedTournamentParticipations.get(tournamentUuid);
      if (!participants) {
        return reply.status(409);
      }
      participants.delete(userUuid);
      return reply.status(200);
    }
  );
  app.post<{ Body: schemas.tournamentUpdatedBody }>(
    '/broadcast/updated',
    {
      schema: schemas.tournamentUpdated,
    },
    async function (request, reply) {
      const { tournamentUuid, status, tournamentName } = request.body;

      RoomManager.get('tournament:main')?.broadcast(
        JSON.stringify({
          event: 'tournament-updated',
          uuid: tournamentUuid,
          tournamentName,
          status,
        })
      );
      return reply.status(200);
    }
  );
}
