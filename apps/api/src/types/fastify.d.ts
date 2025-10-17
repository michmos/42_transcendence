import Fastify from 'fastify';

declare namespace Fastify {
  interface FastifyRequest {
    user?: {
      uuid: string;
      email: string;
      username?: string;
      avatar?: string;
      role?: string;
    };
  }
}
