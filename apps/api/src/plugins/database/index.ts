import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import * as MatchDatabase from './match.js';
import * as UserDatabase from './user.js';
import * as TournamentDatabase from './tournaments.js';
import * as FriendsDatabase from './friends.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof UserDatabase &
      typeof FriendsDatabase &
      typeof MatchDatabase &
      typeof TournamentDatabase;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    console.info('🗄️  Loading database plugin...');

    app.decorate('db', {
      ...UserDatabase,
      ...FriendsDatabase,
      ...MatchDatabase,
      ...TournamentDatabase,
    });
  },
  {
    name: 'database',
  }
);

// export { UserDatabase } from './user.js';
