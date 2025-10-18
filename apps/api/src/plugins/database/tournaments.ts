import Database from 'db';
import type {
  Match,
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

export async function addUserToTournament(
  tournamentId: string,
  userId: string
): Promise<Tournament | null> {
  return Database.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: {
        uuid: userId,
        tournaments: { some: { uuid: tournamentId } },
      },
    });
    const incrementValue = user ? 0 : 1;
    return tx.tournament.update({
      where: { uuid: tournamentId },
      data: {
        playerCount: { increment: incrementValue },
        participants: {
          connect: { uuid: userId },
        },
      },
    });
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
  return await Database.tournament.delete({
    where: { uuid },
    include: { rounds: true },
  });
  // tournament rounds are deleted automatically through 'onDelete: cascade' setting
  // in relation in schema
  // match.tournamentRoundId is updated automatically thorugh 'onDelete: SetNull'
}

export async function createTournamentRound(
  tournamentId: string,
  index: number,
  matches: Partial<Match>[]
): Promise<TournamentRound | null> {
  // needs to be transaction for operations to be atomic
  return await Database.$transaction(async (tx) => {
    if (!tx.tournament.findUnique({ where: { uuid: tournamentId } }))
      throw new Error('tournamendId not found');

    const tournamentRound = await tx.tournamentRound.create({
      data: { tournamentId, index },
      include: { matches: true },
    });

    const matchesWithTournamentId = matches.map((match) => {
      return { ...match, tournamentRoundId: tournamentRound.uuid };
    });

    tx.match.createManyAndReturn({
      data: matchesWithTournamentId,
    });
    return tx.tournamentRound.findUnique({
      where: { uuid: tournamentRound.uuid },
      include: { matches: true },
    });
  });
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
  return await Database.tournamentRound.delete({
    where: { uuid },
  });
  // match.tournamntRoundId is updated automatically
}
