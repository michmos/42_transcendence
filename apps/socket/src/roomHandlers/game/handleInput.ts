import { type SocketMessageType } from '../../plugins/rooms/index.js';
import { RoomManager, WSocket } from '../../plugins/rooms/WSocket/index.js';
import { type GameRoomData } from './index.js';
import { CANVAS_HEIGHT, GAME_TIME } from './game.js';
import { z } from 'zod';

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

const GameDataSchema = z.object({
  action: z.enum(Action).optional(),
  subtype: z.string().optional(),
});

export function handleInput(message: SocketMessageType, socket: WSocket) {
  // validate message.data
  const messageData = GameDataSchema.safeParse(message.data);
  if (!messageData.success) {
    console.log('Invalid game data: ', z.prettifyError(messageData.error));
    socket.sendError('Invalid game data');
    return;
  }

  // get room data
  const gameRoomData = RoomManager.getDataOrThrow(message.room) as GameRoomData;
  const gameState = gameRoomData.currentGameState;
  const role = gameRoomData.player1Uuid === socket.uuid ? 'player1' : 'player2';

  const action = messageData.data.action;

  //   console.log("handle message: ", message);
  if (!gameState.gamePaused && !gameState.gameOver) {
    if (
      action === Action.Up &&
      (role === 'player1' || gameRoomData.isLocalGame) &&
      gameState.leftY > 0
    )
      gameState.leftY -= 5;
    if (
      action === Action.Down &&
      (role === 'player1' || gameRoomData.isLocalGame) &&
      gameState.leftY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.leftY += 5;
    if (action === Action.Up && role === 'player2' && gameState.rightY > 0)
      gameState.rightY -= 5;
    if (
      action === Action.Down &&
      role === 'player2' &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.rightY += 5;
    if (
      action === Action.UpRight &&
      gameRoomData.isLocalGame &&
      gameState.rightY > 0
    )
      gameState.rightY -= 5;
    if (
      action === Action.DownRight &&
      gameRoomData.isLocalGame &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.rightY += 5;
  }
  if (
    action === Action.Pause &&
    (gameRoomData.isLocalGame || role === 'player1' || role === 'player2')
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
  if (action === Action.AI && gameRoomData.isLocalGame) {
    gameState.aiEnabled = !gameState.aiEnabled;
    console.log(`AI ${gameState.aiEnabled ? 'enabled' : 'disabled'}`);
  }
}
