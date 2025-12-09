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
  tournamentId: string,
  alias: string
): Promise<Tournament> {
  return Database.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: {
        uuid: userId,
        tournaments: { some: { tournamentId } },
      },
    });
    if (user) {
      return tx.tournament.findFirstOrThrow({ where: { uuid: tournamentId } });
    }
    // create participation
    await tx.tournamentParticipations.create({
      data: {
        alias,
        tournament: {
          connect: { uuid: tournamentId },
        },
        user: {
          connect: { uuid: userId },
        },
      },
    });
    // update playerCount
    return tx.tournament.update({
      where: { uuid: tournamentId },
      data: {
        playerCount: { increment: 1 },
      },
    });
  });
}

export async function removeUserFromTournament(
  userId: string,
  tournamentId: string
): Promise<Tournament> {
  return Database.$transaction(async (tx) => {
    const user = await tx.tournamentParticipations.findFirst({
      where: {
        userId,
        tournamentId,
      },
    });
    if (!user) {
      return tx.tournament.findFirstOrThrow({ where: { uuid: tournamentId } });
    }
    await tx.tournamentParticipations.delete({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
    });
    return tx.tournament.update({
      where: { uuid: tournamentId },
      data: {
        playerCount: { decrement: 1 },
      },
    });
  });
}

export async function getUserAlias(userId: string, tournamentId: string) {
  return (
    await Database.tournamentParticipations.findUniqueOrThrow({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
      select: {
        alias: true,
      },
    })
  ).alias;
}

export async function getAllTournaments(): Promise<Tournament[]> {
  return Database.tournament.findMany();
}

export async function getTournament(uuid: string): Promise<Tournament | null> {
  return Database.tournament.findUnique({ where: { uuid } });
}

export async function getTournamentByRound(
  roundId: string
): Promise<Tournament> {
  const tournamentRound = await Database.tournamentRound.findUniqueOrThrow({
    where: {
      uuid: roundId,
    },
  });
  return await Database.tournament.findUniqueOrThrow({
    where: { uuid: tournamentRound.tournamentId },
  });
}

export async function getTournamentsByStatus(
  status: status
): Promise<Tournament[]> {
  return Database.tournament.findMany({ where: { status } });
}

export async function getTournamentsByParticipant(
  uuid: string,
  status?: status
): Promise<Tournament[]> {
  return Database.tournament.findMany({
    where: {
      participants: {
        some: { userId: uuid },
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
  matches: Array<Partial<Match>>
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

export async function getTournamentRound(tournamentId: string, index: number) {
  const round = await Database.tournamentRound.findFirst({
    where: {
      tournamentId,
      index,
    },
    select: {
      uuid: true,
      index: true,
      status: true,
      matches: {
        select: {
          uuid: true,
          status: true,
          score1: true,
          score2: true,
          player1Id: true,
          player2Id: true,
        },
      },
    },
  });

  if (!round) {
    return null;
  }

  // Get aliases and nicknames for all players in matches (without exposing UUIDs)
  const matchesWithAliases = await Promise.all(
    round.matches.map(async (match) => {
      let player1Alias: string | null = null;
      let player1Nickname: string | null = null;
      let player2Alias: string | null = null;
      let player2Nickname: string | null = null;

      if (match.player1Id) {
        try {
          player1Alias = await getUserAlias(match.player1Id, tournamentId);
        } catch (error) {
          // If alias not found, fall back to null (player might have left)
          console.error(
            `Error fetching alias for player1 ${match.player1Id}:`,
            error
          );
        }
        // Get nickname as fallback
        try {
          const player1 = await Database.user.findUnique({
            where: { uuid: match.player1Id },
            select: { nickname: true },
          });
          player1Nickname = player1?.nickname || null;
        } catch (error) {
          console.error(
            `Error fetching nickname for player1 ${match.player1Id}:`,
            error
          );
        }
      }

      if (match.player2Id) {
        try {
          player2Alias = await getUserAlias(match.player2Id, tournamentId);
        } catch (error) {
          // If alias not found, fall back to null (player might have left)
          console.error(
            `Error fetching alias for player2 ${match.player2Id}:`,
            error
          );
        }
        // Get nickname as fallback
        try {
          const player2 = await Database.user.findUnique({
            where: { uuid: match.player2Id },
            select: { nickname: true },
          });
          player2Nickname = player2?.nickname || null;
        } catch (error) {
          console.error(
            `Error fetching nickname for player2 ${match.player2Id}:`,
            error
          );
        }
      }

      return {
        uuid: match.uuid,
        status: match.status,
        score1: match.score1,
        score2: match.score2,
        player1:
          player1Alias || player1Nickname
            ? {
                alias: player1Alias,
                nickname: player1Nickname,
              }
            : null,
        player2:
          player2Alias || player2Nickname
            ? {
                alias: player2Alias,
                nickname: player2Nickname,
              }
            : null,
      };
    })
  );

  // Transform to match TournamentRoundResponse type (without UUIDs)
  return {
    uuid: round.uuid,
    index: round.index,
    status: round.status,
    matches: matchesWithAliases,
  };
}

export async function getCurrentTournamentRound(tournamentId: string) {
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
