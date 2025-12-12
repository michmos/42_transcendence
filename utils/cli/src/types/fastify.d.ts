import 'fastify';
import { type User } from 'db/generated/client/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    socket: Socket;
    providers: Array<{ name: string; buttonUri: string }>;
    hostname: string;
    jwtToken: string | null;
    user: User | null;
    gameInProgress: boolean;
  }
}
