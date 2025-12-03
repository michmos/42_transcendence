// 1. put all type / interface exports here
//
//    export type SomeType = {
//      id: number;
//     }
//
// 2. add dev dependency to the package where types are needed
//    pnpm add -D types@../../packages/types
//
// 3. import type you need
//    import { SomeType } from 'types';

import { User, Friendship, type status } from 'db/generated/client/index.js';

export type TournamentRoundResponse = {
  status: status;
  index: number;
  matches: Array<{
    uuid: string;
  }>;
};

export type UserMatchRecord = {
    date: string;
    score1: number;
    score2: number;
    player1: string;
    player2: string;
    result: string;
    gameType: string;
};

export type UserDashboardResponse = {
  cleanedUserData: Partial<User>;
  cleanedUserFriends: Partial<Friendship>[];
  userMatches: UserMatchRecord[];
};
