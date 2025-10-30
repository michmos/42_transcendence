import type { User } from 'db/generated/client/index.js';
import Database from 'db';

// export async function getUsers(): Promise<User[]> {
//   return Database.user.findMany({
//     orderBy: { nickname: 'asc' },
//     include: { groups: true },
//   });
// }

// export async function getUser(uuid: string): Promise<User | null> {
//   return Database.user.findUnique({ where: { uuid } });
// }

// export async function addUser(email: string, nickname: string): Promise<User> {
//   return Database.user.create({ data: { email, nickname } });
// }

// export async function upsertUser(
//   user: Partial<User> & { uuid: string }
// ): Promise<User> {
//   const userData = {
//     ...user,
//     avatar: user.avatar || null,
//     uuid: String(user.uuid), // Ensure uuid is always a string
//   };

//   return Database.user.upsert({
//     where: { uuid: userData.uuid },
//     update: userData,
//     create: userData as User,
//   });
// }

// export async function addUserToTournament(
//   uuid: string,
//   tournamentUuid: string
// ): Promise<User | null> {
//   return Database.user.update({
//     where: { uuid },
//     data: {
//       tournaments: {
//         connect: { uuid: tournamentUuid },
//       },
//     },
//   });
// }

// export async function removeUser(uuid: string): Promise<User> {
//   const user = await Database.user.findUnique({ where: { uuid } });
//   if (!user) throw new Error('User not found');
//   await Database.user.delete({ where: { uuid } });
//   return user;
// }

export async function getUsers(): Promise<User[]> {
  return Database.user.findMany({
    orderBy: { nickname: 'asc' },
  });
}

// Get specific user while exposing
export async function getUser(nickname: string): Promise<User | null> {
  return Database.user.findUnique({ where: { nickname } });
}

// ----------------   PAGE: User profile
export async function getUserMe(uuid: string): Promise<User | null> {
  return Database.user.findUnique({ where: { uuid } });
}

export async function getFriends(uuid: string) {
  const foundRelations = await Database.friends.findMany({
    where: {
      AND: [
        {
          OR: [{ friendAId: uuid }, { friendBId: uuid }],
        },
        {
          OR: [{ state: 'ACCEPTED' }, { state: 'REQUESTED' }],
        },
      ],
    },
    select: {
      friendAId: true,
      friendBId: true,
      friendA: { select: { nickname: true, avatar: true } },
      friendB: { select: { nickname: true, avatar: true } },
      state: true,
    },
  });

  const friendsList: object = foundRelations.map((f) =>
    f.friendAId === uuid ? f.friendB : f.friendA
  );

  return friendsList;
}

// ---------------- OTHER STUFF
export async function addUser(email: string, nickname: string): Promise<User> {
  return Database.user.create({ data: { email, nickname } });
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
