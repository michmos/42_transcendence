import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const app = Fastify({ logger: { level: 'error' } });

app.register(fastifyWebsocket);

import { env } from './env.js';

import { convertPlayer, attachClient, removeExpiredRoles } from './player.js';

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

export interface ClientRecord {
  clientId: string;
  role: 'local' | 'player1' | 'player2' | 'spectator';
  webSocket: WebSocket | null;
  connected: boolean;
  lastSeen: number;
}

export const clientRecords = new Map<string, ClientRecord>();
export const socketToClientId = new Map<WebSocket, string>();

function handleInput(
  input: { type: string; action: string },
  record: ClientRecord,
  socket: WebSocket
) {
  if (!gameState.gamePaused && !gameState.gameOver) {
    if (
      input.action === 'up' &&
      (record.role === 'player1' || record.role === 'local') &&
      gameState.leftY > 0
    )
      gameState.leftY -= 5;
    if (
      input.action === 'down' &&
      (record.role === 'player1' || record.role === 'local') &&
      gameState.leftY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.leftY += 5;
    if (
      input.action === 'up' &&
      record.role === 'player2' &&
      gameState.rightY > 0
    )
      gameState.rightY -= 5;
    if (
      input.action === 'down' &&
      record.role === 'player2' &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.rightY += 5;
    if (
      input.action === 'up_r' &&
      record.role === 'local' &&
      gameState.rightY > 0
    )
      gameState.rightY -= 5;
    if (
      input.action === 'down_r' &&
      record.role === 'local' &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.rightY += 5;
  }
  if (
    input.action === 'pause' &&
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
  if (input.action === 'ai' && record.role === 'local') {
    gameState.aiEnabled = !gameState.aiEnabled;
    console.log(`AI ${gameState.aiEnabled ? 'enabled' : 'disabled'}`);
  }
  if (input.action === 'hidden') {
    console.log(`Client-${record.clientId} has hidden the game`);
    record.connected = false;
  }
  if (input.action === 'visible') {
    attachClient(record.clientId, socket);
  }
  if (
    input.action === 'reset' &&
    (record.role === 'local' ||
      record.role === 'player1' ||
      record.role === 'player2')
  ) {
    resetGame();
  }
}

// Check roles on ping interval
setInterval(removeExpiredRoles, PING);

// Global game update loop - runs once for the entire server
setInterval(() => {
  updateGame();
  const data = JSON.stringify({
    type: 'state',
    timestamp: Date.now(),
    ...gameState,
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

app.register(async function (fastify) {
  fastify.get('/', { websocket: true }, (socket) => {
    // console.log('Client connected');

    socket.on('message', (message: Buffer) => {
      //   console.log('message from client:', message.toString());
      try {
        const input = JSON.parse(message.toString());
        // console.log(input);

        if (input.type === 'connect') {
          const clientId =
            input.clientId || `anon-${Math.random().toString(36).slice(2, 10)}`;
          const record = attachClient(clientId, socket);
          socket.send(
            JSON.stringify({
              type: 'role',
              role: record.role,
              clientId: record.clientId,
            })
          );
          console.log(
            `Client-${record.clientId} connected at ${new Date(record.lastSeen).toLocaleString()} as "${record.role}"`
          );
        }

        const clientId = socketToClientId.get(socket);
        if (clientId) {
          const record = clientRecords.get(clientId);
          if (record) {
            record.lastSeen = Date.now();
            if (!record.connected) {
              record.connected = true;
              record.webSocket = socket;
              console.log(`Client-${record.clientId} reconnected`);
            }
          } else return;

          handleInput(input, record, socket);
        }
      } catch (err) {
        console.error('Error handling client message: ', err);
      }
    });

    socket.on('close', () => {
      // Clean up client from maps when socket closes
      const clientId = socketToClientId.get(socket);
      if (clientId) {
        const record = clientRecords.get(clientId);
        if (record) {
          const wasPlayer1 = record.role === 'player1'; // Track if this was player1
          const wasPlayer2 = record.role === 'player2'; // Track if this was player2

          record.webSocket = null;
          record.connected = false;
          record.lastSeen = Date.now();
          clientRecords.set(clientId, record);
          if (record.role === 'spectator') {
            console.log(`Client-${clientId} disconnected`);
            clientRecords.delete(clientId);
          } else
            console.log(
              `Client-${clientId} disconnected; role "${record.role}" reserved for ${ROLE_EXPIRATION / 1000}s`
            );
          // If player2 disconnected, convert player1 back to local
          if (wasPlayer2) {
            convertPlayer(1);
          }
          if (wasPlayer1) {
            convertPlayer(2);
          }
        }
        socketToClientId.delete(socket);
      }
    });
  });
});

await app.listen({ port: env.SOCKET_PORT, host: '0.0.0.0' });

console.info(
  '🌐 Socket server started on port',
  env.SOCKET_PORT,
  'with cors url',
  env.SOCKET_URL
);
