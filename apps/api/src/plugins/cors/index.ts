import type { FastifyInstance } from 'fastify';
import { env } from '../../env.js';

export default function (app: FastifyInstance) {
  console.log('Registering CORS plugin with CORS_URL:', env.CORS_URL);

  // Enable CORS for all routes
  app.addHook('preHandler', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', env.CORS_URL);
    reply.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      reply.status(200).send();
    }
  });
}
