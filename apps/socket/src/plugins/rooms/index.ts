import { type WebSocket } from 'ws';
import fp from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import RoomManager from './RoomManager/index.js';
import getHandler from './roomHandlerLoader.js';
import { getValidMessage } from './validation.js';
export { type SocketMessage } from './validation.js';

const SocketToData = new WeakMap<WebSocket, SocketMetaData>();
type SocketMetaData = {
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
  socket.setData = (data: Partial<SocketMetaData>) => {
    SocketToData.set(socket, data);
  };
  socket.getData = () => SocketToData.get(socket);
  socket.isIn = (name: string) => RoomManager.get(name)?.has(socket) === true;
}

/**
 * Main room plugin; handles incoming messages and
 * routes them to the appropriate room handlers
 * @param app Fastify instance
 *
 */
async function roomPlugin(app: FastifyInstance) {
  app.get('/', { websocket: true }, (unextendedSocket) => {
    const socket = unextendedSocket as WebSocket;

    socket.on('open', () => {
      decorateSocketInstance(socket);
      socket.join('all');
    });

    socket.on('close', () => {
      socket.leaveAll();
      // socketMetadata garbage collected since WEAKmap
    });

    socket.on('message', async (input: Buffer) => {
      try {
        const message = getValidMessage(input, socket);
        const handler = await getHandler(message.room);
        await handler(socket, message);
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
