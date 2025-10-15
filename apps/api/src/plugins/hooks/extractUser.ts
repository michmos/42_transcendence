import Fastify from 'fastify';

import Database from 'db';
import { userRole } from 'db/generated/client/index.js';
import { SessionManager } from 'fastify-oauth/server';

// Attach user info to request object for further use in route handlers
export default async function extractUserHook(
  request: Fastify.FastifyRequest,
  reply: Fastify.FastifyReply
) {
  console.log('🔒 Extract user hook called');
  const user = SessionManager.userIsLoggedIn(request.cookies.session as string);

  if (!user) {
    return;
  }

  const dbUser = await Database.getUser(user.uuid);
  if (!dbUser) {
    reply.status(401).send({ error: 'User not found in database' });
    return reply;
  }

  request.user = {
    id: dbUser.uuid,
    email: dbUser.email,
    role: dbUser.role || userRole.MEMBER,
  };
}
