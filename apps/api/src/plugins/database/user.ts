import type { User } from 'db/generated/client/index.js';
import Database from 'db';
import { generateNickName } from './utils.js';

export async function getUsers(): Promise<User[]> {
  return Database.user.findMany({
    orderBy: { nickName: 'asc' },
    include: { groups: true },
  });
}

export async function getUser(uuid: string): Promise<Partial<User> | null> {
  const user = await Database.user.findUnique({ where: { uuid } });
  return user ? { nickName: user.nickName } : null;
}

export async function getUserRole(uuid: string): Promise<string | null> {
  const user = await Database.user.findUnique({ where: { uuid } });
  return user ? user.role : null;
}

export async function addUser(email: string, nickName: string): Promise<User> {
  return Database.user.create({ data: { email, nickName } });
}

export async function generateUniqueNickName(): Promise<string> {
  let nickName: string;
  do {
    nickName = generateNickName();
  } while (await Database.user.findUnique({ where: { nickName } }));
  return nickName;
}

export async function upsertUser(
  user: Partial<User> & { uuid: string }
): Promise<User> {
  const existingUser = await Database.user.findUnique({
    where: { uuid: user.uuid },
  });
  if (!existingUser) {
    return Database.user.create({ data: user as User });
  }

  // Remove fields that should not be updated
  delete user.nickName;
  delete user.avatar;

  return Database.user.upsert({
    where: { uuid: user.uuid },
    update: user,
    create: user as User,
  });
}

export async function addUserToTournament(
  uuid: string,
  tournamentUuid: string
): Promise<User | null> {
  return Database.user.update({
    where: { uuid },
    data: {
      tournaments: {
        connect: { uuid: tournamentUuid },
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
