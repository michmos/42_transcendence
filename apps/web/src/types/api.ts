export type status = 'outstanding' | 'ongoing' | 'finished' | 'canceled';

export interface Match {
  uuid: string;
  player1Id?: string;
  player2Id?: string;
  Score1?: number;
  Score2?: number;
  status: status;
  // Relations might be expanded
  player1?: { nickname?: string; email?: string };
  player2?: { nickname?: string; email?: string };
}

export interface TournamentRound {
  index: number;
  matches: Match[];
}

export interface Tournament {
  uuid: string;
  tournamentName: string;
  status: status;
  playerCount: number;
  maxPlayers: number;
  minPlayers: number;
  numberOfRounds: number;
  participants?: Array<{ uuid: string; nickname?: string; email?: string }>;
}
