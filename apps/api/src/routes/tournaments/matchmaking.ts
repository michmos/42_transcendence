import { type User, type Match } from 'db/generated/client/index.js';
import { type FastifyInstance } from 'fastify';

class RoundRobin<T> {
  private items: T[] = [];
  private fixedItem: T;
  private startIndex: number;

  constructor(items: T[], startIndex = 0) {
    if (items.length === 0 || items.length - 1 < startIndex) {
      throw new Error('Invalid arguments to RoundRobin constructor');
    }
    this.fixedItem = items[0] as T;
    this.items = items.slice(1);
    this.startIndex = startIndex;
  }

  // advance startIndex in a circular way
  rotate() {
    this.startIndex = (this.startIndex + 1) % this.items.length;
  }

  // retrieve item at index in a circular way
  at(index: number): T {
    if (index === 0) {
      return this.fixedItem;
    }
    return this.items[(this.startIndex + index - 1) % this.items.length] as T;
  }

  length(): number {
    return this.items.length + 1;
  }
}

function generateRound(roundRobin: RoundRobin<User>): Array<Partial<Match>> {
  const matches: Array<Partial<Match>> = [];
  const playerCount = roundRobin.length();
  for (let start = 0, end = playerCount - 1; start < end; ++start, --end) {
    const player1Id = roundRobin.at(start)?.uuid ?? null;
    const player2Id = roundRobin.at(end)?.uuid ?? null;

    if (!player1Id && !player2Id) {
      continue;
    }

    let autoForfeit: Partial<Match> = {};
    if (!player1Id || !player2Id) {
      // one player is null, auto-forfeit
      autoForfeit = {
        score1: !player1Id ? 0 : 10,
        score2: !player2Id ? 0 : 10,
        winnerId: player1Id ?? player2Id,
        status: 'finished' as const,
      };
    }

    matches.push({
      player1Id,
      player2Id,
      ...autoForfeit,
    });
  }
  return matches;
}

// round robin scheduling
export default async function generateTournamentPlan(
  tournamentId: string,
  app: FastifyInstance
) {
  const players: Array<User | null> =
    await app.db.getTournamentParticipants(tournamentId);
  const playerCount = players.length;
  const numberOfRounds = playerCount % 2 === 0 ? playerCount - 1 : playerCount;

  // add nullplayer for uneven numbers (will be an auto win)
  if (playerCount % 2) {
    players.push(null);
  }

  const roundRobin = new RoundRobin(players);
  for (let roundIndex = 0; roundIndex < numberOfRounds; ++roundIndex) {
    const matches = generateRound(roundRobin as RoundRobin<User>);
    await app.db.createTournamentRound(tournamentId, roundIndex, matches);
    roundRobin.rotate();
  }
}
