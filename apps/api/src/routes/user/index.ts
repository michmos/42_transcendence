import { type FastifyInstance } from 'fastify';
import { isAdmin, getUuid, isSameUUID } from '../../plugins/auth/utils.js';
import { getTournaments } from '../tournaments/validationSchemas.js';

export default async function (app: FastifyInstance): Promise<void> {
  app.get('/', async function (request, reply) {
    if (!isAdmin(request, reply)) return;

    const users = await app.db.getUsers();
    return reply.status(200).send(users);
  });

  app.get('/me', async function (request, reply) {
    const user = await app.db.getUser(getUuid(request));
    return reply.status(200).send(user);
  });

  app.get<{ Querystring: getTournaments }>(
    '/me/tournaments',
    { schema: getTournaments },
    async function (request, reply) {
      const tournaments = await app.db.getTournamentsByParticipant(
        getUuid(request),
        request.query.status
      );
      return reply.status(200).send(tournaments);
    }
  );

  app.get('/:uuid', async function (request, reply) {
    const { uuid } = request.params as { uuid: string };

    if (!isAdmin(request, reply) && !isSameUUID(request, reply, uuid)) {
      return;
    }

    return await app.db.getUser(uuid);
  });

  app.post('/', async function (request, reply) {
    const { email } = request.body as { email: string };

    if (!isAdmin(request, reply)) return;

    if (!email) {
      return new Error('Email is required');
    }
    const nickname = await app.db.generateUniqueNickName();
    return await app.db.addUser(email, nickname);
  });

  app.delete('/', async function (request, reply) {
    const { uuid } = request.body as { uuid: string };

    if (!isAdmin(request, reply)) return;

    if (!uuid) {
      return new Error('UUID is required');
    }
    return await app.db.removeUser(uuid);
  });
}
