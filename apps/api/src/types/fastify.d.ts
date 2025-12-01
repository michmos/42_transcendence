import 'fastify';

/* eslint-disable no-unused-vars */

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      uuid: string;
      email?: string;
      username?: string;
      avatar?: string;
      role?: string;
    };
  }
}

export {};
