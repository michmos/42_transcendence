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

export default function (app: FastifyInstance): void {
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
      return reply.status(200).send();
    }
  );
  app.post<{ Body: schemas.tournamentStartedBody }>(
    '/broadcast/started',
    {
      schema: schemas.tournamentStarted,
    },
    async function (request, reply) {
      // Only broadcast to specific tournament room (participants only)
      // This prevents duplicate toasts for users in both tournament:main and tournament:${uuid}
      RoomManager.get(`tournament:${request.body.tournamentUuid}`)?.broadcast(
        JSON.stringify({
          event: 'tournament-started',
          uuid: request.body.tournamentUuid,
          tournamentName: request.body.tournamentName,
        })
      );

      // TODO: handle tournament start here
      RoomManager.get(`tournament:${request.body.tournamentUuid}`)?.broadcast(
        JSON.stringify({
          event: 'notify',
          message: `Join the first match of ${request.body.tournamentName} in the next 60 seconds!`,
        })
      );
      return reply.status(200).send();
    }
  );
  app.post<{ Body: schemas.tournamentJoinedBody }>(
    '/broadcast/joined',
    {
      schema: schemas.tournamentJoined,
    },
    async function (request, reply) {
      const { userUuid, tournamentUuid } = request.body;

      const participants = cachedTournamentParticipations.get(tournamentUuid);
      if (!participants) {
        return reply.status(409).send();
      }

      participants.add(userUuid);

      // Broadcast to tournament:main for list updates (player count change)
      // This allows everyone to see updated player counts in real-time
      RoomManager.get('tournament:main')?.broadcast(
        JSON.stringify({
          event: 'tournament-joined',
          uuid: tournamentUuid,
          playerCount: request.body.playerCount,
        })
      );

      // Broadcast to specific tournament room for participant notifications (toast)
      RoomManager.get(`tournament:${tournamentUuid}`)?.broadcast(
        JSON.stringify({
          event: 'tournament-joined',
          uuid: tournamentUuid,
          playerCount: request.body.playerCount,
        })
      );

      return reply.status(200).send();
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
        return reply.status(409).send();
      }
      participants.delete(userUuid);
      return reply.status(200).send();
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
      return reply.status(200).send();
    }
  );
}
