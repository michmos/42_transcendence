import { type User, PrismaClient } from 'db';

class Database {
  private db: PrismaClient;

  constructor() {
    console.log('📦 Initializing database connection...');
    this.db = new PrismaClient();
  }

  public async getAllUsers(): Promise<User[] | Error> {
    return new Promise((resolve, reject) => {
      this.db.user
        .findMany()
        .then((users) => {
          resolve(users);
        })
        .catch(reject);
    });
  }

  public async getUser(uuid: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.user
        .findUnique({ where: { uuid } })
        .then((user) => {
          resolve(user);
        })
        .catch(reject);
    });
  }

  public async addUser(email: string, username: string): Promise<User> {
    return new Promise((resolve, reject) => {
      this.db.user
        .create({
          data: {
            email: email,
            username: username,
          },
        })
        .then((user) => {
          resolve(user);
        })
        .catch(reject);
    });
  }

  public async removeUser(uuid: string): Promise<User> {
    return new Promise((resolve, reject) => {
      this.db.user
        .findUnique({ where: { uuid } })
        .then(async (user) => {
          if (user) {
            await this.db.user.delete({ where: { uuid } });
            resolve(user);
          } else {
            reject(new Error('User not found'));
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}

export default new Database();
export { type User };
