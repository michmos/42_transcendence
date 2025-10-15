import Fastify from 'fastify';

import { type User, userRole } from 'db/generated/client/index.js';

/**
 *
 * @param request
 * @param reply
 * @returns true if the user is an admin, false otherwise (and sends the appropriate HTTP response)
 */
export function checkAdminAccess(
  request: Fastify.FastifyRequest,
  reply: Fastify.FastifyReply
): boolean {
  const user = request.user as User | undefined;
  if (!user) {
    reply.status(401).send({ error: 'Unauthorized. Please log in.' });
    console.warn(
      'Unauthorized access attempt from ip address:',
      request.ip,
      'with invalid user session'
    );
    return false;
  }

  if (user.role !== userRole.ADMIN) {
    reply.status(403).send({ error: 'Forbidden. ADMIN role required.' });
    console.warn(
      'Unauthorized admin access attempt from ip address:',
      request.ip,
      'with user:',
      user?.email || 'unknown'
    );
    return false;
  }
  return true;
}

/**
 *
 * @param request
 * @param reply
 * @param resourceOwnerUuid
 * @returns true if the user owns the resource or is an admin, false otherwise (and sends the appropriate HTTP response)
 */
export function verifyResourceOwnership(
  request: Fastify.FastifyRequest,
  reply: Fastify.FastifyReply,
  resourceOwnerUuid: string
): boolean {
  const user = request.user as User | undefined;
  if (!user) {
    reply.status(401).send({ error: 'Unauthorized. Please log in.' });
    console.warn(
      'Unauthorized access attempt from ip address:',
      request.ip,
      'to resource owned by user with uuid:',
      resourceOwnerUuid
    );
    return false;
  }
  if (user.uuid !== resourceOwnerUuid && user.role !== userRole.ADMIN) {
    reply
      .status(403)
      .send({ error: 'Forbidden. You do not own this resource.' });
    console.warn(
      'Forbidden access attempt from user:',
      user.email,
      'to resource owned by user with uuid:',
      resourceOwnerUuid
    );
    return false;
  }
  return true;
}
