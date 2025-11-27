import { env } from '../../env.js';
import { type FastifyError } from 'fastify';

export async function messageSocketServer(endpoint: string, data: any) {
  let response;
  try {
    response = await fetch(`http://localhost:3001/${endpoint}`, {
      // TODO: hardcoded url
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-server-key': env.API_SERVER_KEY,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  } catch (error) {
    console.error('Fetch to socket server failed:', (error as Error).message);
  }
  return response ?? null;
}
