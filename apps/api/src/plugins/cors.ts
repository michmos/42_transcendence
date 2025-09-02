import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function (
    app: FastifyInstance,
    opts: FastifyPluginOptions
): Promise<void> {
    // Enable CORS for all routes
    app.addHook('preHandler', async (request, reply) => {
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            reply.status(200).send();
        }
    });
}
