import { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';

import Database from 'db';
import { userRole } from 'db/generated/client/index.js';

export default async function (app: FastifyInstance): Promise<void> {
  await app.register(fastifyCookie);

  app.addAuthHook();

  app.get('/', async function (request, reply) {
    if (request.user?.role !== userRole.ADMIN) {
      return reply
        .status(403)
        .send({ error: 'Forbidden. ADMIN role required.' });
    }
    const users = await Database.getAllUsers();
    console.log('Fetched users:', users);
    return reply.status(200).send(users);
  });

  app.get('/:uuid', async function (request) {
    const { uuid } = request.params as { uuid: string };
    return await Database.getUser(uuid);
  });

  app.post('/', async function (request) {
    const { email } = request.body as {
      email: string;
    };
    if (!email) {
      return new Error('Email and username are required'); // TODO: we are not even getting the username here no?
    }
    return await Database.addUser(
      email,
      email.split('@')[0] || 'user' + Math.floor(Math.random() * 1000)
    );
  });

  app.delete('/', async function (request) {
    const { uuid } = request.body as { uuid: string };
    if (!uuid) {
      return new Error('UUID is required');
    }
    return await Database.removeUser(uuid);
  });
}
