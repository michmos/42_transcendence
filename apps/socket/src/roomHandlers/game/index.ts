import { type SocketMessageType } from '../../plugins/rooms/index.js';
import { RoomManager, WSocket } from '../../plugins/rooms/WSocket/index.js';

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

export function initGameState(): GameState {
  return {
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
}

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

export interface ClientRecord {
  clientId: string;
  role: 'local' | 'player1' | 'player2' | 'spectator';
  // Spectator is just a placeholder, didn't want all connections to be able to control the paddles
  webSocket: WSocket | null;
  connected: boolean;
  lastSeen: number;
}

interface RoomData {
	gameState: GameState;
	clientRecords: Map<string, ClientRecord>;
	socketToClientId: Map<WSocket, string>;
}

function populateRoomData(roomName: string): RoomData {
	const room = RoomManager.get(roomName);
	if (!room) {
		throw new Error(`Room ${roomName} does not exist`);
	}
	const data = room.getData() as Partial<RoomData>;

	if (!data.gameState)
		data.gameState = initGameState();
	if (!data.clientRecords)
		data.clientRecords = new Map();
	if (!data.socketToClientId)
		data.socketToClientId = new Map();

	room.setData(data);
	return (data) as RoomData;
}

let TEST_ROOM = "game:testRoom"

export const clientRecords = new Map<string, ClientRecord>();
export const socketToClientId = new Map<WSocket, string>();

function handleInput(
  input: SocketMessageType,
  record: ClientRecord,
  socket: WSocket
) {
  //   console.log("handle input: ", input);
  if (!gameState.gamePaused && !gameState.gameOver) {
    if (
      input.data?.action === Action.Up &&
      (record.role === 'player1' || record.role === 'local') &&
      gameState.leftY > 0
    )
      gameState.leftY -= 5;
    if (
      input.data?.action === Action.Down &&
      (record.role === 'player1' || record.role === 'local') &&
      gameState.leftY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.leftY += 5;
    if (
      input.data?.action === Action.Up &&
      record.role === 'player2' &&
      gameState.rightY > 0
    )
      gameState.rightY -= 5;
    if (
      input.data?.action === Action.Down &&
      record.role === 'player2' &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.rightY += 5;
    if (
      input.data?.action === Action.UpRight &&
      record.role === 'local' &&
      gameState.rightY > 0
    )
      gameState.rightY -= 5;
    if (
      input.data?.action === Action.DownRight &&
      record.role === 'local' &&
      gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight
    )
      gameState.rightY += 5;
  }
  if (
    input.data?.action === Action.Pause &&
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
  if (input.data?.action === Action.AI && record.role === 'local') {
    gameState.aiEnabled = !gameState.aiEnabled;
    console.log(`AI ${gameState.aiEnabled ? 'enabled' : 'disabled'}`);
  }
  if (input.data?.action === Action.Hidden) {
    console.log(`${record.clientId} has hidden the game`);
    record.connected = false;
  }
  if (input.data?.action === Action.Visible) {
    attachClient(record.clientId, socket);
  }
  if (
    input.data?.action === Action.Reset &&
    (record.role === 'local' ||
      record.role === 'player1' ||
      record.role === 'player2')
  ) {
    resetGame();
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
setInterval(() => {
  updateGame();
  const data = JSON.stringify({
    type: 'message',
    room: TEST_ROOM,
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

function sendRole(socket: WSocket): ClientRecord {
  const clientId = socket.uuid;
  const record = attachClient(clientId, socket);
  socket.send(
    JSON.stringify({
      type: 'message',
      room: TEST_ROOM,
      data: {
        subtype: 'role',
        role: record.role,
        clientId: record.clientId,
      },
    })
  );
  return record;
}

async function handleJoinRoom(socket: WSocket, message: SocketMessageType) {
	switch (message.room) {
		case 'game:online':
			socket.join(TEST_ROOM)
			socket.gameRoom = TEST_ROOM;
			console.log(`joined ${TEST_ROOM}`);
			RoomManager.get(TEST_ROOM)?.broadcast(JSON.stringify({
				event: 'room-created',
				uuid: TEST_ROOM
			}));
		// case 'game:online':
		// 	if (nobodyelsewaiting) {
		// 		putOnWaitingList
		// 		return;
		// 	} else {
		// 		otherSocket = getFistSocketFromWaitingList
		// 		socket.joinRoom(${game:uuid});
		// 		otherSocket.joinRoom(${game:uuid});
		// 		RoomManager.get(${game:uuid})?.broadcast('game created: ${uuid}');
		// 		return;
		// 	}
		// 	break;
		// case 'game:local':
		// 	handleLocalGame(socket);
		// default:
		// 	// tournament
		// 	handleOnlineGame(socket1, socket2);
		// 	break;
	}
}

export default {
  onStartup: () => {
    console.log('This code is being run on server start');
    // e.g. fetching api for ongoing tournaments
  },
  onOpen: (socket: WSocket) => {
    console.log('This code is run if a socket connects to the server');
    const record = sendRole(socket);
    console.log(
      `${record.clientId} connected at ${new Date(record.lastSeen).toLocaleString()} as "${record.role}"`
    );
    // socket.join('tournament:main');
  },
  onMessage: (socket: WSocket, message: SocketMessageType) => {
    // console.log('This code is run if a socket sends a message TO THIS HANDLER');
    switch(message.type) {
      case 'join-room':
        return handleJoinRoom(socket, message);
      case 'message':
        if (message.data?.subtype === 'connect') {
          sendRole(socket);
        } 
        // else {
        //   // normal game messages
          
        //   // check permissions
        //   if (!socket.isInRoom(message.room)) { return; }
        //   const currentGameState = RoomManager.get(message.room)?.getData();
        //   // apply changes of client message
        //   // handleInput(currentGameState);
        //   // -> updatedGameState
        //   // send updatedGameState back
        //   // RoomManager.get(message.room)?.setData(updatedGameState);
        // }
    }


    try {
      const clientId = socketToClientId.get(socket);
      if (clientId) {
        const record = clientRecords.get(clientId);
        console.log(`Role: "${record?.role}"`);
        console.log("onMessage: ", message);
		    const roomSize = RoomManager.get(TEST_ROOM)?.size();
        console.log("room size: ", roomSize);
		    if (record) {
          record.lastSeen = Date.now();
          handleInput(message, record, socket);
        }
      }
    } catch (err) {
      console.error('Error handling client message: ', err);
    }
	// handleRoomInput(message, socket);
  },
  onClose: (socket: WSocket) => {
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
          console.log(`${clientId} disconnected`);
          clientRecords.delete(clientId);
        } else
          console.log(
            `${clientId} disconnected; role "${record.role}" reserved for ${ROLE_EXPIRATION / 1000}s`
          );
        // If player2 disconnected, convert player1 back to local
        if (wasPlayer2) {
          convertPlayertoLocal(1);
        }
        if (wasPlayer1) {
          convertPlayertoLocal(2);
        }
      }
      socketToClientId.delete(socket);
    }
    console.log('This code is run if a socket disconnects from a server');
    // e.g. remove him from tournament rooms (or leave him in)
  },
};