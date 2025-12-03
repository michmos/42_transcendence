// Canvas will be created dynamically, so we get it lazily
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

function initCanvas() {
  // Check if canvas exists and is still in the DOM
  if (!canvas || !document.body.contains(canvas)) {
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(
        'Canvas not found — make sure canvas element exists with id="gameCanvas"'
      );
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
  }
  return { canvas, ctx };
}

/**
 * Reset canvas references (called during cleanup when navigating away)
 */
export function resetCanvas() {
  canvas = null;
  ctx = null;
}

export let clientId = localStorage.getItem('transcendenceClientId');
if (!clientId) {
  clientId = Math.random().toString(36).slice(2, 10);
  localStorage.setItem('transcendenceClientId', clientId);
}

// === Game state ===
export const ballSize = 5;
export const padding = 10;

export let lastServerUpdate = 0;
export const ballVelocity = { x: 0, y: 0 };
export const localPaddles = { leftY: 0, rightY: 0 };

export let serverState = {
  paddleWidth: 0,
  paddleHeight: 0,
  ballX: 0,
  ballY: 0,
  ballSpeedX: 0,
  ballSpeedY: 0,
  ballPaused: false,
  leftY: 0,
  rightY: 0,
  gamePaused: false,
  leftScore: 0,
  rightScore: 0,
  gameOver: false,
  aiEnabled: false,
  timeRemaining: 0,
  gameStartTime: 0,
};

interface ServerState {
  paddleWidth: number;
  paddleHeight: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
  ballPaused: boolean;
  leftY: number;
  rightY: number;
  gamePaused: boolean;
  leftScore: number;
  rightScore: number;
  gameOver: boolean;
  aiEnabled: boolean;
  timeRemaining: number;
  gameStartTime: number;
}

export let role = 'spectator';

// === Player nickname (session-only, not persisted) ===
export let playerNickname: string | null = null;
export let player1Nickname: string | null = null;
export let player2Nickname: string | null = null;

// === Setters ===
export function setPlayerNickname(nickname: string | null) {
  playerNickname = nickname;
}

export function getPlayerNickname(): string | null {
  return playerNickname;
}

export function setPlayer1Nickname(nickname: string | null) {
  player1Nickname = nickname;
}

export function getPlayer1Nickname(): string | null {
  return player1Nickname;
}

export function setPlayer2Nickname(nickname: string | null) {
  player2Nickname = nickname;
}

export function getPlayer2Nickname(): string | null {
  return player2Nickname;
}

// === Connection state ===
export let connectionState = 'connecting';
export let reconnectAttempts = 0;
export const maxReconnectAttempts = 3;
export let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
export let ws: WebSocket;
export let networkBlocked = false;

// === Setters ===
export function setServerState(newState: ServerState) {
  serverState = newState;
}
export function setLastServerUpdate(time: number) {
  lastServerUpdate = time;
}
export function setRole(newRole: string) {
  role = newRole;
}
export function setConnectionState(newState: string) {
  connectionState = newState;
}
export function setReconnectAttempts(newAttempts: number) {
  reconnectAttempts = newAttempts;
}
export function setWebSocket(newSocket: WebSocket) {
  ws = newSocket;
}
export function setReconnectTimeout(newTimeout: NodeJS.Timeout) {
  reconnectTimeout = newTimeout;
}
export function setNetworkBlocked(blocked: boolean) {
  networkBlocked = blocked;
}

// === Getters ===
export function getCanvas() {
  const { canvas: c } = initCanvas();
  return c;
}
export function getCtx() {
  const { ctx: c } = initCanvas();
  return c;
}
export function getClientId() {
  return clientId;
}
export function getServerState() {
  return serverState;
}
export function getLocalPaddles() {
  return localPaddles;
}
export function getBallVelocity() {
  return ballVelocity;
}
export function getLastServerUpdate() {
  return lastServerUpdate;
}
export function getConnectionState() {
  return connectionState;
}
export function getReconnectAttempts() {
  return reconnectAttempts;
}
export function getMaxReconnectAttempts() {
  return maxReconnectAttempts;
}
export function getWebSocket() {
  return ws;
}
export function getNetworkBlocked() {
  return networkBlocked;
}
