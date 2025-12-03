import type { FastifyInstance } from 'fastify';
import { env } from '../../env.js';

export default async function (app: FastifyInstance): Promise<void> {
  console.log('Registering CORS plugin with VITE_URL:', env.VITE_URL);

  // Enable CORS for all routes
  app.addHook('preHandler', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', env.VITE_URL);
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
