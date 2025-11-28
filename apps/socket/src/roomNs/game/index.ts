// import WebSocket from 'ws';
// import { type SocketMessage } from '../../plugins/rooms/index.js';
import { type SocketMessage } from '../../plugins/rooms/index.js';
import { WSocket } from '../../plugins/rooms/WSocket/index.js';

import {
  convertPlayertoLocal,
  attachClient,
  removeExpiredRoles,
} from './player.js';

import { updateGame, resetGame } from './game.js';

export const ROLE_EXPIRATION = 8000;
export const PING = 1000;
export const PING_TIMEOUT = 5000;
export const GAME_TIME = 5;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

interface GameState {
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
  gameStartTime: number | null;
}

export const gameState: GameState = {
  paddleWidth: 10,
  paddleHeight: 100,
  ballX: CANVAS_WIDTH / 2,
  ballY: CANVAS_HEIGHT / 2,
  ballSpeedX: 6,
  ballSpeedY: 0,
  ballPaused: false,
  leftY: 250,
  rightY: 250,
  gamePaused: true,
  leftScore: 0,
  rightScore: 0,
  gameOver: false,
  aiEnabled: false,
  timeRemaining: GAME_TIME * 60 * 1000,
  gameStartTime: null,
};

enum Action {
  Up = 'up',
  Down = 'down',
  UpRight = 'up_r', // Only for local play, single keyboard input uses O&L for player2
  DownRight = 'down_r', // Only for local play, single keyboard input uses O&L for player2
  Pause = 'pause', // Pauses game on both sides
  AI = 'ai', // Turns on "AI", opponent paddle tracks the ball automatically
  Hidden = 'hidden', // Player switches tab or window, so no longer active in game
  Visible = 'visible', // Player is active in game again
  Reset = 'reset', // Resets all values back to default
}

export interface ClientRecord {
  clientId: string;
  role: 'local' | 'player1' | 'player2' | 'spectator';
  // Spectator is just a placeholder, didn't want all connections to be able to control the paddles
  webSocket: WSocket | null;
  connected: boolean;
  lastSeen: number;
}

export const clientRecords = new Map<string, ClientRecord>();
export const socketToClientId = new Map<WSocket, string>();

function handleInput(
  input: SocketMessage,
  record: ClientRecord,
  socket: WSocket
) {
  if (!gameState.gamePaused && !gameState.gameOver) {
    if (
      input.data.action === Action.Up &&
      (record.role === 'player1' || record.role === 'local') &&
      gameState.leftY > 0
    )
      gameState.leftY -= 5;
    if (
      input.data.action === Action.Down &&
      (record.role === 'player1' || record.role === 'local') &&
      gameState.leftY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.leftY += 5;
    if (
      input.data.action === Action.Up &&
      record.role === 'player2' &&
      gameState.rightY > 0
    )
      gameState.rightY -= 5;
    if (
      input.data.action === Action.Down &&
      record.role === 'player2' &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.rightY += 5;
    if (
      input.data.action === Action.UpRight &&
      record.role === 'local' &&
      gameState.rightY > 0
    )
      gameState.rightY -= 5;
    if (
      input.data.action === Action.DownRight &&
      record.role === 'local' &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.rightY += 5;
  }
  if (
    input.data.action === Action.Pause &&
    (record.role === 'local' ||
      record.role === 'player1' ||
      record.role === 'player2')
  ) {
    gameState.gamePaused = !gameState.gamePaused;
    if (!gameState.gamePaused && gameState.gameStartTime) {
      // Resume timer - adjust start time to account for pause duration
      const pausedDuration =
        Date.now() -
        (gameState.gameStartTime +
          (GAME_TIME * 60 * 1000 - gameState.timeRemaining));
      gameState.gameStartTime += pausedDuration;
    }
    console.log(`Game ${gameState.gamePaused ? 'paused' : 'resumed'}`);
  }
  if (input.data.action === Action.AI && record.role === 'local') {
    gameState.aiEnabled = !gameState.aiEnabled;
    console.log(`AI ${gameState.aiEnabled ? 'enabled' : 'disabled'}`);
  }
  if (input.data.action === Action.Hidden) {
    console.log(`Client-${record.clientId} has hidden the game`);
    record.connected = false;
  }
  if (input.data.action === Action.Visible) {
    attachClient(record.clientId, socket);
  }
  if (
    input.data.action === Action.Reset &&
    (record.role === 'local' ||
      record.role === 'player1' ||
      record.role === 'player2')
  ) {
    resetGame();
  }
}

// Global game update loop - runs once for the entire server
setInterval(() => {
  updateGame();
  const data = JSON.stringify({
    type: 'message',
    room: 'game:testRoom',
    data: {
      subtype: 'state',
      timestamp: Date.now(),
      serverState: gameState,
    },
  });

  // Send to all connected clients
  for (const record of clientRecords.values()) {
    if (record.webSocket) {
      try {
        record.webSocket.send(data);
      } catch (error) {
        // Handle send errors - client might have disconnected
        console.log(
          'Error sending to client:',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }
}, 1000 / 60);

// Check roles on ping interval
setInterval(removeExpiredRoles, PING);
