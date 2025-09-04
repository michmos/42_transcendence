import { env } from './env.js';

import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const app = Fastify({ logger: { level: 'error' } });

app.register(fastifyWebsocket);

app.register(async function (fastify) {
  fastify.get('/', { websocket: true }, (socket) => {
    console.log('Client connected');
    socket.on('message', (message: Buffer) => {
      console.log('message from client:', message.toString());
    });

    // Send message every 1 second
    const interval = setInterval(() => {
      const data = JSON.stringify({ type: 'ping', timestamp: Date.now() });
      socket.send(data);
    }, 1000);

    socket.on('close', () => {
      clearInterval(interval);
    });
  });
});

await app.listen({ port: env.SOCKET_PORT, host: '0.0.0.0' });

console.info(
  '🌐 Socket server started on port',
  env.SOCKET_PORT,
  'with cors url',
  env.SOCKET_URL
);
