import 'fastify';
import { User } from 'db';

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
