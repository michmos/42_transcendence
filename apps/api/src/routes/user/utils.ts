import type { User } from 'db/generated/client/client.js';
import type { CleanedOtherUser, CleanedUserData } from 'types';

export function cleanOtherUserData(user: User): CleanedOtherUser {
  const { nickname, avatar, isOnline } = user;
  return {
    nickname,
    avatar,
    isOnline,
  };
}

export function cleanSelfUserData(user: User): CleanedUserData {
  const { createdAt, nickname, avatar, role, isOnline } = user;
  return {
    createdAt,
    nickname,
    avatar,
    role,
    isOnline,
  };
}
