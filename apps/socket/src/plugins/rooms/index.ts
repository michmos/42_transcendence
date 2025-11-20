import { type WebSocket } from 'ws';
import { type FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import {
  loadRoomHandlers,
  runOnStartupHooks,
  runOnCloseHooks,
  runOnOpenHooks,
  runMessageHandler,
} from './roomHandlerLoader.js';
import { getValidMessage } from './validation.js';
export { type SocketMessage } from './validation.js';
import { authenticateClient } from './authentication.js';
import { decorateSocketInstance } from './socket.js';

/**
 * Main room plugin; handles incoming messages and
 * routes them to the appropriate room handlers
 * @param app Fastify instance
 */
async function roomPlugin(app: FastifyInstance) {
  await loadRoomHandlers();
  await runOnStartupHooks();

  app.get(
    '/',
    { websocket: true },
    async (unextendedSocket, request: FastifyRequest) => {
      const socket = unextendedSocket as WebSocket;

      // on open
      console.log(`new client connected`);
      decorateSocketInstance(socket);
      socket.upsertData({ connected: true });

      socket.on('close', async () => {
        console.log(`[${socket.getData()?.uuid}]: connection closed`);
        socket.upsertData({ connected: false, lastSeen: new Date(Date.now()) });
        try {
          if (!socket.getData()?.uuid) {
            await authenticateClient(socket, request);
          }
          await runOnCloseHooks(socket);
        } catch (error) {
          console.error(
            `[${socket.getData()?.uuid}]: error on close: ${error}`
          );
        }
      });

      socket.on('message', async (input: Buffer) => {
        console.log(`[${socket.getData()?.uuid}]: new message`);
        try {
          if (!socket.getData()?.uuid) {
            await authenticateClient(socket, request);
          }
          const message = getValidMessage(input, socket);
          await runMessageHandler(socket, message);
        } catch (error) {
          console.error(
            `[${socket.getData()?.uuid}]: error on message: ${error}`
          );
          socket.sendError(JSON.stringify(error)); // TODO: send default error back to client instead
        }
      });

      // perform async work after registering event handlers
      // to not drop messages
      try {
        await authenticateClient(socket, request);
        await runOnOpenHooks(socket);
      } catch (error) {
        console.error(`[${socket.getData()?.uuid}]: error on open: ${error}`);
      }
    }
  );
}

export default fp(roomPlugin, {
  name: 'room-plugin',
});
