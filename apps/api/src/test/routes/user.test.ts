import { describe, test, expect } from 'vitest';
import { setUserTo } from '../utils.js';
import { app } from '../setup.js';

// use a describe block for each api route
describe('GET /user', () => {
  test('Admin getting all users - valid', async () => {
    setUserTo('ADMIN');

    // perform the request
    const response = await app.inject({
      method: 'GET',
      url: '/user',
    });

    // compare the response to your expectations
    console.warn(`reponse: `, JSON.stringify(response));
    expect(response.statusCode).toBe(200);
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

// other api route
describe('GET /endpoint1', () => {
  // more tests
});

// other api route
describe('POST /endpoint2', () => {
  // more tests
});

// more routes ...
