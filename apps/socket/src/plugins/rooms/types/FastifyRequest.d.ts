declare module Fastify {
  interface FastifyRequest {
    user?: {
      uuid: string;
      role?: string;
    };
  }
}
