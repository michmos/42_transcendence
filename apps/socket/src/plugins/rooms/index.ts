import { type WebSocket } from 'ws';
import fp from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import RoomManager from './RoomManager/index.js';
import fs from 'fs';
import path from 'path';

const SocketMetadata = new WeakMap<WebSocket, any>();

/**
 * Schema for incoming socket messages
 */
const SocketMessage = z.object({
  type: z.enum(['join-room', 'leave-room', 'message']),
  room: z.string().regex(/^[a-zA-Z0-9]+(:[a-zA-Z0-9_-]+)?$/),
  data: z.any().optional(),
});
export type SocketMessage = z.infer<typeof SocketMessage>;

/**
 * Decorates the WebSocket instance with room management methods
 */
export function decorateSocketInstance(socket: WebSocket) {
  socket.join = (name: string) => RoomManager.joinRoom(socket, name);
  socket.leave = (name: string) => RoomManager.leaveRoom(socket, name);
  socket.leaveAll = () => RoomManager.leaveAllRooms(socket);
  socket.setData = (data: any) => SocketMetadata.set(socket, data);
  socket.getData = () => SocketMetadata.get(socket);
  socket.isIn = (name: string) => RoomManager.get(name)?.has(socket) === true;
}

/**
 * Registers all room Handlers, i.e.
 * stores their default export as a callback mapped to their directory name
 */
async function loadRoomHandlers() {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);

  const roomsDir = path.resolve(__dirname, '../../roomNs');
  const rooms = fs.readdirSync(roomsDir);
  const roomHandlers: Record<string, Function> = {};

  for (const room of rooms) {
    const roomName = room;
    try {
      const module = await import(`${roomsDir}/${roomName}/index.js`);
      roomHandlers[roomName] = module.default;
      console.info(`☑️ Handler: ${roomName} loaded`);
    } catch (error) {
      console.warn(`❌ Handler: ${roomName} couldn't be loaded: `, error);
    }
  }
  return roomHandlers;
}

/**
 * Main room plugin; handles incoming messages and
 * routes them to the appropriate room handlers
 * @param app Fastify instance
 *
 */
async function roomPlugin(app: FastifyInstance) {
  console.info('⚙️  Auto-loading room handlers...');
  const roomHandlers = await loadRoomHandlers();

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
      const parsedMessage = SocketMessage.safeParse(input.toString());
      if (!parsedMessage.success) {
        throw new Error('Invalid message format');
      }
      const message = parsedMessage.data;
      // roomNamespace can't be undefined since zod validation ensures it matches the regex
      const roomNamespace = message.room.split(':')[0] as string;
      const handler = roomHandlers[roomNamespace];
      if (!handler) {
        throw new Error(`Invalid room namespace provided: ${roomNamespace}`);
      }
      try {
        await handler(socket, message);
      } catch (error) {
        console.error(
          `Error handling message in room ${roomNamespace}:`,
          error
        );
        // TODO: handle error
      }
    });
  });
}

export default fp(roomPlugin, {
  name: 'room-plugin',
});
