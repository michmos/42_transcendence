import { type WebSocket } from 'ws';
import fp from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import RoomManager from './RoomManager/index.js';
import getHandler from './roomHandlerLoader.js';
import { getValidMessage } from './validation.js';
export { type SocketMessage } from './validation.js';
import { authenticateWithToken } from './authentication.js';

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
  socket.upsertData = (overrides: Partial<SocketMetaData>) => {
    const data = SocketToData.get(socket);
    SocketToData.set(socket, { ...data, ...overrides });
  };
  socket.getData = () => SocketToData.get(socket);
  socket.isIn = (name: string) => RoomManager.get(name)?.has(socket) === true;
  socket.isOnline = () => socket.getData()?.connected === true;
}

/**
 * Relates the new socket to old connections of the same client
 */
function upsertSocketData(newSocket: WebSocket, uuid: string) {
  // update uuid to socket
  UuidToSocket.delete(uuid);
  UuidToSocket.set(uuid, newSocket);

  // add uuid
  newSocket.upsertData({ uuid });

  // remove old socket
  const oldSocket = UuidToSocket.get(uuid);
  if (oldSocket) {
    SocketToData.delete(oldSocket);

    // update socket in room manager
    RoomManager.updateSocket(oldSocket, newSocket);
  }
}

/**
 * Main room plugin; handles incoming messages and
 * routes them to the appropriate room handlers
 * @param app Fastify instance
 */
async function roomPlugin(app: FastifyInstance) {
  app.get('/', { websocket: true }, (unextendedSocket) => {
    const socket = unextendedSocket as WebSocket;

    decorateSocketInstance(socket);
    console.log(`new client connected`);
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
        if (message.type === 'identify') {
          const uuid = await authenticateWithToken(message.JWT, 'localhost'); // TODO: hostname shouldnt be hardcoded
          upsertSocketData(socket, uuid);
        } else {
          const handler = await getHandler(message.room);
          await handler(socket, message);
        }
      } catch (error) {
        console.error(`socket.on message error: ${error}`);
        socket.send(JSON.stringify(error));
      }
    });
  });
}

export default fp(roomPlugin, {
  name: 'room-plugin',
});
