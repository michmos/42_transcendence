import Fastify from 'fastify';

export default async function checkAuthHook(
  request: Fastify.FastifyRequest,
  reply: Fastify.FastifyReply
) {
  console.log('🔒 Authentication hook called');

  // extractUser hook has been called before this, so request.user should be populated if the user is authenticated
  if (!request.user) {
    reply.status(401).send({ error: 'Unauthorized' });
    return reply;
  }
}
