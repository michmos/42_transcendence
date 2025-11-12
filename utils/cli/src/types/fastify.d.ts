import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    socket: Socket;
    providers: { name: string; buttonUri: string }[];
    hostname: string;
    jwtToken: string;
    user: User;
    gameInProgress: boolean;
  }
}
