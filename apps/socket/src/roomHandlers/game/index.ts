import { type SocketMessageType } from '../../plugins/rooms/index.js';
import { RoomManager, WSocket } from '../../plugins/rooms/WSocket/index.js';
import { handleJoinRoom, leaveGamePage } from './joinLeaveGame.js';
import { type GameState } from './game.js';
import { handleInput } from './handleInput.js';

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
  if (!room) return;

  const currentData = room.getData() as GameRoomData;
  if (overrides.currentGameState) {
    currentData.currentGameState = overrides.currentGameState;
  }
  if (overrides.isLocalGame) {
    currentData.isLocalGame = overrides.isLocalGame;
  }
  if (overrides.player1Uuid) {
    currentData.player1Uuid = overrides.player1Uuid;
  }
  if (overrides.player2Uuid) {
    currentData.player2Uuid = overrides.player2Uuid;
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
        return leaveGamePage(socket);
      case 'message':
        if (socket.isInRoom(message.room)) {
          handleInput(message, socket);
        }
        break;
    }
    // handleRoomInput(message, socket);
  },

  onClose: (socket: WSocket) => {
    leaveGamePage(socket);
  },
};
