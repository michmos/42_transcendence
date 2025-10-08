import Database from 'db';
import type {
  Tournament,
  TournamentRound,
  status,
} from 'db/generated/client/index.js';

export async function createTournament(data: {
  tournamentName: string;
  minPlayers: number;
  maxPlayers: number;
  userUuid: string;
  lockTime?: number;
  gameTime?: number;
}): Promise<Tournament> {
  const { userUuid, ...rest } = data;

  return Database.tournament.create({
    data: {
      ...rest,
      participants: {
        connect: { uuid: userUuid },
      },
    },
  });
}

export async function updateTournament(
  tournament: Partial<Tournament> & { uuid: string }
): Promise<Tournament> {
  return Database.tournament.upsert({
    where: { uuid: tournament.uuid },
    update: tournament,
    create: tournament as Tournament,
  });
}

export async function getAllTournaments(): Promise<Tournament[]> {
  return Database.tournament.findMany();
}

export async function getTournament(uuid: string): Promise<Tournament | null> {
  return Database.tournament.findUnique({ where: { uuid } });
}

export async function getTournamentsByStatus(
  status: status
): Promise<Tournament[]> {
  return Database.tournament.findMany({ where: { status } });
}

// delete a tournament including all tournament rounds (not including the matches)
export async function deleteTournament(uuid: string): Promise<Tournament> {
  const tournament = await Database.tournament.delete({
    where: { uuid },
    include: { rounds: true },
  });
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  await Database.tournament.delete({ where: { uuid } });
  await Database.tournamentRound.deleteMany({
    where: { tournamentId: uuid },
  });
  return tournament;
}

export async function createTournamentRound(
  tournamentId: string,
  index: number,
  matches: { player1Id: string; player2Id: string }[]
): Promise<TournamentRound> {
  // add tournamentId to matches
  const matchesWithTournamentId = matches.map((match) => {
    return { ...match, tournamentId };
  });

  // needs to be transaction for operations to be atomic
  const [, tournamentRound] = await Database.$transaction([
    Database.match.createManyAndReturn({
      data: matchesWithTournamentId,
    }),
    Database.tournamentRound.create({
      data: { tournamentId, index },
      include: { matches: true },
    }),
  ]);
  return tournamentRound;
}

export async function updateTournamentRound(
  round: Partial<TournamentRound> & {
    uuid: string;
  }
): Promise<TournamentRound> {
  return Database.tournamentRound.update({
    where: { uuid: round.uuid },
    data: round,
  });
}

export async function getTournamentRounds(
  tournamentId: string
): Promise<TournamentRound[]> {
  return Database.tournamentRound.findMany({
    where: { tournamentId },
    include: { matches: true },
  });
}

export async function getTournamentRound(
  uuid: string
): Promise<TournamentRound | null>;
export async function getTournamentRound(
  tournamentId: string,
  index: number
): Promise<TournamentRound | null>;
export async function getTournamentRound(
  a: string,
  b?: number
): Promise<TournamentRound | null> {
  if (b !== undefined) {
    return Database.tournamentRound.findFirst({
      where: {
        tournamentId: a,
        index: b,
      },
      include: {
        matches: true,
      },
    });
  }
  return Database.tournamentRound.findUnique({
    where: { uuid: a },
    include: {
      matches: true,
    },
  });
}

export async function getCurrentTournamentRound(
  tournamentId: string
): Promise<TournamentRound | null> {
  const tournament = await Database.tournament.findUnique({
    where: { uuid: tournamentId },
  });
  if (!tournament) {
    throw new Error('Tournament not found - invalid uuid');
  }
  const index: number = tournament.currentRound;
  return getTournamentRound(tournamentId, index);
}

// delete a tournament round without deleting the matches
export async function deleteTournamentRound(
  uuid: string
): Promise<TournamentRound> {
  const tournamentRound = await Database.tournamentRound.delete({
    where: { uuid },
  });
  if (!tournamentRound) {
    throw new Error('Tournament not found');
  }
  await Database.tournamentRound.delete({ where: { uuid } });
  return tournamentRound;
}
