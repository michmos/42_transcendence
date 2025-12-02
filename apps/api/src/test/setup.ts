// TODO: Please move this out of the src folder as it should be in seperate test folder to create production builds without copying the test files
import { beforeAll, beforeEach, afterAll } from 'vitest';
import { build } from '../build.js';
import { type FastifyInstance } from 'fastify';
import { testUser, adminUser, normalUser, setUserTo } from './utils.js';

// This file describes the setup / teardown for EACH file
// with other words - everything here will be performed for
// each file (e.g. beforeAll is preformed once per file)
// TODO: app instance should be built only once for all tests (still works now, but unnecessariy)

export let app: FastifyInstance;

// called once per test file
beforeAll(async () => {
  // add hook to mock authentication
  if (!app) {
    try {
      app = await build(false);
    } catch (error) {
      console.error('stopping test execution: error during build');
      throw error;
    }

    app.addHook('onRequest', (request) => {
      // Mock authentication by attaching a user object to the request
      request.user = testUser;
    });
  }
});

// called before each test
// this ensures that each test is run on an empty
// database with only the two default users added
beforeEach(async () => {
  // set user to be normal member - not admin
  setUserTo('MEMBER');

  // Clear database
  await app.db.clearAllData();

  // Add standard test users
  const dbNormalUser = await app.db.addUser(
    normalUser.email,
    normalUser.username
  );
  normalUser.uuid = dbNormalUser.uuid;

  // Add admin test user
  const dbAdminUser = await app.db.addUser(adminUser.email, adminUser.username);
  adminUser.uuid = dbAdminUser.uuid;
});

// called once per test file
afterAll(async () => {
  await app.db.clearAllData();
  await app.close();
});
