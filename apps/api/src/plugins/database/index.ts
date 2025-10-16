import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { UserDatabase } from './user.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof UserDatabase;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    console.info('🗄️  Loading database plugin...');

    app.decorate('db', {
      ...UserDatabase,
    });
  },
  {
    name: 'database',
  }
);

export { UserDatabase } from './user.js';
