import { PrismaClient } from '../generated/client/index.js';

class Database {
  protected db: PrismaClient;

  constructor() {
    console.log('📦 Initializing Database package');
    this.db = new PrismaClient();
    console.log('✅ Database initialized');
  }
}

export { Database };
