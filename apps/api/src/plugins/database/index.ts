import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import * as MatchDatabase from './match.js';
import * as UserDatabase from './user.js';
import * as TournamentDatabase from './tournaments.js';
import * as FriendshipDatabase from './friendship.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof UserDatabase &
      typeof FriendshipDatabase &
      typeof MatchDatabase &
      typeof TournamentDatabase & {
        clearAllData: () => Promise<void>;
      };
  }
}

export async function clearAllData() {
  // order important due to cascading of deletion
  await TournamentDatabase.removeAllTournaments();
  await MatchDatabase.removeAllMatches();
  await FriendshipDatabase.deleteAllFriendRelations();
  await UserDatabase.removeAllUsers();
}

export default fp(
  async (app: FastifyInstance) => {
    console.info('🗄️  Loading database plugin...');

    app.decorate('db', {
      ...UserDatabase,
      ...FriendshipDatabase,
      ...MatchDatabase,
      ...TournamentDatabase,
      clearAllData: clearAllData,
    });
  },
  {
    name: 'database',
  }
);

// export { UserDatabase } from './user.js';
