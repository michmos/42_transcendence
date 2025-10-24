import { beforeEach, beforeAll, afterAll } from 'vitest';
import { build } from '../build.js';
import { type FastifyInstance } from 'fastify';
import { adminUser, normalUser, testUser } from './utils.js';

const app: FastifyInstance = await build(false);

beforeEach(async () => {
  // clear database
  await app.db.clearAllData();

  // add admin and normal user to db and get their uuids
  const dbNormalUser = await app.db.addUser(
    normalUser.email,
    normalUser.username
  );
  normalUser.uuid = dbNormalUser.uuid;
  const dbAdminUser = await app.db.addUser(adminUser.email, adminUser.username);
  adminUser.uuid = dbAdminUser.uuid;
});

beforeAll(async () => {
  // add hook to mock authentication
  app.addHook('onRequest', async (request, reply) => {
    // Mock authentication by attaching a user object to the request
    request.user = testUser;
  });
});

afterAll(async () => {
  await app.db.clearAllData();
  try {
    await app.db.removeUser(normalUser.uuid);
  } catch (e) {}
  try {
    await app.db.removeUser(adminUser.uuid);
  } catch (e) {}
  await app.close();
});

export default app;
