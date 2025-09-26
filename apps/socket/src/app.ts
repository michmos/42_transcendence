import { env } from './env.js';

import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const app = Fastify({ logger: { level: 'error' } });

app.register(fastifyWebsocket);

const ROLE_EXPIRATION = 5000

const canvasWidth = 800;
const canvasHeight = 600;
const ballSize = 10;

type GameState = {
  paddleWidth: number;
  paddleHeight: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
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
  ballSpeedX: 3,
  ballSpeedY: 3,
  ballPaused: false,
  leftY: 250,
  rightY: 250,
  gamePaused: false,
  leftScore: 0,
  rightScore: 0,
};

type ClientRecord = {
	clientId: string;
	role: 'local' | 'player1' | 'player2' | 'spectator';
	webSocket: any | null;
	connected: boolean;
	lastSeen: number;
}

const clientRecords = new Map<string, ClientRecord>();
const socketToClientId = new Map<any, string>();

function removeExpiredRoles() {
	const now = Date.now();
	for (const [clientId, record] of clientRecords.entries()) {
		if (!record.connected && (now - record.lastSeen) > ROLE_EXPIRATION) {
			if (record.role === 'player1' || record.role ===  'player2')
				console.log(`Client-${clientId} removed; role "${record.role}" availible`)
			clientRecords.delete(clientId);
		}
	}
}

setInterval(removeExpiredRoles, (ROLE_EXPIRATION / 2));

function assignRole(): 'local' | 'player1' | 'player2' | 'spectator' {
	const connectedClients = Array.from(clientRecords.values()).filter(r => r.connected);
	const usedRoles = new Set(Array.from(clientRecords.values()).map(r => r.role));

	if (connectedClients.length === 0) {
		return ('local');
	}
	if (connectedClients.length > 0 && connectedClients.every(r => r.role === 'local')) {
		return ('player2');
	}
	if(!usedRoles.has('player1')) {
		return ('player1');
	}
	if(!usedRoles.has('player2')) {
		return ('player2');
	}
	return ('spectator')
}

function convertLocal() {
    // Find the first local player and convert them to player1
    for (const [clientId, record] of clientRecords.entries()) {
        if (record.connected && record.role === 'local') {
            record.role = 'player1';
            clientRecords.set(clientId, record);
            
            // Notify the client about their role change
            if (record.webSocket) {
                record.webSocket.send(JSON.stringify({ 
                    type: 'role', 
                    role: 'player1', 
                    clientId: record.clientId 
                }));
            }
            console.log(`Client-${clientId} converted from local to player1`);
            break; // Only convert the first one
        }
    }
}

function convertPlayer1() {
    // Find player1 and convert them back to local
    for (const [clientId, record] of clientRecords.entries()) {
        if (record.connected && record.role === 'player1') {
            record.role = 'local';
            clientRecords.set(clientId, record);
            
            // Notify the client about their role change
            if (record.webSocket) {
                record.webSocket.send(JSON.stringify({ 
                    type: 'role', 
                    role: 'local', 
                    clientId: record.clientId 
                }));
            }
            console.log(`Client-${clientId} converted from player1 back to local`);
            break;
        }
    }
}

function attatchClient(clientId: string, webSocket: any): ClientRecord {
	const now = Date.now();
	if (clientRecords.has(clientId)) {
		const record = clientRecords.get(clientId)!;
		record.webSocket = webSocket;
		record.connected = true;
		record.lastSeen = now;
		clientRecords.set(clientId, record);
		socketToClientId.set(webSocket, clientId);
		return (record)
	}

	const role = assignRole();
	const record: ClientRecord = {
		clientId,
		role,
		webSocket,
		connected: true,
		lastSeen : now,
	}

    if (role === 'player2') {
        convertLocal();
    }

	clientRecords.set(clientId, record);
	socketToClientId.set(webSocket, clientId);
	return (record);
}


