import { type WebSocket } from 'ws';
import { type FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import { loadRoomHandlers, getRoomHandler } from './roomHandlerLoader.js';
import { getValidMessage } from './validation.js';
export { type SocketMessage } from './validation.js';
import processClientAuthentication from './authentication.js';
import { decorateSocketInstance } from './socket.js';

/**
 * Main room plugin; handles incoming messages and
 * routes them to the appropriate room handlers
 * @param app Fastify instance
 */
async function roomPlugin(app: FastifyInstance) {
  const handlers = await loadRoomHandlers();

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
          if (!socket.getData()?.uuid) {
            await processClientAuthentication(socket, request);
          }
          const message = getValidMessage(input, socket);
          const handler = getRoomHandler(message.room, handlers);
          await handler(socket, message);
        } catch (error) {
          console.error(
            `[${socket.getData()?.uuid}]: error on message: ${error}`
          );
          socket.sendError(JSON.stringify(error));
        }
      });

      // perform async work after registering event handlers
      // to not drop messages
      await processClientAuthentication(socket, request);
    }
  );
}

export default fp(roomPlugin, {
  name: 'room-plugin',
});
