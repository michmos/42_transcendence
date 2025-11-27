import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './index.js';

import { resetTimer, updateTimer, startGameTimer } from './timer.js';

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
  ballY: number,
  paddleY: number,
  isLeftPaddle: boolean
): { x: number; y: number } {
  // Playtested numbers to throw curveballs if a round takes too long
  if (bounceCount === 17 || bounceCount === 20 || bounceCount === 23) {
    if (isLeftPaddle) {
      if (gameState.leftY < CANVAS_HEIGHT / 2 - gameState.paddleHeight / 2)
        return collisionVectors[0] ?? { x: 0, y: 0 };
      else {
        return collisionVectors[PADDLE_SEGMENTS - 1] ?? { x: 0, y: 0 };
      }
    } else {
      if (gameState.rightY < CANVAS_HEIGHT / 2 - gameState.paddleHeight / 2)
        return collisionVectors[PADDLE_SEGMENTS] ?? { x: 0, y: 0 };
      else {
        return collisionVectors[2 * PADDLE_SEGMENTS - 1] ?? { x: 0, y: 0 };
      }
    }
  }
  const relativeY = ballY - paddleY;
  const segmentHeight = gameState.paddleHeight / PADDLE_SEGMENTS;

  let segment = Math.floor(relativeY / segmentHeight);
  segment = Math.max(0, Math.min(PADDLE_SEGMENTS - 1, segment));
  // console.log('segment:', segment);

  const vectorIndex = isLeftPaddle ? segment : segment + PADDLE_SEGMENTS;

  return collisionVectors[vectorIndex] ?? { x: 0, y: 0 };
}

export function updateGame() {
  if (gameState.gameOver) return;

  updateTimer();

  if (gameState.gamePaused) return;

  if (!gameState.ballPaused) {
    startGameTimer();
    gameState.ballX -= gameState.ballSpeedX * gameSpeed;
    gameState.ballY -= gameState.ballSpeedY * gameSpeed;
  }

  if (gameState.ballX <= 0 || gameState.ballX >= CANVAS_WIDTH - BALL_SIZE) {
    // // Left and right collision
    // gameState.ballSpeedX *= -1;
    if (gameState.ballX <= 0) gameState.rightScore++;
    else gameState.leftScore++;

    const totalScore = gameState.rightScore + gameState.leftScore;
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

    gameState.ballX = CANVAS_WIDTH / 2;
    gameState.ballY = CANVAS_HEIGHT / 2;
    gameState.ballSpeedX = gameState.ballSpeedX > 0 ? -6 : 6;
    gameState.ballSpeedY = Math.random() > 0.5 ? -Math.random() : Math.random();

    // gameState.ballSpeedX = gameState.ballSpeedX > 0 ? -gameState.ballSpeedX : gameState.ballSpeedX; //reverse direction after scoring a point
    gameState.ballPaused = true;

    setTimeout(() => {
      gameState.ballPaused = false;
    }, 1000);
  }

  // Top and bottom collision
  if (gameState.ballY <= 0 || gameState.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
    gameState.ballSpeedY *= -1;
  }

  // Left paddle collision
  if (
    gameState.ballX <= gameState.paddleWidth &&
    gameState.ballY + BALL_SIZE >= gameState.leftY &&
    gameState.ballY <= gameState.leftY + gameState.paddleHeight &&
    gameState.ballY > 0 &&
    gameState.ballY < CANVAS_HEIGHT - BALL_SIZE
  ) {
    // gameState.ballSpeedX *= -1;
    const offset = Math.random() > 0.5 ? -0.1 : 0.1;
    const vector = getVector(
      gameState.ballY + BALL_SIZE / 2,
      gameState.leftY,
      true
    );
    gameState.ballSpeedX = vector.x;
    gameState.ballSpeedY = vector.y + offset;
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
    gameState.ballX + BALL_SIZE >= CANVAS_WIDTH - gameState.paddleWidth &&
    gameState.ballY + BALL_SIZE >= gameState.rightY &&
    gameState.ballY <= gameState.rightY + gameState.paddleHeight &&
    gameState.ballY > 0 &&
    gameState.ballY < CANVAS_HEIGHT - BALL_SIZE
  ) {
    // gameState.ballSpeedX *= -1;
    const offset = Math.random() > 0.5 ? -0.1 : 0.1;
    const vector = getVector(
      gameState.ballY + BALL_SIZE / 2,
      gameState.rightY,
      false
    );
    gameState.ballSpeedX = vector.x;
    gameState.ballSpeedY = vector.y + offset;
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

  if (gameState.aiEnabled) {
    if (
      gameState.rightY + gameState.paddleHeight / 2 < gameState.ballY &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    ) {
      gameState.rightY += 4;
    }
    if (
      gameState.rightY + gameState.paddleHeight / 2 > gameState.ballY &&
      gameState.rightY > 0
    ) {
      gameState.rightY -= 4;
    }
    // if (gameState.leftY + (gameState.paddleHeight / 2) < gameState.ballY && gameState.leftY < CANVAS_HEIGHT - gameState.paddleHeight) {
    // 	gameState.leftY += 4;
    // }
    // if (gameState.leftY + (gameState.paddleHeight / 2) > gameState.ballY && gameState.leftY > 0) {
    // 	gameState.leftY -= 4;
    // }
  }

  if (gameState.leftScore >= 10 || gameState.rightScore >= 10) {
    console.log('GAME OVER');
    gameState.gameOver = true;
  }
}

export function resetGame() {
  gameState.paddleHeight = 100;
  gameState.gamePaused = true;
  gameState.leftScore = 0;
  gameState.rightScore = 0;
  gameState.gameOver = false;
  gameState.ballX = CANVAS_WIDTH / 2;
  gameState.ballY = CANVAS_HEIGHT / 2;
  gameState.leftY = 250;
  gameState.rightY = 250;
  gameSpeed = 1;
  baseGameSpeed = 1;
  bounceCount = 0;
  resetTimer();
}
