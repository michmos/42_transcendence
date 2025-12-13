import type { User } from 'db/generated/client/client.js';
import type { CleanedOtherUserData, CleanedSelfUserData } from 'types';

export function cleanOtherUserData(user: User): CleanedOtherUserData {
  const { nickname, avatar, isOnline } = user;
  return {
    nickname,
    avatar,
    isOnline,
  };
}

export function cleanSelfUserData(user: User): CleanedSelfUserData {
  const { createdAt, nickname, avatar, role, isOnline } = user;
  return {
    createdAt,
    nickname,
    avatar,
    role,
    isOnline,
  };
}
