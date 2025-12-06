import { env } from '../../env.js';
import type { Tournament } from 'db/generated/client/index.js';

/**
 * Transform tournament participants from Prisma format to frontend format
 * Prisma returns: TournamentParticipations[] with { alias, user: { uuid, nickname, ... } }
 * Frontend expects: Array<{ uuid: string; nickname?: string; alias: string }>
 */
export function transformTournamentParticipants(
  tournament: Tournament & {
    participants?: Array<{
      alias: string;
      user: { uuid: string; nickname?: string | null; email?: string | null };
    }>;
  }
): Tournament & {
  participants?: Array<{ uuid: string; nickname?: string; alias: string }>;
} {
  if (!tournament.participants) {
    return tournament;
  }

  return {
    ...tournament,
    participants: tournament.participants.map((participation) => ({
      uuid: participation.user.uuid,
      nickname: participation.user.nickname || undefined,
      alias: participation.alias,
    })),
  };
}

export async function messageSocketServer(endpoint: string, data: unknown) {
  let response;
  try {
    // TODO : hardcoded url and why not making a socket connection instead of API call??
    response = await fetch(`http://localhost:3001${endpoint}`, {
      // TODO: hardcoded url
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ADMIN_API_KEY,
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
