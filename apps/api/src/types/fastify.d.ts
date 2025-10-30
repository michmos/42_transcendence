import Fastify from 'fastify';

declare namespace Fastify {
  interface FastifyRequest {
    user?: {
      uuid: string;
      role?: string;
    };
  }
}
