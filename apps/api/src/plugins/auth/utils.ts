import Fastify from 'fastify';

import { userRole } from 'db/generated/client/index.js';

/**
 *
 * @param request
 * @param reply
 * @returns true if the user is an admin, false otherwise (and sends the appropriate HTTP response)
 */
export function isAdmin(
  request: Fastify.FastifyRequest,
  reply: Fastify.FastifyReply
): boolean {
  const user = request.user as { uuid: string; role: string } | undefined;
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
      request.ip
    );
    return false;
  }
  return true;
}

export function getUuid(request: Fastify.FastifyRequest): string {
  const uuid = request.user?.uuid;
  if (!uuid) {
    throw new Error('Invalid invocation of getUuid: no user in request');
  }
  return uuid;
}

/**
 *
 * @param request
 * @param reply
 * @param resourceOwnerUuid
 * @returns true if the user owns the resource or is an admin, false otherwise (and sends the appropriate HTTP response)
 */
export function isSameUUID(
  request: Fastify.FastifyRequest,
  reply: Fastify.FastifyReply,
  resourceOwnerUuid: string
): boolean {
  const user = request.user as { uuid: string; role: string } | undefined;
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
      'Forbidden access attempt from user with uuid:',
      user.uuid,
      'to resource owned by user with uuid:',
      resourceOwnerUuid
    );
    return false;
  }
  return true;
}
