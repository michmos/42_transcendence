import fp from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import { env } from '../../env.js';

async function authPlugin(app: FastifyInstance) {
  app.addHook('preHandler', async function (request, reply) {
    const key = request.headers['x-api-server-key'];
    if (!key || key !== env.API_SERVER_KEY) {
      console.log('Unauthorized access attempt with key:', key);
      return reply.status(401);
    }
  });
}

export default fp(authPlugin, {
  name: 'authPlugin',
});
