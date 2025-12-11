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

import { type status } from 'db/generated/client/index.js';

export interface MatchResponse {
  uuid: string;
  status: status;
  player1Name: string | null;
  player2Name: string | null;
  score1: number;
  score2: number;
}

export interface MatchRecord {
  updatedAt: Date;
  score1: number;
  score2: number;
  player1: { nickname: string } | null;
  player2: { nickname: string } | null;
  tournamentRoundId: string | null;
  winnerId: string | null;
}
