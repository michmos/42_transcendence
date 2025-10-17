import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import * as MatchDatabase from './match.js';
import * as UserDatabase from './user.js';
import * as TournamentDatabase from './tournaments.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof MatchDatabase & typeof UserDatabase & typeof TournamentDatabase;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    console.info('🗄️  Loading database plugin...');

    app.decorate('db', {
      ...MatchDatabase,
      ...UserDatabase,
      ...TournamentDatabase,
    });
  },
  {
    name: 'database',
  }
);

// export { UserDatabase } from './user.js';
