import type { FastifyInstance } from 'fastify';

import db, { type User } from '../../plugins/database/index.js';

export default function (app: FastifyInstance): void {
  app.get('/', async function (): Promise<User[] | Error> {
    console.log('Fetching all users from database...');
    const users = await db.getAllUsers();
    if (users instanceof Error) {
      return new Error('Failed to fetch users');
    }
    return users;
  });

  app.get('/:uuid', async function (request): Promise<User | Error> {
    const { uuid } = request.params as { uuid: string };
    const user = await db.getUser(uuid);
    if (!user) {
      return new Error('User not found');
    }
    return user;
  });

  app.post('/', async function (request): Promise<User | Error> {
    const { email } = request.body as {
      email: string;
    };
    if (!email) {
      return new Error('Email and username are required');
    }
    const user = await db.addUser(
      email,
      email.split('@')[0] || 'user' + Math.floor(Math.random() * 1000)
    );
    return user;
  });

  app.delete('/', async function (request): Promise<User | Error> {
    const { uuid } = request.body as { uuid: string };
    if (!uuid) {
      return new Error('UUID is required');
    }
    const user = await db.removeUser(uuid);
    if (!user) {
      return new Error('User not found');
    }
    return user;
  });
}
