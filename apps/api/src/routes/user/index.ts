import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';

import Database from 'db';
import { userRole } from 'db/generated/client/index.js';
import CryptoManager from '../../plugins/encryption/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role?: userRole;
    };
  }
}

import { SessionManager } from 'fastify-oauth/server';

async function checkAuthenticationHook(
  request: Fastify.FastifyRequest,
  reply: Fastify.FastifyReply
) {
  console.log('🔒 Authentication hook called');
  const user = SessionManager.userIsLoggedIn(request.cookies.session as string);

  if (!user) return reply.status(401).send({ error: 'Unauthorized' });

  const dbUser = await Database.getUser(user.uuid);
  if (!dbUser)
    return reply.status(401).send({ error: 'User not found in database' });

  // Attach user info to request object for further use in route handlers
  request.user = {
    id: dbUser.uuid,
    email: dbUser.email,
    role: dbUser.role || userRole.MEMBER,
  };
}

export default async function (app: FastifyInstance): Promise<void> {
  await app.register(fastifyCookie);

  app.addHook('preHandler', CryptoManager.uuidDecryption.bind(CryptoManager));
  app.addHook('onRequest', checkAuthenticationHook);
  app.addHook('onSend', CryptoManager.uuidEmailEncryption.bind(CryptoManager));

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
