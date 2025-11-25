export function createTournament(specs: {
  tournamentName: string;
  maxPlayers: number;
  minPlayers: number;
}) {
  window.socket.joinRoom('tournament:main', specs);
}

export function joinTournament(tournamentUuid: string) {
  window.socket.joinRoom(`tournament:${tournamentUuid}`);
}

export function leaveTournament(tournamentUuid: string) {
  window.socket.leaveRoom(`tournament:${tournamentUuid}`);
}
