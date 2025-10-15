import { type FastifyInstance } from 'fastify';
import { checkAdminAccess } from '../../plugins/auth/utils.js';

export default async function (app: FastifyInstance): Promise<void> {
  app.get('/', async function (request, reply) {
    if (!checkAdminAccess(request, reply)) return;

    const users = await app.db.user.getAll();
    console.log('Fetched users:', users);
    return reply.status(200).send(users);
  });

  app.get('/:uuid', async function (request) {
    const { uuid } = request.params as { uuid: string };
    return await app.db.user.get(uuid);
  });

  app.post('/', async function (request) {
    const { email } = request.body as { email: string };
    if (!email) {
      return new Error('Email is required');
    }
    return await app.db.user.add(
      email,
      email.split('@')[0] || 'user' + Math.floor(Math.random() * 1000)
    );
  });

  app.delete('/', async function (request) {
    const { uuid } = request.body as { uuid: string };
    if (!uuid) {
      return new Error('UUID is required');
    }
    return await app.db.user.remove(uuid);
  });
}
