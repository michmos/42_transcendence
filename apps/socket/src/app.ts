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
  ballPaused: boolean;
  leftY: number;
  rightY: number;
  gamePaused: boolean;
  leftScore: number;
  rightScore: number;
};

const gameState: GameState = {
  paddleWidth: 10,
  paddleHeight: 100,
  ballX: 400,
  ballY: 300,
  ballSpeedX: 2,
  ballPaused: false,
  leftY: 250,
  rightY: 250,
  gamePaused: false,
  leftScore: 0,
  rightScore: 0,
};

type ClientRecord = {
	clientId: string;
	webSocket: any | null;
}

const clientsById = new Map<string, ClientRecord>();
const socketToClientId = new Map<any, string>();

function attatchClient(clientId: string, webSocket: any): ClientRecord {
	if (clientsById.has(clientId)) {
		const record = clientsById.get(clientId)!;
		record.webSocket = webSocket;
		clientsById.set(clientId, record);
		socketToClientId.set(webSocket, clientId);
		return (record)
	}
	const record: ClientRecord = {
		clientId,
		webSocket,
	}
	clientsById.set(clientId, record);
	socketToClientId.set(webSocket, clientId);
	return (record);
}


function updateGame()
{
	if (gameState.gamePaused)
		return
	
	if (!gameState.ballPaused)
		gameState.ballX -= gameState.ballSpeedX;
	
	if (gameState.ballX <= 0 || gameState.ballX >= canvasWidth - ballSize) {
		
		if (gameState.ballX <= 0)
			gameState.rightScore++;
		else
			gameState.leftScore++;

		gameState.ballX = (canvasWidth / 2) - (ballSize / 2);
		gameState.ballY = (canvasHeight / 2) - (ballSize / 2);
		gameState.ballSpeedX = gameState.ballSpeedX > 0 ? -2 : 2;
		gameState.ballPaused = true;

		setTimeout(() => {
			gameState.ballPaused = false;
		}, 1000);

	}

	// Left paddle collision
	if (gameState.ballX <= gameState.paddleWidth 
		&& gameState.ballY + ballSize >= gameState.leftY
		&& gameState.ballY <= gameState.leftY + gameState.paddleHeight) {
			gameState.ballSpeedX *= -1;
	}

	// Right paddle collision
	if (gameState.ballX + ballSize >= canvasWidth - gameState.paddleWidth 
		&& gameState.ballY + ballSize >= gameState.rightY
		&& gameState.ballY <= gameState.rightY + gameState.paddleHeight) {
			gameState.ballSpeedX *= -1;
	}

}

// Global game update loop - runs once for the entire server
setInterval(() => {
  updateGame();
  const data = JSON.stringify({ type: 'state', timestamp: Date.now(), ...gameState});
  
  // Send to all connected clients
  for (const record of clientsById.values()) {
    if (record.webSocket) {
      try {
        record.webSocket.send(data);
      } catch (error) {
        // Handle send errors - client might have disconnected
        console.log('Error sending to client:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }
}, 1000 / 60);

app.register(async function (fastify) {
  fastify.get('/', { websocket: true }, (socket) => {
    console.log('Client connected');

    socket.on('message', (message: Buffer) => {
      console.log('message from client:', message.toString());
	  try {
		const input = JSON.parse(message.toString());
		// console.log(input);
		if (!gameState.gamePaused) {
			if (input.left === 'up' && gameState.leftY > 0)
				gameState.leftY -= 5;
			if (input.left === 'down' && gameState.leftY < 600 - gameState.paddleHeight)
				gameState.leftY += 5;
			if (input.right === 'up' && gameState.rightY > 0)
				gameState.rightY -= 5;
			if (input.right === 'down' && gameState.rightY < 600 - gameState.paddleHeight)
				gameState.rightY += 5;
		}
		if (input.game === 'pause')
			gameState.gamePaused = !gameState.gamePaused;

		if (input.type === 'hello') {
			const clientId = input.clientId || (`anon-${Math.random().toString(36).slice(2, 10)}`);
			const record = attatchClient(clientId, socket);
			socket.send(JSON.stringify({ type: 'id', clientId: record.clientId }))
			console.log(`Client "${clientId}" says hello`);
		}
	  } catch {}
    });

    socket.on('close', () => {
      // Clean up client from maps when socket closes
      const clientId = socketToClientId.get(socket);
      if (clientId) {
        console.log(`Client "${clientId}" disconnected`);
        clientsById.delete(clientId);
        socketToClientId.delete(socket);
      }
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
