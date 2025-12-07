import { type SocketMessageType } from '../../plugins/rooms/index.js';
import { RoomManager, WSocket } from '../../plugins/rooms/WSocket/index.js';
import { updateGameRoomData, type GameRoomData } from './index.js';
import { gameLoop } from './game.js';
import { env } from '../../env.js';
import { type MatchParticipantsResponse } from 'types';

const waitingList: WSocket[] = [];
let lastGameId = 0; // TODO: replace with uuid from fetch Match (API Call)
const socketToGameroom = new Map<WSocket, string>();

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

// TODO: add cache expiration
const matchParticipantsCache = new Map<string, MatchParticipantsResponse>();

async function getMatchParticipants(matchUuid: string) {
  if (matchParticipantsCache.has(matchUuid)) {
    const participants = matchParticipantsCache.get(matchUuid)!;
    matchParticipantsCache.delete(matchUuid);
    return participants;
  }

  // fetch from API
  const response = await fetch(
    `http://localhost:5173/api/match/${matchUuid}/participants`,
    {
      // TODO: hardcoded localhost
      method: 'GET',
      headers: {
        'x-api-key': env.ADMIN_API_KEY,
      },
      credentials: 'include',
    }
  );
  if (!response.ok) {
    throw new Error(
      `Fetching tournament match participants failed: ${response.status} ${response.statusText}`
    );
  }
  const participants = (await response.json()) as MatchParticipantsResponse;
  matchParticipantsCache.set(matchUuid, participants);
  return participants;
}

async function handleSpecificGame(socket: WSocket, roomName: string) {
  const matchUuid = roomName.split(':')[1];
  if (!matchUuid) {
    socket.consoleLog('invalid tournament match uuid');
    socket.sendError('Invalid tournament match uuid');
    return;
  }

  // check participants
  const participants = await getMatchParticipants(matchUuid);
  if (
    socket.uuid !== participants.player1Id &&
    socket.uuid !== participants.player2Id
  ) {
    socket.consoleLog('tried to join a tournament match they are not in');
    socket.sendError('You are not a participant in this tournament match');
    return;
  }

  const room = RoomManager.get(roomName);
  if (!room) {
    // opponent not joined yet
    socket.consoleLog('tournament match: waiting for opponent');
    socket.join(roomName);
    sendRole(socket, roomName, 'player1');
    updateGameRoomData(roomName, {
      player1Uuid: socket.uuid,
      isLocalGame: false,
    });
    socketToGameroom.set(socket, roomName);
    return;
  } else {
    // opponent joined
    socket.consoleLog('tournament match: opponent found, starting match');
    socket.join(roomName);
    updateGameRoomData(roomName, { player2Uuid: socket.uuid });
    sendRole(socket, roomName, 'player2');
    socketToGameroom.set(socket, roomName);
  }

  // notify clients
  RoomManager.get(roomName)?.broadcast(
    JSON.stringify({
      event: 'room-created',
      uuid: roomName,
    })
  );

  // start match
  gameLoop(roomName);
}

export async function handleJoinRoom(
  socket: WSocket,
  message: SocketMessageType
) {
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
    default:
      // for tournament games
      return handleSpecificGame(socket, message.room);
  }
}

export function leaveGamePage(socket: WSocket) {
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
