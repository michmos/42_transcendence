export function joinLocalMatch() {
  sessionStorage.setItem('gameType', 'local');
  window.socket.joinRoom('game:local');
}

export function joinOnlineMatch() {
  sessionStorage.setItem('gameType', 'online');
  window.socket.joinRoom('game:online');
}

export function joinTournamentMatch(uuid: string) {
  sessionStorage.setItem('gameType', 'tournament');
  window.socket.joinRoom(`game:${uuid}`);
}

export function leaveMatch() {
  window.socket.leaveRoom('game:main');
}
