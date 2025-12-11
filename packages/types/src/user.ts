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

import { type User, type Friendship } from 'db/generated/client/index.js';

export interface UserMatchRecord {
  date: string;
  score1: number;
  score2: number;
  player1: string;
  player2: string;
  result: string;
  gameType: string;
}

export interface UserDashboardResponse {
  cleanedUserData: Partial<User>;
  cleanedUserFriends: Array<Partial<Friendship>>;
  userMatches: UserMatchRecord[];
}

export interface OnlineStatus {
  event: 'status-update';
  nickname: string;
  isOnline: boolean;
}

export interface OnlineUser {
  nickname: string;
  socketCount: number;
}

export type OnlineUsers = Map<string, OnlineUser>;
