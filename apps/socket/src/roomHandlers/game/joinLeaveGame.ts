import { type SocketMessageType } from '../../plugins/rooms/index.js';
import { RoomManager, WSocket } from '../../plugins/rooms/WSocket/index.js';
import { updateGameRoomData, type GameRoomData } from './index.js';
import { asyncGameLoop, type GameState } from './game.js';
import { env } from '../../env.js';
import { type MatchParticipantsResponse } from 'types';
import { API } from '../../plugins/api/index.js';

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

  RoomManager.get(newRoomName)?.broadcast(
    JSON.stringify({
      event: 'room-created',
      uuid: newRoomName,
    })
  );

  // start match
  console.log(
    `starting online game: ${newRoomName} between ${socket.uuid} and ${otherSocket.uuid}`
  );
  const finalGameData = await asyncGameLoop(newRoomName);
  console.log(
    `online game ended: ${newRoomName} between ${socket.uuid} and ${otherSocket.uuid}`
  );
  // post to API
  await API.postFinishedOnlineMatch(finalGameData);
}

async function handleJoinLocalGame(socket: WSocket) {
  const newRoomName = `game:${lastGameId}`;
  lastGameId++;

  // join room
  socket.join(newRoomName);

  // delay to load event listiners on frontend
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // send roles
  sendRole(socket, newRoomName, 'local');

  // update room data
  updateGameRoomData(newRoomName, {
    player1Uuid: socket.uuid,
    isLocalGame: true,
  });

  // add to match map
  socketToGameroom.set(socket, newRoomName);

  // notify clients
  socket.send(
    JSON.stringify({
      event: 'room-created',
      uuid: newRoomName,
    })
  );

  // start match
  console.log(`starting localGame: ${newRoomName} with ${socket.uuid}`);
  await asyncGameLoop(newRoomName);
  console.log(`localGame ended: ${newRoomName} with ${socket.uuid}`);
}

// TODO: add cache expiration
const matchParticipantsCache = new Map<string, MatchParticipantsResponse>();

async function getMatchParticipants(matchUuid: string) {
  if (matchParticipantsCache.has(matchUuid)) {
    const participants = matchParticipantsCache.get(matchUuid)!;
    matchParticipantsCache.delete(matchUuid);
    return participants;
  }

  const participants = await API.fetchMatchParticipants(matchUuid);
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
  socket.join(roomName);
  socket.consoleLog(`joined tournament match game room: ${roomName}`);
  socketToGameroom.set(socket, roomName);
  if (!room) {
    // opponent not joined yet
    sendRole(socket, roomName, 'player1');
    updateGameRoomData(roomName, {
      player1Uuid: socket.uuid,
      isLocalGame: false,
    });
    return;
  } else {
    // opponent joined
    sendRole(socket, roomName, 'player2');
    updateGameRoomData(roomName, { player2Uuid: socket.uuid });
  }

  // notify clients
  RoomManager.get(roomName)?.broadcast(
    JSON.stringify({
      event: 'room-created',
      uuid: roomName,
    })
  );

  // start match
  console.log(`starting online Game: ${roomName}`);
  const finalGameData = await asyncGameLoop(roomName);
  console.log(`online Game ended: ${roomName}`);
  // patch to API
  await API.patchFinishedTournamentMatch(finalGameData, matchUuid);
}

export function handleJoinRoom(socket: WSocket, message: SocketMessageType) {
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

function autoForfeit(
  socket: WSocket,
  gameData: GameRoomData,
  roomName: string
) {
  // updat game state -> auto-forfeit
  const isLeftPlayer: boolean =
    gameData.player1Uuid === socket.uuid ? true : false;

  updateGameRoomData(roomName, {
    currentGameState: {
      ...gameData.currentGameState,
      gameOver: true,
      leftScore: isLeftPlayer ? 0 : 10,
      rightScore: isLeftPlayer ? 10 : 0,
    },
  });
  socket.consoleLog(`auto-forfeited the game ${roomName}`);
}

export function leaveGamePage(socket: WSocket) {
  // remove from waitlist if on there
  const waitingListIndex = waitingList.findIndex((v) => v === socket);
  if (waitingListIndex > -1) {
    waitingList.splice(waitingListIndex, 1);
    socket.consoleLog('socket removed from waitinglist');
  }

  // remove from game if in there
  const gameRoomName = socketToGameroom.get(socket);
  if (gameRoomName) {
    const gameData = RoomManager.getDataOrThrow(gameRoomName) as GameRoomData;
    if (!gameData.currentGameState.gameOver) {
      autoForfeit(socket, gameData, gameRoomName);
    }
    socketToGameroom.delete(socket);
    socket.leave(gameRoomName);
    socket.consoleLog('socket removed from game');
  }
}
