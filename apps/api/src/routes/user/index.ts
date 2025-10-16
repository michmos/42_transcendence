import { type FastifyInstance } from 'fastify';
import {
  checkAdminAccess,
  verifyResourceOwnership,
} from '../../plugins/auth/utils.js';

export default async function (app: FastifyInstance): Promise<void> {
  app.get('/', async function (request, reply) {
    if (!checkAdminAccess(request, reply)) return;

    const users = await app.db.getUsers();
    console.log('Fetched users:', users);
    return reply.status(200).send(users);
  });

  app.get('/:uuid', async function (request, reply) {
    const { uuid } = request.params as { uuid: string };

    if (
      !checkAdminAccess(request, reply) &&
      !verifyResourceOwnership(request, reply, uuid)
    ) {
      return;
    }
    return await app.db.getUser(uuid);
  });

  app.post('/', async function (request, reply) {
    const { email } = request.body as { email: string };

    if (!checkAdminAccess(request, reply)) return;

    if (!email) {
      return new Error('Email is required');
    }

    return await app.db.addUser(
      email,
      email.split('@')[0] || 'user' + Math.floor(Math.random() * 1000)
    );
  });

  app.delete('/', async function (request, reply) {
    const { uuid } = request.body as { uuid: string };

    if (!checkAdminAccess(request, reply)) return;

    if (!uuid) {
      return new Error('UUID is required');
    }
    return await app.db.removeUser(uuid);
  });
}
