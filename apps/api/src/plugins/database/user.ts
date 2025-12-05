import { type User, status } from 'db/generated/client/index.js';
import Database from 'db';
import { generateNickName } from './utils.js';
import type { UserMatchRecord } from 'types';

export async function getUsers(): Promise<User[]> {
  return Database.user.findMany({
    orderBy: { nickname: 'asc' },
  });
}

export async function getUser(uuid: string): Promise<User | null> {
  return Database.user.findUnique({ where: { uuid } });
}

export async function getUserByNickname(
  nickname: string
): Promise<User | null> {
  return Database.user.findUnique({ where: { nickname } });
}

// ----------------   PAGE: User profile
export async function getUserMe(uuid: string): Promise<User> {
  return Database.user.findUniqueOrThrow({ where: { uuid } });
}

export async function setUserMeNickname(
  uuid: string,
  newNickname: string
): Promise<User> {
  return Database.user.update({
    where: { uuid },
    data: { nickname: newNickname },
  });
}

export async function setUserMeAvatar(
  uuid: string,
  newAvatarLoc: string
): Promise<User> {
  return Database.user.update({
    where: { uuid },
    data: { avatar: newAvatarLoc },
  });
}

export async function getUserMatchHistory(
  uuid: string
): Promise<UserMatchRecord[]> {
  const matches = await Database.match.findMany({
    where: {
      AND: [
        {
          OR: [
            {
              player1Id: uuid,
            },
            { player2Id: uuid },
          ],
        },
        {
          status: status.finished,
        },
      ],
    },
    select: {
      updatedAt: true,
      score1: true,
      score2: true,
      player1: { select: { nickname: true } },
      player2: { select: { nickname: true } },
      tournamentRoundId: true,
      winnerId: true,
    },
    orderBy: { updatedAt: 'asc' },
  });
  return matches.map((match) => ({
    date: match.updatedAt.toISOString().slice(0, 10),
    score1: match.score1,
    score2: match.score2,
    player1: match.player1?.nickname ?? 'Guest',
    player2: match.player2?.nickname ?? 'Guest',
    result: match.winnerId === uuid ? 'WON' : 'LOST',
    gameType: match.tournamentRoundId ? 'Tournament match' : '1 v 1',
  }));
}

// ---------------- OTHER STUFF
export async function addUser(email: string, nickname: string): Promise<User> {
  return Database.user.create({
    data: { email, nickname },
  });
}

export async function getUserRole(uuid: string): Promise<string | null> {
  const user = await Database.user.findUnique({ where: { uuid } });
  return user ? user.role : null;
}

export async function generateUniqueNickName(): Promise<string> {
  let nickname: string;
  do {
    nickname = generateNickName();
  } while (await Database.user.findUnique({ where: { nickname } }));
  return nickname;
}

export async function upsertUser(
  user: Partial<User> & { uuid: string }
): Promise<User> {
  return Database.user.upsert({
    where: { uuid: user.uuid },
    update: user,
    create: user as User,
  });
}

export async function participatesInTournament(
  userId: string,
  tournamentId: string
): Promise<boolean> {
  const user = await Database.user.findUnique({
    where: {
      uuid: userId,
      tournaments: {
        some: {
          tournamentId,
        },
      },
    },
  });
  return user != null;
}

export async function getTournamentParticipants(
  tournamentId: string
): Promise<User[]> {
  return await Database.user.findMany({
    where: {
      tournaments: {
        some: {
          tournamentId,
        },
      },
    },
  });
}

export async function removeUser(uuid: string): Promise<User> {
  const user = await Database.user.findUnique({ where: { uuid } });
  if (!user) throw new Error('User not found');
  await Database.user.delete({ where: { uuid } });
  return user;
}

export async function removeAllUsers(): Promise<void> {
  await Database.user.deleteMany();
}
