import type { FastifyInstance } from 'fastify';

import { SessionManager } from 'fastify-oauth/server';

// Import the database module from the database package
// This is where the getters and setters for users are defined
import Database from 'db';

// Import and register fastify-cookie plugin
import fastifyCookie from '@fastify/cookie';
import { userRole } from 'db/generated/client';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role?: userRole;
      // Add more fields depending on what your SessionManager returns
    };
  }
}

export default async function (app: FastifyInstance): Promise<void> {
  await app.register(fastifyCookie);

  // Add authentication hook to protect all /api/user routes
  app.addHook('preHandler', async (request, reply) => {
    console.log('➡️ Incoming request:', request.method, request.url);
    const user = SessionManager.userIsLoggedIn(
      request.cookies.session as string
    );

    if (!user) return reply.status(401).send({ error: 'Unauthorized' });
    console.log('✅ Valid session cookie found');

    const dbUser = await Database.getUser(user.uuid);
    if (!dbUser)
      return reply.status(401).send({ error: 'User not found in database' });
    console.log('✅ User found in database:', dbUser.email);

    // Attach user info to request object for further use in route handlers
    request.user = {
      id: dbUser.uuid,
      email: dbUser.email,
      role: dbUser.role || userRole.MEMBER,
    };
  });

  app.get('/', async function () {
    return await Database.getAllUsers();
  });

  app.get('/:uuid', async function (request, reply) {
    if (request.user?.role !== userRole.ADMIN) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
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
