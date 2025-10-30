import { gameState, GAME_TIME } from './app.js';

export function startGameTimer() {
  if (!gameState.gameStartTime) {
    gameState.gameStartTime = Date.now();
  }
}

export function updateTimer() {
  if (!gameState.gameStartTime || gameState.gamePaused || gameState.gameOver) {
    return;
  }
  const elapsed = Date.now() - gameState.gameStartTime;
  gameState.timeRemaining = Math.max(0, GAME_TIME * 60 * 1000 - elapsed);
  if (gameState.timeRemaining === 0 && !gameState.gameOver) {
    if (gameState.leftScore === gameState.rightScore) {
      gameState.paddleHeight = 0;
      gameState.leftY = 0;
      gameState.rightY = 0;
    } else {
      console.log("GAME OVER - Time's up!");
      gameState.gameOver = true;
    }
  }
}

export function resetTimer() {
  gameState.timeRemaining = GAME_TIME * 60 * 1000;
  gameState.gameStartTime = null;
}
