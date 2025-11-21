import { friendshipState } from 'db/generated/client/client.js';

export interface fullFriendshipRecord {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
  friendAId: string;
  friendBId: string;
  state: friendshipState;
  friendA: { nickname: string; avatar: string | null };
  friendB: { nickname: string; avatar: string | null };
}

export interface cleanedFriendshipRecord {
  otherUser: string;
  avatar: string | null;
  state: friendshipState;
  isRequester: boolean;
}
