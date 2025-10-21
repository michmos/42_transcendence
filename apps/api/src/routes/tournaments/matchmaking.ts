import { type User, type Match } from 'db/generated/client/index.js';
import { type FastifyInstance } from 'fastify';

class RoundRobin<T> {
  private items: T[] = [];
  private fixedItem: T;
  private startIndex: number;

  constructor(items: T[], startIndex: number = 0) {
    if (items.length === 0 || items.length - 1 < startIndex) {
      throw new Error('Invalid arguments to RoundRobin constructor');
    }
    this.fixedItem = items[0]!;
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
    return this.items[(this.startIndex + index - 1) % this.items.length]!;
  }

  length(): number {
    return this.items.length + 1;
  }
}

function generateRound(roundRobin: RoundRobin<User>): Partial<Match>[] {
  let matches: Partial<Match>[] = [];
  const playerCount = roundRobin.length();
  for (let start = 0, end = playerCount; start < end; ++start, --end) {
    matches.push({
      player1Id: roundRobin.at(start)?.uuid ?? null,
      player2Id: roundRobin.at(end)?.uuid ?? null,
    });
  }
  return matches;
}

// round robin scheduling
export default async function generateTournamentPlan(
  tournamentId: string,
  app: FastifyInstance
) {
  const players: (User | null)[] =
    await app.db.getTournamentParticipants(tournamentId);
  const playerCount = players.length;
  const numberOfRounds = playerCount - 1;

  // add nullplayer for uneven numbers (will be an auto win)
  if (playerCount % 2) {
    players.push(null);
  }

  const roundRobin = new RoundRobin(players);
  for (let roundIndex = 0; roundIndex < numberOfRounds; ++roundIndex) {
    const matches = generateRound(roundRobin as RoundRobin<User>);
    console.log('tournament generated: ', JSON.stringify(matches));
    app.db.createTournamentRound(tournamentId, roundIndex, matches);
    roundRobin.rotate();
  }
}
