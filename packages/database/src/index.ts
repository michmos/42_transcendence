import { PrismaClient } from '../generated/client/index.js';
import type { User } from '../generated/client/index.js';

class Database {
  private db: PrismaClient;

  constructor() {
    console.log('📦 Initializing Database package');
    this.db = new PrismaClient();
  }

  public async getAllUsers(): Promise<User[]> {
    return this.db.user.findMany();
  }

  public async getUser(uuid: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { uuid } });
  }

  public async addUser(email: string, username: string): Promise<User> {
    return this.db.user.create({ data: { email, username } });
  }

  public async upsertUser(
    user: Partial<User> & { uuid: string }
  ): Promise<User> {
    return this.db.user.upsert({
      where: { uuid: user.uuid },
      update: user,
      create: user as User,
    });
  }

  public async removeUser(uuid: string): Promise<User> {
    const user = await this.db.user.findUnique({ where: { uuid } });
    if (!user) throw new Error('User not found');
    await this.db.user.delete({ where: { uuid } });
    return user;
  }
}

export default new Database();
export { type User };
