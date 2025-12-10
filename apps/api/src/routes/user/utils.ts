import type { User } from 'db/generated/client/client.js';

export function cleanOtherUserData(user: User): Partial<User> {
  const {
    nickname,
    avatar,
    isOnline,
    gamesPlayed,
    gamesWon,
    tournamentsPlayed,
    tournamentsWon,
  } = user;
  return {
    nickname,
    avatar,
    isOnline,
    gamesPlayed,
    gamesWon,
    tournamentsPlayed,
    tournamentsWon,
  };
}

export function cleanSelfUserData(user: User): Partial<User> {
  const {
    uuid,
    createdAt,
    nickname,
    avatar,
    role,
    isOnline,
    gamesPlayed,
    gamesWon,
    tournamentsPlayed,
    tournamentsWon,
  } = user;
  return {
    uuid,
    createdAt,
    nickname,
    avatar,
    role,
    isOnline,
    gamesPlayed,
    gamesWon,
    tournamentsPlayed,
    tournamentsWon,
  };
}
