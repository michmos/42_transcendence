import type { User } from 'db/generated/client/index.js';
import Database from 'db';

export async function getUsers(): Promise<User[]> {
  return Database.user.findMany({
    orderBy: { username: 'asc' },
    include: { groups: true },
  });
}

export async function getUser(uuid: string): Promise<User | null> {
  return Database.user.findUnique({ where: { uuid } });
}

export async function addUser(email: string, username: string): Promise<User> {
  return Database.user.create({ data: { email, username } });
}

export async function upsertUser(
  user: Partial<User> & { uuid: string }
): Promise<User> {
  const userData = {
    ...user,
    avatar: user.avatar || null,
    uuid: String(user.uuid), // Ensure uuid is always a string
  };

  return Database.user.upsert({
    where: { uuid: userData.uuid },
    update: userData,
    create: userData as User,
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
