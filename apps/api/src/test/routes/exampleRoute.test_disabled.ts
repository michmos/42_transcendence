import { describe, test, expect } from 'vitest';
import { setUserTo } from '../utils.js';
import { app } from '../setup.js';

// use a describe block for each api route
describe('POST /endpoint1', () => {
  // add all your test cases for this api route inside the describe block
  test('your test description', async () => {
    // you can use the setUserTo function to change a global variable that
    // is linked to the request - before each test this variable is reset to 'MEMBER'
    setUserTo('ADMIN');

    // perform the request
    const response = await app.inject({
      method: 'POST',
      url: '/endpoint1',
      body: {
        bodyField: 'whatever',
        otherBodyField: 4,
      },
    });

    // compare the reponse to your expectations
    expect(response.statusCode).toBe(201);
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
