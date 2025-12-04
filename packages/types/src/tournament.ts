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

export type TournamentRoundResponse = {
  status: status;
  index: number;
  matches: Array<{
    uuid: string;
  }>;
};
