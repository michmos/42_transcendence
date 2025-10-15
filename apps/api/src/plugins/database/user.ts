import type { User } from '../../../../../packages/database/generated/client/index.js';
import { Database } from '../../../../../packages/database/dist/index.js';

export class UserDatabase extends Database {
  public async getAll(): Promise<User[]> {
    return this.db.user.findMany({
      orderBy: { username: 'asc' },
      include: { groups: true },
    });
  }

  public async get(uuid: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { uuid } });
  }

  public async add(email: string, username: string): Promise<User> {
    return this.db.user.create({ data: { email, username } });
  }

  public async upsert(user: Partial<User> & { uuid: string }): Promise<User> {
    const userData = {
      ...user,
      avatar: user.avatar || null,
      uuid: String(user.uuid), // Ensure uuid is always a string
    };

    return this.db.user.upsert({
      where: { uuid: userData.uuid },
      update: userData,
      create: userData as User,
    });
  }

  public async remove(uuid: string): Promise<User> {
    const user = await this.db.user.findUnique({ where: { uuid } });
    if (!user) throw new Error('User not found');
    await this.db.user.delete({ where: { uuid } });
    return user;
  }
}
