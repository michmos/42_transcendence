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
      RoomManager.get('tournament:main')?.broadcast(
        JSON.stringify({
          event: 'tournament-started',
          uuid: request.body.tournamentUuid,
        })
      );

      RoomManager.get(`tournament:${request.body.tournamentUuid}`)?.broadcast(
        JSON.stringify({
          event: 'notify',
          message: `Join the first match of ${request.body.tournamentName}!`,
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
      RoomManager.get('tournament:main')?.broadcast(
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

      if (status === 'finished') {
        RoomManager.get(`tournament:${tournamentUuid}`)?.broadcast(
          JSON.stringify({
            event: 'notify',
            message: `Tournament '${tournamentName}' finished`,
          })
        );
      }
      return reply.status(200).send();
    }
  );
  app.post<{ Body: schemas.tournamentRoundStartedBody }>(
    '/broadcast/round/started',
    {
      schema: schemas.tournamentRoundStarted,
    },
    async function (request, reply) {
      // notify frontend about next round
      RoomManager.get(`tournament:main`)?.broadcast(
        JSON.stringify({
          event: 'tournament-next-round',
          uuid: request.body.tournamentUuid,
          currentRound: request.body.tournamentRound,
        })
      );

      // notify participants about playing next game
      RoomManager.get(`tournament:${request.body.tournamentUuid}`)?.broadcast(
        JSON.stringify({
          event: 'notify',
          message: `The next round opened in '${request.body.tournamentName}'. Play your next match now!`,
        })
      );
      return reply.status(200).send();
    }
  );
}
