import { type WebSocket } from 'ws';
import { type FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import RoomManager from './RoomManager/index.js';
import getHandler from './roomHandlerLoader.js';
import { getValidMessage } from './validation.js';
export { type SocketMessage } from './validation.js';
import { authenticateClient } from './authentication.js';

const UuidToSocket = new Map<string, WebSocket>();
const SocketToData = new Map<WebSocket, SocketMetaData>();

export type SocketMetaData = {
  uuid?: string;
  lastSeen?: Date;
  connected?: boolean;
};

/**
 * Decorates the WebSocket instance with room management methods
 */
export function decorateSocketInstance(socket: WebSocket) {
  socket.join = (name: string) => RoomManager.joinRoom(socket, name);
  socket.leave = (name: string) => RoomManager.leaveRoom(socket, name);
  socket.leaveAll = () => RoomManager.leaveAllRooms(socket);
  socket.upsertData = (overrides: Partial<SocketMetaData>): SocketMetaData => {
    const data = SocketToData.get(socket);
    const newData = { ...data, ...overrides };
    SocketToData.set(socket, newData);
    return newData;
  };
  socket.getData = () => SocketToData.get(socket);
  socket.isInRoom = (name: string) =>
    RoomManager.get(name)?.has(socket) === true;
  socket.isOnline = () => socket.getData()?.connected === true;
  socket.sendSuccess = () => socket.send(JSON.stringify({ status: 'success' }));
  socket.sendError = (message: string = 'Error occurred') =>
    socket.send(JSON.stringify({ status: 'error', message }));
}

/**
 * Relates the new socket to old connections of the same client
 */
function upsertClientConnectionData(newSocket: WebSocket, uuid: string) {
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
  newSocket.upsertData({ uuid });
}

/**
 * Main room plugin; handles incoming messages and
 * routes them to the appropriate room handlers
 * @param app Fastify instance
 */
async function roomPlugin(app: FastifyInstance) {
  app.get(
    '/',
    { websocket: true },
    async (unextendedSocket, request: FastifyRequest) => {
      const socket = unextendedSocket as WebSocket;

      // on open
      console.log(`new client connected`);
      decorateSocketInstance(socket);
      socket.upsertData({ connected: true });
      socket.join('all');

      socket.on('close', () => {
        console.log(`[${socket.getData()?.uuid}]: connection closed`);
        socket.upsertData({ connected: false, lastSeen: new Date(Date.now()) });
      });

      socket.on('message', async (input: Buffer) => {
        console.log(`[${socket.getData()?.uuid}]: new message`);
        try {
          const message = getValidMessage(input, socket);
          const handler = await getHandler(message.room);
          await handler(socket, message);
        } catch (error) {
          console.error(
            `[${socket.getData()?.uuid}]: error on message: ${error}`
          );
          socket.send(JSON.stringify(error));
        }
      });

      // perform async work after registering event handlers
      // to not drop messages
      if (request.headers.cookie) {
        try {
          const uuid = await authenticateClient(
            request.headers.cookie,
            'localhost:5173' // TODO: hardcoded - should be app.hostname or sth
          );
          upsertClientConnectionData(socket, uuid);
        } catch (error) {
          console.error(`Authentication error: ${error}`);
        }
      }
    }
  );
}

export default fp(roomPlugin, {
  name: 'room-plugin',
});
