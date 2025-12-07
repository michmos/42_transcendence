import { type SocketMessageType } from '../../plugins/rooms/index.js';
import { RoomManager, WSocket } from '../../plugins/rooms/WSocket/index.js';

export interface GameRoomData {
  currentGameState: GameState;
  isLocalGame: boolean;
  player1Uuid: string;
  player2Uuid: string;
}

export function updateGameRoomData(
  roomName: string,
  overrides: Partial<GameRoomData>
) {
  const room = RoomManager.get(roomName);
  if (!room) return; // TODO: maybe throw

  const currentData = room.getData() as GameRoomData;
  const updatedData = {
    ...currentData,
    ...overrides,
  };

  room.setData(updatedData);
  return updatedData;
}

import { updateGame } from './game.js';

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

export const initGameState: GameState = {
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

export enum Action {
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

function handleInput(message: SocketMessageType, socket: WSocket) {
  const gameRoomData = RoomManager.get(message.room)?.getData() as GameRoomData;
  if (!gameRoomData) {
    // TODO: handle this error
    throw new Error('No GameState data available');
  }
  const gameState = gameRoomData.currentGameState;
  const role = gameRoomData.player1Uuid === socket.uuid ? 'player1' : 'player2';

  //   console.log("handle message: ", message);
  if (!gameState.gamePaused && !gameState.gameOver) {
    if (
      message.data?.action === Action.Up &&
      (role === 'player1' || gameRoomData.isLocalGame) &&
      gameState.leftY > 0
    )
      gameState.leftY -= 5;
    if (
      message.data?.action === Action.Down &&
      (role === 'player1' || gameRoomData.isLocalGame) &&
      gameState.leftY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.leftY += 5;
    if (
      message.data?.action === Action.Up &&
      role === 'player2' &&
      gameState.rightY > 0
    )
      gameState.rightY -= 5;
    if (
      message.data?.action === Action.Down &&
      role === 'player2' &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.rightY += 5;
    if (
      message.data?.action === Action.UpRight &&
      gameRoomData.isLocalGame &&
      gameState.rightY > 0
    )
      gameState.rightY -= 5;
    if (
      message.data?.action === Action.DownRight &&
      gameRoomData.isLocalGame &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.rightY += 5;
  }
  if (
    message.data?.action === Action.Pause &&
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
  if (message.data?.action === Action.AI && gameRoomData.isLocalGame) {
    gameState.aiEnabled = !gameState.aiEnabled;
    console.log(`AI ${gameState.aiEnabled ? 'enabled' : 'disabled'}`);
  }
}

// function handleRoomInput(input: SocketMessageType, socket: WSocket) {
//   const roomName = socket.gameRoom;
//   if (!roomName) return;

//   const room = RoomManager.get(roomName);
//   if (!room) return;

//   const data = populateRoomData(roomName);
//   const record = data.socketToClientId.get(socket)
//     ? data.clientRecords.get(data.socketToClientId.get(socket)!)
//     : null;

//   if (!record) return;

//   const gameState = data.gameState;

//   console.log("handle room input: ", gameState);
//   // Player movement
//   if (!gameState.gamePaused && !gameState.gameOver) {
//     if (
//       input.data?.action === Action.Up &&
//       (record.role === 'player1' || record.role === 'local') &&
//       gameState.leftY > 0
//     )
//       gameState.leftY -= 5;
//     if (
//       input.data?.action === Action.Down &&
//       (record.role === 'player1' || record.role === 'local') &&
//       gameState.leftY < CANVAS_HEIGHT - gameState.paddleHeight
//     )
//       gameState.leftY += 5;
//     if (
//       input.data?.action === Action.Up &&
//       record.role === 'player2' &&
//       gameState.rightY > 0
//     )
//       gameState.rightY -= 5;
//     if (
//       input.data?.action === Action.Down &&
//       record.role === 'player2' &&
//       gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
//     )
//       gameState.rightY += 5;

//     // Local 2-player right paddle
//     if (
//       input.data?.action === Action.UpRight &&
//       record.role === 'local' &&
//       gameState.rightY > 0
//     )
//       gameState.rightY -= 5;
//     if (
//       input.data?.action === Action.DownRight &&
//       record.role === 'local' &&
//       gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
//     )
//       gameState.rightY += 5;
//   }

//   // Pause
//   if ([record.role].some((r) => ['local', 'player1', 'player2'].includes(r))) {
//     if (input.data?.action === Action.Pause) {
//       gameState.gamePaused = !gameState.gamePaused;
//       if (!gameState.gamePaused && gameState.gameStartTime) {
//         const pausedDuration =
//           Date.now() -
//           (gameState.gameStartTime +
//             (GAME_TIME * 60 * 1000 - gameState.timeRemaining));
//         gameState.gameStartTime += pausedDuration;
//       }
//     }
//   }

//   // AI toggle
//   if (input.data?.action === Action.AI && record.role === 'local') {
//     gameState.aiEnabled = !gameState.aiEnabled;
//   }

// //   // Hidden / Visible
// //   if (input.data?.action === Action.Hidden) record.connected = false;
// //   if (input.data?.action === Action.Visible) {
// //     attachClientToRoom(record.clientId, socket, roomName);
// //   }

//   // Reset game
//   if (input.data?.action === Action.Reset) {
//     data.gameState = initGameState();
//   }

//   // Persist mutations
//   room.setData(data);
// }

// Global game update loop - runs once for the entire server

function gameLoop(gameRoom: string) {
  const currentGameState = initGameState;
  updateGameRoomData(gameRoom, { currentGameState });

  setInterval(() => {
    updateGame(currentGameState);

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

// // Check roles on ping interval
// setInterval(removeExpiredRoles, PING);

function sendRole(
  socket: WSocket,
  roomName: string,
  role: 'local' | 'player1' | 'player2'
) {
  socket.send(
    JSON.stringify({
      type: 'message',
      room: roomName,
      data: {
        subtype: 'role',
        role,
        clientId: socket.uuid,
      },
    })
  );
}

const waitingList: WSocket[] = [];
let lastGameId = 0; // TODO: replace with uuid from fetch Match (API Call)

async function handleJoinOnlineGame(socket: WSocket) {
  if (waitingList.length == 0) {
    socket.consoleLog('added to waiting list for online game');
    // add to waiting list
    waitingList.push(socket);
    socket.send('waiting for opponent');
    return;
  }
  // get opponent
  const otherSocket = waitingList.pop();
  if (!otherSocket) {
    throw new Error('No opponent found in waiting list');
  }

  const newRoomName = `game:${lastGameId}`;
  lastGameId++;

  // join room
  socket.join(newRoomName);
  otherSocket!.join(newRoomName); // TODO: rmv !

  // send roles
  sendRole(socket, newRoomName, 'player1');
  sendRole(otherSocket, newRoomName, 'player2');

  // update room data
  updateGameRoomData(newRoomName, {
    player1Uuid: socket.uuid,
    player2Uuid: otherSocket.uuid,
    isLocalGame: false,
  });

  // add to match map
  socketToGameroom.set(socket, newRoomName);
  socketToGameroom.set(otherSocket, newRoomName);

  // notify clients
  RoomManager.get(newRoomName)?.broadcast(
    JSON.stringify({
      event: 'room-created',
      uuid: newRoomName,
    })
  );

  // start match
  gameLoop(newRoomName);
}

async function handleJoinLocalGame(socket: WSocket) {
  const newRoomName = `game:${lastGameId}`;
  lastGameId++;

  // join room
  socket.join(newRoomName);

  // send roles
  sendRole(socket, newRoomName, 'local');

  // update room data
  updateGameRoomData(newRoomName, {
    player1Uuid: socket.uuid,
    isLocalGame: true,
  });

  // add to match map
  socketToGameroom.set(socket, newRoomName);

  // start match
  gameLoop(newRoomName);
}

async function handleJoinTournamentGame(socket: WSocket) {
  // TODO: implement
}

async function handleJoinRoom(socket: WSocket, message: SocketMessageType) {
  if (socketToGameroom.has(socket)) {
    socket.consoleLog('tried to join a game while already in one');
    socket.sendError('You can only be in one game at a time');
    return;
  }
  switch (message.room) {
    case 'game:online':
      return handleJoinOnlineGame(socket);
    case 'game:local':
      return handleJoinLocalGame(socket);
    case 'game:tournament':
      return handleJoinTournamentGame(socket);
  }
}

const socketToGameroom = new Map<WSocket, string>();

function leaveGamePage(socket: WSocket) {
  // remove from waitlist if on there
  const waitingListIndex = waitingList.findIndex((v) => v === socket);
  if (waitingListIndex > -1) {
    waitingList.splice(waitingListIndex, 1);
  }
  console.log('socket removed from waitinglist');

  // remove from game if in there
  const gameRoomName = socketToGameroom.get(socket);
  if (gameRoomName) {
    const gameData = RoomManager.get(gameRoomName)?.getData() as GameRoomData;
    if (!gameData) {
      // TODO: maybe handle error
      throw new Error('Runtime error: getData()');
    }
    const gameState = gameData.currentGameState;
    const isLeftPlayer: boolean =
      gameData.player1Uuid === socket.uuid ? true : false;

    updateGameRoomData(gameRoomName, {
      currentGameState: {
        ...gameState,
        gameOver: true,
        leftScore: isLeftPlayer ? 0 : 10,
        rightScore: isLeftPlayer ? 10 : 0,
      },
    });
    console.log('socket removed from game');
  }
}

export default {
  // onStartup: () => {
  //   console.log('This code is being run on server start');
  //   // e.g. fetching api for ongoing tournaments
  // },
  // onOpen: (socket: WSocket) => {
  //   console.log('This code is run if a socket connects to the server');
  //   // socket.join('tournament:main');
  // },
  onMessage: (socket: WSocket, message: SocketMessageType) => {
    // console.log('This code is run if a socket sends a message TO THIS HANDLER');
    switch (message.type) {
      case 'join-room':
        return handleJoinRoom(socket, message);
      case 'leave-room':
        if (socket.isInRoom(message.room)) {
          leaveGamePage(socket);
        }
        break;
      case 'message':
        if (socket.isInRoom(message.room)) {
          handleInput(message, socket);
        }
        break;
    }
  },

  onClose: (socket: WSocket) => {
    leaveGamePage(socket);
  },
};
