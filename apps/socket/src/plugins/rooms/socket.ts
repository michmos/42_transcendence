import RoomManager from './RoomManager/index.js';
import { type WebSocket } from 'ws';

const UuidToSocket = new Map<string, WebSocket>();
const SocketToData = new Map<WebSocket, SocketMetaData>();

export type SocketMetaData = {
  uuid?: string;
  jwt?: string;
  lastSeen?: Date;
  connected?: boolean;
};

/**
 * Relates the new socket to old connections of the same client
 */
function upsertClientConnectionData(
  newSocket: WebSocket,
  uuid: string,
  jwt: string
) {
  // remove old socket
  const oldSocket = UuidToSocket.get(uuid);
  if (oldSocket) {
    SocketToData.delete(oldSocket);

    // update socket in room manager
    RoomManager.updateSocket(oldSocket, newSocket);
  }

  // update UuidToSocket
  UuidToSocket.set(uuid, newSocket);

  // add uuid
  newSocket.upsertData({ uuid, jwt });
}

/**
 * Decorates the WebSocket instance with room management methods
 */
export function decorateSocketInstance(socket: WebSocket) {
  // room operations
  socket.join = (name: string) => RoomManager.joinRoom(socket, name);
  socket.leave = (name: string) => RoomManager.leaveRoom(socket, name);
  socket.leaveAll = () => RoomManager.leaveAllRooms(socket);
  socket.isInRoom = (name: string) =>
    RoomManager.get(name)?.has(socket) === true;

  // data operations
  socket.upsertData = (overrides: Partial<SocketMetaData>): SocketMetaData => {
    const data = SocketToData.get(socket);
    const newData = { ...data, ...overrides };
    SocketToData.set(socket, newData);
    return newData;
  };
  socket.getData = () => SocketToData.get(socket);

  // communication
  socket.sendSuccess = () => socket.send(JSON.stringify({ status: 'success' }));
  socket.sendError = (message: string = 'Error occurred') =>
    socket.send(JSON.stringify({ status: 'error', message }));

  // general
  socket.isOnline = () => socket.getData()?.connected === true;
  socket.updateConnection = (uuid: string, jwt: string) =>
    upsertClientConnectionData(socket, uuid, jwt);
}
