import type { User } from 'db/generated/client/client.js';

export function cleanOtherUserData(user: User): Partial<User> {
  const {
    nickname,
    avatar,
    gamesPlayed,
    gamesWon,
    tournamentsPlayed,
    tournamentsWon,
  } = user;
  return {
    nickname,
    avatar,
    gamesPlayed,
    gamesWon,
    tournamentsPlayed,
    tournamentsWon,
  };
}

export function cleanSelfUserData(user: User): Partial<User> {
  const {
    createdAt,
    nickname,
    avatar,
    role,
    gamesPlayed,
    gamesWon,
    tournamentsPlayed,
    tournamentsWon,
  } = user;
  return {
    createdAt,
    nickname,
    avatar,
    role,
    gamesPlayed,
    gamesWon,
    tournamentsPlayed,
    tournamentsWon,
  };
}
