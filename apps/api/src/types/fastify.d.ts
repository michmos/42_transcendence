import Fastify, { FastifyInstance } from 'fastify';
import { userRole } from 'db/generated/client/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role?: userRole;
    };
  }
  interface FastifyInstance {
    addAuthHook: () => void;
  }
}
