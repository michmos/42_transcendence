import { updateTimer, startGameTimer } from './timer.js';
import { RoomManager } from '../../plugins/rooms/WSocket/index.js';
import { updateGameRoomData, type GameRoomData } from './index.js';

export const ROLE_EXPIRATION = 8000;
export const PING = 1000;
export const PING_TIMEOUT = 5000;
export const GAME_TIME = 5;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export interface GameState {
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

const initGameState: GameState = {
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

const BALL_SIZE = 10;
const PADDLE_SEGMENTS = 21;
let gameSpeed = 1;
let baseGameSpeed = 1;
let bounceCount = 0;

const collisionVectors = [
  // Left paddle vector
  { x: -3, y: 7 },
  { x: -3, y: 6 },
  { x: -3, y: 5 },
  { x: -4, y: 4 }, // Top
  { x: -4, y: 3 },
  { x: -5, y: 3 },
  { x: -5, y: 2 },

  { x: -6, y: 2 },
  { x: -6, y: 1 },
  { x: -7, y: 1 },
  { x: -7, y: 0 }, // Middle
  { x: -7, y: -1 },
  { x: -6, y: -1 },
  { x: -6, y: -2 },

  { x: -5, y: -2 },
  { x: -5, y: -3 },
  { x: -4, y: -3 },
  { x: -4, y: -4 }, // Bottom
  { x: -3, y: -5 },
  { x: -3, y: -6 },
  { x: -3, y: -7 },

  // Right paddle vector
  { x: 3, y: 7 },
  { x: 3, y: 6 },
  { x: 3, y: 5 },
  { x: 4, y: 4 }, // Top
  { x: 4, y: 3 },
  { x: 5, y: 3 },
  { x: 5, y: 2 },

  { x: 6, y: 2 },
  { x: 6, y: 1 },
  { x: 7, y: 1 },
  { x: 7, y: 0 }, // Middle
  { x: 7, y: -1 },
  { x: 6, y: -1 },
  { x: 6, y: -2 },

  { x: 5, y: -2 },
  { x: 5, y: -3 },
  { x: 4, y: -3 },
  { x: 4, y: -4 }, // Bottom
  { x: 3, y: -5 },
  { x: 3, y: -6 },
  { x: 3, y: -7 },
];

function getVector(
  currentGameState: GameState,
  isLeftPaddle: boolean
): { x: number; y: number } {
  // Playtested numbers to throw curveballs if a round takes too long
  if (bounceCount === 17 || bounceCount === 20 || bounceCount === 23) {
    if (isLeftPaddle) {
      if (
        currentGameState.leftY <
        CANVAS_HEIGHT / 2 - currentGameState.paddleHeight / 2
      )
        return collisionVectors[0] ?? { x: 0, y: 0 };
      else {
        return collisionVectors[PADDLE_SEGMENTS - 1] ?? { x: 0, y: 0 };
      }
    } else {
      if (
        currentGameState.rightY <
        CANVAS_HEIGHT / 2 - currentGameState.paddleHeight / 2
      )
        return collisionVectors[PADDLE_SEGMENTS] ?? { x: 0, y: 0 };
      else {
        return collisionVectors[2 * PADDLE_SEGMENTS - 1] ?? { x: 0, y: 0 };
      }
    }
  }
  const relativeY =
    currentGameState.ballY +
    BALL_SIZE / 2 -
    (isLeftPaddle ? currentGameState.leftY : currentGameState.rightY);
  const segmentHeight = currentGameState.paddleHeight / PADDLE_SEGMENTS;

  let segment = Math.floor(relativeY / segmentHeight);
  segment = Math.max(0, Math.min(PADDLE_SEGMENTS - 1, segment));
  // console.log('segment:', segment);

  const vectorIndex = isLeftPaddle ? segment : segment + PADDLE_SEGMENTS;

  return collisionVectors[vectorIndex] ?? { x: 0, y: 0 };
}

export function updateGame(currentGameState: GameState) {
  if (currentGameState.gameOver) return;

  updateTimer(currentGameState);

  if (currentGameState.gamePaused) return;

  if (!currentGameState.ballPaused) {
    startGameTimer(currentGameState);
    currentGameState.ballX -= currentGameState.ballSpeedX * gameSpeed;
    currentGameState.ballY -= currentGameState.ballSpeedY * gameSpeed;
  }

  if (
    currentGameState.ballX <= 0 ||
    currentGameState.ballX >= CANVAS_WIDTH - BALL_SIZE
  ) {
    // // Left and right collision
    // gameState.ballSpeedX *= -1;
    if (currentGameState.ballX <= 0) currentGameState.rightScore++;
    else currentGameState.leftScore++;

    const totalScore = currentGameState.rightScore + currentGameState.leftScore;
    // console.log(totalScore);
    if ((totalScore + 2) % 3 === 0) baseGameSpeed += 0.1;
    baseGameSpeed = Math.min(baseGameSpeed, 1.6);

    gameSpeed = baseGameSpeed;
    bounceCount = 0;
    console.log(
      'Score! Base speed:',
      baseGameSpeed,
      'Current speed:',
      gameSpeed
    );

    currentGameState.ballX = CANVAS_WIDTH / 2 - BALL_SIZE / 2;
    currentGameState.ballY = CANVAS_HEIGHT / 2 - BALL_SIZE / 2;
    currentGameState.ballSpeedX = currentGameState.ballSpeedX > 0 ? -6 : 6;
    currentGameState.ballSpeedY =
      Math.random() > 0.5 ? -Math.random() : Math.random();

    // gameState.ballSpeedX = gameState.ballSpeedX > 0 ? -gameState.ballSpeedX : gameState.ballSpeedX; //reverse direction after scoring a point
    currentGameState.ballPaused = true;

    setTimeout(() => {
      currentGameState.ballPaused = false;
    }, 1000);
  }

  // Top and bottom collision
  if (
    currentGameState.ballY <= 0 ||
    currentGameState.ballY >= CANVAS_HEIGHT - BALL_SIZE
  ) {
    currentGameState.ballSpeedY *= -1;
  }

  // Left paddle collision
  if (
    currentGameState.ballX <= currentGameState.paddleWidth &&
    currentGameState.ballY + BALL_SIZE >= currentGameState.leftY &&
    currentGameState.ballY <=
      currentGameState.leftY + currentGameState.paddleHeight &&
    currentGameState.ballY > 0 &&
    currentGameState.ballY < CANVAS_HEIGHT - BALL_SIZE
  ) {
    // gameState.ballSpeedX *= -1;
    const offset = Math.random() > 0.5 ? -0.1 : 0.1;
    const vector = getVector(currentGameState, true);
    currentGameState.ballSpeedX = vector.x;
    currentGameState.ballSpeedY = vector.y + offset;
    bounceCount++;
    if (bounceCount >= 10) {
      const bounceSpeedIncrease = (bounceCount - 9) * 0.1;
      gameSpeed = Math.min(baseGameSpeed + bounceSpeedIncrease, 1.6);
    }
    // console.log(gameState.ballSpeedX * gameSpeed);
    console.log(
      'Bounce count:',
      bounceCount,
      'Base speed:',
      baseGameSpeed,
      'Current speed:',
      gameSpeed
    );
  }

  // Right paddle collision
  if (
    currentGameState.ballX + BALL_SIZE >=
      CANVAS_WIDTH - currentGameState.paddleWidth &&
    currentGameState.ballY + BALL_SIZE >= currentGameState.rightY &&
    currentGameState.ballY <=
      currentGameState.rightY + currentGameState.paddleHeight &&
    currentGameState.ballY > 0 &&
    currentGameState.ballY < CANVAS_HEIGHT - BALL_SIZE
  ) {
    // gameState.ballSpeedX *= -1;
    const offset = Math.random() > 0.5 ? -0.1 : 0.1;
    const vector = getVector(currentGameState, false);
    currentGameState.ballSpeedX = vector.x;
    currentGameState.ballSpeedY = vector.y + offset;
    bounceCount++;
    if (bounceCount >= 10) {
      const bounceSpeedIncrease = (bounceCount - 9) * 0.1; // +0.1 for each bounce after 10
      gameSpeed = Math.min(baseGameSpeed + bounceSpeedIncrease, 1.6);
    }
    // console.log(gameState.ballSpeedX * gameSpeed);
    console.log(
      'Bounce count:',
      bounceCount,
      'Base speed:',
      baseGameSpeed,
      'Current speed:',
      gameSpeed
    );
  }

  if (currentGameState.aiEnabled) {
    if (
      currentGameState.rightY + currentGameState.paddleHeight / 2 <
        currentGameState.ballY &&
      currentGameState.rightY < CANVAS_HEIGHT - currentGameState.paddleHeight
    ) {
      currentGameState.rightY += 4;
    }
    if (
      currentGameState.rightY + currentGameState.paddleHeight / 2 >
        currentGameState.ballY &&
      currentGameState.rightY > 0
    ) {
      currentGameState.rightY -= 4;
    }
    // if (gameState.leftY + (gameState.paddleHeight / 2) < gameState.ballY && gameState.leftY < CANVAS_HEIGHT - gameState.paddleHeight) {
    // 	gameState.leftY += 4;
    // }
    // if (gameState.leftY + (gameState.paddleHeight / 2) > gameState.ballY && gameState.leftY > 0) {
    // 	gameState.leftY -= 4;
    // }
  }

  if (currentGameState.leftScore >= 10 || currentGameState.rightScore >= 10) {
    console.log('GAME OVER');
    currentGameState.gameOver = true;
  }
}

export function gameLoop(gameRoom: string) {
  updateGameRoomData(gameRoom, { currentGameState: initGameState });

  const intervalId = setInterval(() => {
    const currentGameState = (
      RoomManager.get(gameRoom)?.getData() as GameRoomData
    ).currentGameState;
    if (!currentGameState) {
      // TODO: handle exception
      clearInterval(intervalId);
      throw new Error('runtime error');
    }

    updateGame(currentGameState);
    if (currentGameState.gameOver) {
      clearInterval(intervalId);
    }

    // Broadcast updated game state to all clients in the room
    RoomManager.get(gameRoom)?.broadcast(
      JSON.stringify({
        type: 'message',
        room: gameRoom,
        data: {
          subtype: 'state',
          timestamp: Date.now(),
          serverState: currentGameState,
        },
      })
    );
  }, 1000 / 60);
}
