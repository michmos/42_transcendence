import { type User, PrismaClient } from 'db'


class Database {
    private db: PrismaClient

    constructor() {
        console.log('📦 Initializing database connection...')
        this.db = new PrismaClient()        
    }

    public async getAllUsers (): Promise<User[]> {    
        return new Promise(async (resolve, reject) => {
            this.db.user.findMany().then((users) => {
                resolve(users)
            }).catch(reject)
        })
    }

    public async addUser (email: string, username: string): Promise<User> {    
        return new Promise(async (resolve, reject) => {
            this.db.user.create({
                data: {
                    email: email,
                    username: username
                }
            }).then((user) => {
                resolve(user)
            }).catch(reject)
        })
    }

    public async removeUser(email: string): Promise<User | null> {
        try {
            const user = await this.db.user.findUnique({ where: { email } });
            if (!user) return null;
            await this.db.user.delete({ where: { email } });
            return user;
        } catch (error) {
            throw error;
        }
    }
}

export default new Database()
export { type User }