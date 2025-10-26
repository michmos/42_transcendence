import { beforeAll, beforeEach, afterAll } from 'vitest';
import { build } from '../build.js';
import { type FastifyInstance } from 'fastify';
import { testUser, adminUser, normalUser } from './utils.js';

// This file describes the setup / teardown for EACH file
// with other words - everything here will be performed for
// each file (e.g. beforeAll is preformed once per file)

export let app: FastifyInstance;

beforeAll(async () => {
  // add hook to mock authentication
  if (!app) {
    app = await build(false);
  }
  app.addHook('onRequest', async (request) => {
    // Mock authentication by attaching a user object to the request
    request.user = testUser;
  });
});

// this ensures that each test is run on an empty
// database with only the two default users added
beforeEach(async () => {
  // Clear database
  await app!.db.clearAllData();

  // Add standard test users
  const dbNormalUser = await app!.db.addUser(
    normalUser.email,
    normalUser.username
  );
  normalUser.uuid = dbNormalUser.uuid;

  // Add admin test user
  const dbAdminUser = await app!.db.addUser(
    adminUser.email,
    adminUser.username
  );
  adminUser.uuid = dbAdminUser.uuid;
});

afterAll(async () => {
  await app!.db.clearAllData();
  await app!.close();
});
