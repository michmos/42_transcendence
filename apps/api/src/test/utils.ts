import { type FastifyInstance } from 'fastify';
import { assert } from 'vitest';
import { type Tournament } from 'db/generated/client/index.js';

export const normalUser = {
  uuid: '',
  email: 'normalMail@mail.com',
  email_verified: false,
  fullName: 'Billy normal',
  username: 'normalUserName',
  // avatar: 'https://cdn.example.com/someAvatar',
  role: 'MEMBER',
};

export const adminUser = {
  uuid: '',
  email: 'adminEmail@mail.com',
  email_verified: false,
  fullName: 'Bob the admin',
  username: 'adminUserName',
  // avatar: 'https://cdn.example.com/someAvatar',
  role: 'ADMIN',
};

export let testUser = normalUser;

export function setUserTo(userRole: 'ADMIN' | 'MEMBER') {
  if (userRole === 'ADMIN') {
    testUser = adminUser;
  } else {
    testUser = normalUser;
  }
}

export const validTournamentBody = {
  tournamentName: 'TestTournament',
  maxPlayers: 4,
  minPlayers: 2,
};

export async function createValidTournament(
  app: FastifyInstance,
  overrides?: Partial<typeof validTournamentBody>
) {
  const response = await app.inject({
    method: 'POST',
    url: '/tournaments',
    body: {
      ...validTournamentBody,
      ...overrides,
    },
  });
  assert(response.statusCode === 201);
  return (await JSON.parse(response.payload)) as Tournament;
}
