export function joinLocalMatch() {
  window.socket.joinRoom('game:local');
}

export function joinOnlineMatch() {
  window.socket.joinRoom('game:online');
}

export function joinTournamentMatch(uuid: string) {
  window.socket.joinRoom(`game:${uuid}`);
}

export function leaveMatch() {
  window.socket.leaveRoom('game:main');
}
