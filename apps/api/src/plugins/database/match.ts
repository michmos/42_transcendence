import type { Match, status } from 'db/generated/client/index.js';
import Database from 'db';

export async function addMatch(data: {
  player1Id: string;
  player2Id: string;
  status?: status;
}): Promise<Match> {
  return Database.match.create({
    data: {
      player1: {
        connect: { uuid: data.player1Id },
      },
      player2: {
        connect: { uuid: data.player2Id },
      },
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });
}

export async function updateMatch(
  match: Partial<Match> & { uuid: string }
): Promise<Match> {
  return Database.match.update({
    where: { uuid: match.uuid },
    data: match,
  });
}

export async function getMatch(matchId: string): Promise<Match | null> {
  return Database.match.findUnique({ where: { uuid: matchId } });
}

export async function getAllMatches(): Promise<Match[]> {
  return Database.match.findMany();
}

export async function getMatchesByStatus(status: status): Promise<Match[]> {
  return Database.match.findMany({ where: { status } });
}

export async function removeMatch(uuid: string): Promise<Match> {
  const match = await getMatch(uuid);
  if (!match) {
    throw new Error('Match not found');
  }
  await Database.match.delete({ where: { uuid } });
  return match;
}

export async function removeAllMatches(): Promise<void> {
  await Database.match.deleteMany();
}
