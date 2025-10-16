import type { User } from 'db/generated/client/index.js';
import Database from 'db';

export const UserDatabase = {
  getUsers(): Promise<User[]> {
    return Database.user.findMany({
      orderBy: { username: 'asc' },
      include: { groups: true },
    });
  },

  getUser(uuid: string): Promise<User | null> {
    return Database.user.findUnique({ where: { uuid } });
  },

  addUser(email: string, username: string): Promise<User> {
    return Database.user.create({ data: { email, username } });
  },

  upsertUser(user: Partial<User> & { uuid: string }): Promise<User> {
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
  },

  async removeUser(uuid: string): Promise<User> {
    const user = await Database.user.findUnique({ where: { uuid } });
    if (!user) throw new Error('User not found');
    await Database.user.delete({ where: { uuid } });
    return user;
  },
};
