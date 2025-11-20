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
import { WSocket } from './WSocket/index.js';

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
    async (webSocket, request: FastifyRequest) => {
      const socket = new WSocket(webSocket);


      socket.onClose(async () => {
        if (!socket.uuid) {
          await authenticateClient(socket, request);
        }
        socket.lastSeen = new Date(Date.now());
        await runOnCloseHooks(socket);
      });

      socket.onMessage(async (input: Buffer) => {
        if (!socket.uuid) {
          await authenticateClient(socket, request);
        }
        const message = getValidMessage(input, socket);
        await runMessageHandler(socket, message);
      });

      // perform async work after registering event handlers
      // to not drop messages
      try {
        await authenticateClient(socket, request);
        await runOnOpenHooks(socket);
      } catch (error) {
        console.error(`[${socket.uuid}]: error on open: ${error}`);
      }
    }
  );
}

export default fp(roomPlugin, {
  name: 'room-plugin',
});
