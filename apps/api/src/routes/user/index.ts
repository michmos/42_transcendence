import { type FastifyInstance } from 'fastify';
import { isAdmin, isSameUUID } from '../../plugins/auth/utils.js';

export default async function (app: FastifyInstance): Promise<void> {
  app.get('/', async function (request, reply) {
    if (!isAdmin(request, reply)) return;

    const users = await app.db.getUsers();
    return reply.status(200).send(users);
  });

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
    const nickName = await app.db.generateUniqueNickName();
    return await app.db.addUser(email, nickName);
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
