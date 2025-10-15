import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { UserDatabase } from './user.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: {
      user: UserDatabase;
    };
  }
}

export default fp(
  async (app: FastifyInstance) => {
    console.info('🗄️  Loading database plugin...');

    const userDb = new UserDatabase();

    app.decorate('db', {
      user: userDb,
    });
  },
  {
    name: 'database',
  }
);

export { UserDatabase } from './user.js';