function updateGame()
{
	if (gameState.gamePaused)
		return
	
	if (!gameState.ballPaused) {
		gameState.ballX -= gameState.ballSpeedX;
		gameState.ballY -= gameState.ballSpeedY;
	}
	
	if (gameState.ballX <= 0 || gameState.ballX >= canvasWidth - ballSize) {
		
		if (gameState.ballX <= 0)
			gameState.rightScore++;
		else
			gameState.leftScore++;

		gameState.ballX = (canvasWidth / 2) - (ballSize / 2);
		gameState.ballY = (canvasHeight / 2) - (ballSize / 2);
		gameState.ballSpeedX = gameState.ballSpeedX > 0 ? -gameState.ballSpeedX : gameState.ballSpeedX; //reverse direction after scoring a point
		gameState.ballPaused = true;

		setTimeout(() => {
			gameState.ballPaused = false;
		}, 1000);

	}

	// Top and bottom collision
	if (gameState.ballY <= 0 || gameState.ballY >= canvasHeight - ballSize) {
		gameState.ballSpeedY *= -1;
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
  for (const record of clientRecords.values()) {
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
	// console.log('Client connected');

    socket.on('message', (message: Buffer) => {
      console.log('message from client:', message.toString());
	  try {
		const input = JSON.parse(message.toString());
		// console.log(input);

		if (input.type === 'connect') {
			const clientId = input.clientId || (`anon-${Math.random().toString(36).slice(2, 10)}`);
			const record = attatchClient(clientId, socket);
			socket.send(JSON.stringify({ type: 'role', role: record.role, clientId: record.clientId }))
			console.log(`Client-${record.clientId} connected at ${new Date(record.lastSeen).toLocaleString()} as "${record.role}"`);
		}

		const record = clientRecords.get(socketToClientId.get(socket)!);
		if (!record)
			return;

		if (!gameState.gamePaused) {
			// if (input.left === 'up' && record.role === 'player1' && gameState.leftY > 0)
			// 	gameState.leftY -= 5;
			// if (input.left === 'down' && record.role === 'player1' && gameState.leftY < 600 - gameState.paddleHeight)
			// 	gameState.leftY += 5;
			// if (input.right === 'up' && record.role === 'player2' && gameState.rightY > 0)
			// 	gameState.rightY -= 5;
			// if (input.right === 'down' && record.role === 'player2' && gameState.rightY < 600 - gameState.paddleHeight)
			// 	gameState.rightY += 5;
			if (input.action === 'up' && (record.role === 'player1' || record.role === 'local') && gameState.leftY > 0)
				gameState.leftY -= 5;
			if (input.action === 'down' && (record.role === 'player1' || record.role === 'local') && gameState.leftY < 600 - gameState.paddleHeight)
				gameState.leftY += 5;
			if (input.action === 'up' && record.role === 'player2' && gameState.rightY > 0)
				gameState.rightY -= 5;
			if (input.action === 'down' && record.role === 'player2' && gameState.rightY < 600 - gameState.paddleHeight)
				gameState.rightY += 5;
			if (input.right === 'up' && record.role === 'local' && gameState.rightY > 0)
				gameState.rightY -= 5;
			if (input.right === 'down' && record.role === 'local' && gameState.rightY < 600 - gameState.paddleHeight)
				gameState.rightY += 5;
		}
		if (input.game === 'pause' && (record.role === 'player1' || record.role === 'player2'))
			gameState.gamePaused = !gameState.gamePaused;

	  } catch {}
    });

    socket.on('close', () => {
      // Clean up client from maps when socket closes
      const clientId = socketToClientId.get(socket);
      if (clientId) {
		const record = clientRecords.get(clientId);
		if (record) {
			const wasPlayer2 = record.role === 'player2'; // Track if this was player2
			
			record.webSocket = null;
			record.connected = false;
			record.lastSeen = Date.now();
			clientRecords.set(clientId, record);
			if (record.role === 'spectator') {
				console.log(`Client-${clientId} disconnected`);
				clientRecords.delete(clientId);
			}
			else
				console.log(`Client-${clientId} disconnected; role "${record.role}" reserved for ${(ROLE_EXPIRATION / 1000)}s`);
			// If player2 disconnected, convert player1 back to local
            if (wasPlayer2) {
                convertPlayer1();
            }
		}
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
