import { describe, test, expect } from 'vitest';
import { setUserTo } from '../utils.js';
import { app } from '../setup.js';
import { type User } from 'db/generated/client/index.js';

// use a describe block for each api route
describe('GET /user', () => {
  test('Admin getting all users - valid', async () => {
    for (let i = 0; i < 10; ++i) {
      await app.db.addUser(`user${i}@mail.com`, `nickName${i}`);
    }
    setUserTo('ADMIN');

    // perform the request
    const response = await app.inject({
      method: 'GET',
      url: '/user',
    });

    // compare the response to your expectations
    expect(response.statusCode).toBe(200);
    const users = JSON.parse(response.payload) as User[];
    expect(users).toHaveLength(12);
  });

  test('Member getting all users - invalid', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/user',
    });

    // compare the response to your expectations
    expect(response.statusCode).toBe(403);
  });

  // more tests ...
});

// the database is reset between each test
// all tests run sequentially to avoid cross-dependencies
// for more info on the setup see ../setup.ts

// // other api route
// describe('GET /endpoint1', () => {
//   // more tests
// });
//
// // other api route
// describe('POST /endpoint2', () => {
//   // more tests
// });

// more routes ...
