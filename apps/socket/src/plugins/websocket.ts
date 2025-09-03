import type { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

export default async function (app: FastifyInstance): Promise<void> {
  app.register(fastifyWebsocket);
  app.register(async function (fastify) {
    fastify.get('/websocket', { websocket: true }, (socket) => {
      console.log('Client connected');
      socket.on('message', (message: Buffer) => {
        console.log('message from client:', message.toString());
        socket.send('hi from server');
      });

      // Send mesage every 1 second
      const interval = setInterval(() => {
        socket.send('ping from server');
      }, 1000);

      socket.on('close', () => {
        clearInterval(interval);
      });
    });
  });
}
