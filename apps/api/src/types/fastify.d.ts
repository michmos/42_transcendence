import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      uuid: string;
      role: string;
    };
  }
}

export {};
