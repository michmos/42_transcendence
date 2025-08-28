import Fastify from 'fastify';

const server = Fastify({ logger: { level: 'error' } });

server.get('/', async (request, reply) => {
    return { hello: 'world' };
});
