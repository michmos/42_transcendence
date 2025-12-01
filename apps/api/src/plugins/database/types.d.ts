// Database plugin type declarations

import type * as MatchDatabase from './match.ts';
import type * as UserDatabase from './user.ts';
import type * as TournamentDatabase from './tournaments.ts';
import type * as FriendshipDatabase from './friendship.ts';

/* eslint-disable no-unused-vars */
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
/* eslint-enable no-unused-vars */

export {};
