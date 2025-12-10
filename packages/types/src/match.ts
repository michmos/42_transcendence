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

export interface MatchParticipantsResponse {
  player1Id: string | null;
  player2Id: string | null;
}
