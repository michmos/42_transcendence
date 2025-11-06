import type { User } from 'db/generated/client/index.js';
import Database from 'db';
import { generateNickName } from './utils.js';

export async function getUsers(): Promise<User[]> {
  return Database.user.findMany({
    orderBy: { nickname: 'asc' },
    include: { groups: true },
  });
}

export async function getUser(uuid: string): Promise<Partial<User> | null> {
  const user = await Database.user.findUnique({ where: { uuid } });
  return user ? { nickname: user.nickname } : null;
}

export async function getUserRole(uuid: string): Promise<string | null> {
  const user = await Database.user.findUnique({ where: { uuid } });
  return user ? user.role : null;
}

export async function addUser(email: string, nickname: string): Promise<User> {
  return Database.user.create({ data: { email, nickname } });
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
          uuid: tournamentId,
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
          uuid: tournamentId,
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
