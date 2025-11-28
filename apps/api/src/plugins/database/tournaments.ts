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
}): Promise<Tournament> {
  return Database.tournament.create({
    data,
  });
}

export async function updateTournament(
  tournament: Partial<Tournament> & { uuid: string }
): Promise<Tournament> {
  return Database.tournament.update({
    where: { uuid: tournament.uuid },
    data: tournament,
  });
}

export async function addUserToTournament(
  userId: string,
  tournamentId: string
): Promise<
  Tournament & { participants: { uuid: string; nickname: string }[] }
> {
  return Database.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: {
        uuid: userId,
        tournaments: { some: { uuid: tournamentId } },
      },
    });
    const incrementValue = user ? 0 : 1;
    await tx.tournament.update({
      where: { uuid: tournamentId },
      data: {
        playerCount: { increment: incrementValue },
        participants: {
          connect: { uuid: userId },
        },
      },
    });
    // Return tournament with participants included
    const tournament = await tx.tournament.findUnique({
      where: { uuid: tournamentId },
      include: {
        participants: {
          select: {
            uuid: true,
            nickname: true,
          },
        },
      },
    });
    if (!tournament) {
      throw new Error(`Tournament ${tournamentId} not found`);
    }
    return tournament as Tournament & {
      participants: { uuid: string; nickname: string }[];
    };
  });
}

export async function removeUserFromTournament(
  userId: string,
  tournamentId: string
): Promise<Tournament> {
  return Database.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: {
        uuid: userId,
        tournaments: { some: { uuid: tournamentId } },
      },
    });
    const decrementValue = user ? 1 : 0;
    return tx.tournament.update({
      where: { uuid: tournamentId },
      data: {
        playerCount: { decrement: decrementValue },
        participants: {
          disconnect: { uuid: userId },
        },
      },
    });
  });
}

export async function getAllTournaments(): Promise<Tournament[]> {
  return Database.tournament.findMany({
    include: {
      participants: {
        select: {
          uuid: true,
          nickname: true,
        },
      },
    },
  });
}

export async function getTournament(uuid: string): Promise<Tournament | null> {
  return Database.tournament.findUnique({
    where: { uuid },
    include: {
      participants: {
        select: {
          uuid: true,
          nickname: true,
        },
      },
    },
  });
}

export async function getTournamentsByStatus(
  status: status
): Promise<Tournament[]> {
  return Database.tournament.findMany({
    where: { status },
    include: {
      participants: {
        select: {
          uuid: true,
          nickname: true,
        },
      },
    },
  });
}

export async function getTournamentsByParticipant(
  uuid: string,
  status?: status
): Promise<Tournament[]> {
  return Database.tournament.findMany({
    where: {
      participants: {
        some: { uuid },
      },
      ...(status && { status }),
    },
  });
}

// delete a tournament including all tournament rounds (not including the matches)
export async function removeTournament(uuid: string): Promise<Tournament> {
  const tournament = await Database.tournament.delete({
    where: { uuid },
    include: { rounds: true },
  });
  return tournament;
  // tournament rounds are deleted automatically through 'onDelete: cascade' setting
  // in relation in schema
  // match.tournamentRoundId is updated automatically through 'onDelete: SetNull'
}

export async function removeAllTournaments(): Promise<void> {
  await Database.tournament.deleteMany();
}

export async function createTournamentRound(
  tournamentId: string,
  index: number,
  matches: Partial<Match>[]
): Promise<TournamentRound | null> {
  // needs to be transaction for operations to be atomic
  return await Database.$transaction(async (tx) => {
    // check if tournament exists
    if (!(await tx.tournament.findUnique({ where: { uuid: tournamentId } }))) {
      throw new Error('tournamentId not found');
    }

    // createTournamentRound first to get uuid
    const tournamentRound = await tx.tournamentRound.create({
      data: {
        tournament: {
          connect: { uuid: tournamentId },
        },
        index,
      },
    });

    // create matches
    await tx.match.createMany({
      data: matches.map((match) => ({
        ...match,
        tournamentRoundId: tournamentRound.uuid, // createMany doesn't support 'connect'
      })),
    });

    // increment numberOfRounds in tournament
    // TODO: select just round and return it here instead of querying again
    await tx.tournament.update({
      where: { uuid: tournamentId },
      data: { numberOfRounds: { increment: 1 } },
    });

    // return update tournamentRound
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
