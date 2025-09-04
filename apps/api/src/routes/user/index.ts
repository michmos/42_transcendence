import type { FastifyInstance } from 'fastify';

// Import the database module from the database package
// This is where the getters and setters for users are defined
import Database from 'db';

export default function (app: FastifyInstance): void {
  app.get('/', Database.getAllUsers.bind(Database));

  app.get('/:uuid', async function (request) {
    const { uuid } = request.params as { uuid: string };
    return Database.getUser(uuid);
  });

  app.post('/', async function (request) {
    const { email } = request.body as {
      email: string;
    };
    if (!email) {
      return new Error('Email and username are required');
    }
    return await Database.addUser(
      email,
      email.split('@')[0] || 'user' + Math.floor(Math.random() * 1000)
    );
  });

  app.delete('/', async function (request) {
    const { uuid } = request.body as { uuid: string };
    if (!uuid) {
      return new Error('UUID is required');
    }
    return await Database.removeUser(uuid);
  });
}
