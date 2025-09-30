import type { FastifyInstance } from 'fastify';

import { SessionManager } from 'fastify-oauth/server';

// Import the database module from the database package
// This is where the getters and setters for users are defined
import Database from 'db';

// Import and register fastify-cookie plugin
import fastifyCookie from '@fastify/cookie';

export default async function (app: FastifyInstance): Promise<void> {
  await app.register(fastifyCookie);

  app.get('/', async function (request, reply) {
    // if (request.cookies) console.log('Joe', request.cookies.session);

    if (SessionManager.userIsLoggedIn(request.cookies.session as string)) {
      console.log('✅ Valid session cookie found');
      return await Database.getAllUsers();
    }
    return reply.status(401).send({ error: 'Unauthorized' });
  });

  app.get('/:uuid', async function (request) {
    const { uuid } = request.params as { uuid: string };
    return Database.getUser(uuid);
  });

  app.post('/', async function (request) {
    const { email } = request.body as {
      email: string;
    };
    if (!email) {
      return new Error('Email and username are required');
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
