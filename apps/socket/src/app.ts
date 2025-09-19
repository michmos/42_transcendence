import { env } from './env.js';

import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const app = Fastify({ logger: { level: 'error' } });

app.register(fastifyWebsocket);

const canvasWidth = 800;
const canvasHeight = 600;
const ballSize = 10;

type GameState = {
  paddleWidth: number;
  paddleHeight: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  leftY: number;
  rightY: number;
  paused: boolean;
};

const gameState: GameState = {
  paddleWidth: 10,
  paddleHeight: 100,
  ballX: 400,
  ballY: 300,
  ballSpeedX: 3,
  leftY: 250,
  rightY: 250,
  paused: false,
};

function updateGame()
{
	if (gameState.paused)
		return
	
	gameState.ballX -= gameState.ballSpeedX;
	
	if (gameState.ballX <= 0 || gameState.ballX >= canvasWidth - ballSize) {
		// gameState.ballSpeedX *= -1;
		gameState.ballX = canvasWidth / 2;
		gameState.ballY = canvasHeight / 2;
	}

	if (gameState.ballX <= gameState.paddleWidth 
		&& gameState.ballY + ballSize >= gameState.leftY
		&& gameState.ballY <= gameState.leftY + gameState.paddleHeight) {
			gameState.ballSpeedX *= -1;
	}

	if (gameState.ballX + ballSize >= canvasWidth - gameState.paddleWidth 
		&& gameState.ballY + ballSize >= gameState.rightY
		&& gameState.ballY <= gameState.rightY + gameState.paddleHeight) {
			gameState.ballSpeedX *= -1;
	}

}

app.register(async function (fastify) {
  fastify.get('/', { websocket: true }, (socket) => {
    console.log('Client connected');

    socket.on('message', (message: Buffer) => {
      console.log('message from client:', message.toString());
	  try {
		const input = JSON.parse(message.toString());
		console.log(input);
		if (input.left === 'up' && gameState.leftY > 0)
			gameState.leftY -= 5;
		if (input.left === 'down' && gameState.leftY < 600 - gameState.paddleHeight)
			gameState.leftY += 5;
		if (input.right === 'up' && gameState.rightY > 0)
			gameState.rightY -= 5;
		if (input.right === 'down' && gameState.rightY < 600 - gameState.paddleHeight)
			gameState.rightY += 5;
		if (input.game === 'pause')
			gameState.paused = !gameState.paused;

	  } catch {}
    });

	// Send gamestate every 60th of a second (60fps)
    const gameUpdate = setInterval(() => {
	  updateGame();
      const data = JSON.stringify({ type: 'state', timestamp: Date.now(), ...gameState});
	  socket.send(data);
    }, 1000 / 60); 

    socket.on('close', () => {
    //   clearInterval(interval);
	  clearInterval(gameUpdate);
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
