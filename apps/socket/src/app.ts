import { env } from './env.js';

import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const app = Fastify({ logger: { level: 'error' } });

app.register(fastifyWebsocket);

const ROLE_EXPIRATION = 8000;
const PING = 1000;
const PING_TIMEOUT = 5000;
const PADDLE_SEGMENTS = 21;
const GAME_TIME = 5;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BALL_SIZE = 10;
let gameSpeed = 1;
let baseGameSpeed = 1;
let bounceCount = 0;

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
  gameOver: boolean;
  aiEnabled: boolean;
  timeRemaining: number;
  gameStartTime: number | null;
};

const gameState: GameState = {
  paddleWidth: 10,
  paddleHeight: 100,
  ballX: CANVAS_WIDTH / 2,
  ballY: CANVAS_HEIGHT / 2,
  ballSpeedX: 6,
  ballSpeedY: 0,
  ballPaused: false,
  leftY: 250,
  rightY: 250,
  gamePaused: true,
  leftScore: 0,
  rightScore: 0,
  gameOver: false,
  aiEnabled: false,
  timeRemaining: GAME_TIME * 60 * 1000,
  gameStartTime: null,
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
		// console.log(record.role, now - record.lastSeen)
		if (!record.connected && (now - record.lastSeen) > PING_TIMEOUT && (now - record.lastSeen) < PING_TIMEOUT + PING) {
			console.log(`Client-${clientId} timed out (no input for ${now - record.lastSeen}ms)`)
			record.connected = false;
			record.webSocket = null;
		}
		if (!record.connected && (now - record.lastSeen) > ROLE_EXPIRATION) {
			if (record.role === 'player1' || record.role ===  'player2') {
				console.log(`Client-${clientId} role "${record.role}" expired and available`);
				if (record.role === 'player1') {
					convertPlayer(2);
				} else if (record.role === 'player2') {
					convertPlayer(1);
				}
			} else if (record.role === 'local') {
				console.log(`Client-${clientId} has left the game`)
				resetGame();
			}
			clientRecords.delete(clientId);
		}
	}

	// for (const [clientId, record] of clientRecords.entries()) {
	// 	if (!record.connected && (now - record.lastSeen) > ROLE_EXPIRATION) {
	// 		if (record.role === 'player1' || record.role ===  'player2')
	// 			console.log(`Client-${clientId} removed; role "${record.role}" available`)
	// 		clientRecords.delete(clientId);
	// 	}
	// }
}

setInterval(removeExpiredRoles, (PING));

function resetGame() {
	gameState.paddleHeight = 100;
	gameState.gamePaused = true;
	gameState.leftScore = 0;
	gameState.rightScore = 0;
	gameState.gameOver = false;
	gameState.ballX = CANVAS_WIDTH / 2;
	gameState.ballY = CANVAS_HEIGHT / 2;
	gameState.leftY = 250;
	gameState.rightY= 250,
	gameSpeed = 1;
	baseGameSpeed = 1;
	bounceCount = 0;
	resetTimer();
}

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

function convertPlayer(player: number) {
    // Find player1 and convert them back to local
    for (const [clientId, record] of clientRecords.entries()) {
        if (record.connected && record.role === `player${player}`) {
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
            console.log(`Client-${clientId} converted from player${player} to local`);
            break;
        }
    }
}

function attachClient(clientId: string, webSocket: any): ClientRecord {
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
		if (gameState.aiEnabled) {
			console.log('AI disabled')
			gameState.aiEnabled = false;
		}
		convertLocal();
    }

	clientRecords.set(clientId, record);
	socketToClientId.set(webSocket, clientId);
	return (record);
}

function startGameTimer() {
	if (!gameState.gameStartTime) {
		gameState.gameStartTime = Date.now();
	}
}

function updateTimer() {
	if (!gameState.gameStartTime || gameState.gamePaused || gameState.gameOver) {
		return;
	}
	const elapsed = Date.now() - gameState.gameStartTime
	gameState.timeRemaining = Math.max(0, (GAME_TIME * 60 * 1000) - elapsed)
	if (gameState.timeRemaining === 0 && !gameState.gameOver) {
		if (gameState.leftScore === gameState.rightScore) {
			gameState.paddleHeight = 0;
			gameState.leftY = 0;
			gameState.rightY = 0;
		}
		else {
			console.log('GAME OVER - Time\'s up!');
			gameState.gameOver = true;
		}
  	}
}

function resetTimer() {
	gameState.timeRemaining = GAME_TIME * 60 * 1000;
	gameState.gameStartTime = null;
}

const collisionVectors = [
    // Left paddle vector
    {x: -3, y: 7},
	{x: -3, y: 6},
	{x: -3, y: 5},
	{x: -4, y: 4},	// Top
	{x: -4, y: 3},
	{x: -5, y: 3},
	{x: -5, y: 2},

	{x: -6, y: 2},
	{x: -6, y: 1},
	{x: -7, y: 1},
	{x: -7, y: 0},	// Middle
	{x: -7, y: -1},
	{x: -6, y: -1},
	{x: -6, y: -2},

	{x: -5, y: -2},
	{x: -5, y: -3},
	{x: -4, y: -3},
	{x: -4, y: -4},	// Bottom
	{x: -3, y: -5},
	{x: -3, y: -6},
	{x: -3, y: -7},

    // Right paddle vector
    {x: 3, y: 7},
	{x: 3, y: 6},
	{x: 3, y: 5},
	{x: 4, y: 4},	// Top
	{x: 4, y: 3},
	{x: 5, y: 3},
	{x: 5, y: 2},

	{x: 6, y: 2},
	{x: 6, y: 1},
	{x: 7, y: 1},
	{x: 7, y: 0},	// Middle
	{x: 7, y: -1},
	{x: 6, y: -1},
	{x: 6, y: -2},

	{x: 5, y: -2},
	{x: 5, y: -3},
	{x: 4, y: -3},
	{x: 4, y: -4},	// Bottom
	{x: 3, y: -5},
	{x: 3, y: -6},
	{x: 3, y: -7},
];

function getVector(ballY: number, paddleY:number, isLeftPaddle: boolean): {x: number, y:number} {
    
	if (bounceCount === 17 || bounceCount === 20 || bounceCount === 23) {
		if (isLeftPaddle) {
			if (gameState.leftY < CANVAS_HEIGHT / 2 - gameState.paddleHeight / 2)
				return (collisionVectors[0]!)
			else {
				return (collisionVectors[PADDLE_SEGMENTS - 1]!)
			}
		}
		else {
			if (gameState.rightY < CANVAS_HEIGHT / 2 - gameState.paddleHeight / 2)
				return (collisionVectors[PADDLE_SEGMENTS]!)
			else {
				return (collisionVectors[2 * PADDLE_SEGMENTS - 1]!)
			}
		}
	}
	const relativeY = ballY - paddleY;
	const segmentHeight = gameState.paddleHeight / PADDLE_SEGMENTS;

	let segment = Math.floor(relativeY / segmentHeight);
	segment = Math.max(0, Math.min(PADDLE_SEGMENTS - 1, segment));
	// console.log('segment:', segment);

	const vectorIndex = isLeftPaddle ? segment : segment + PADDLE_SEGMENTS;

    return (collisionVectors[vectorIndex]!);
}


function updateGame()
{
	
	if (gameState.gameOver)
		return;

	updateTimer();

	if (gameState.gamePaused)
		return;
	
	if (!gameState.ballPaused) {
		startGameTimer();
		gameState.ballX -= gameState.ballSpeedX * gameSpeed;
		gameState.ballY -= gameState.ballSpeedY * gameSpeed;
	}
	
	if (gameState.ballX <= 0 || gameState.ballX >= CANVAS_WIDTH - BALL_SIZE) {
		
		if (gameState.ballX <= 0)
			gameState.rightScore++;
		else
			gameState.leftScore++;

		let totalScore = gameState.rightScore + gameState.leftScore;
		// console.log(totalScore);
		if ((totalScore + 2) % 3 === 0)
			baseGameSpeed += 0.1;
		baseGameSpeed = Math.min(baseGameSpeed, 1.6);
		
		gameSpeed = baseGameSpeed;
		bounceCount = 0;
		console.log('Score! Base speed:', baseGameSpeed, 'Current speed:', gameSpeed);

		gameState.ballX = (CANVAS_WIDTH / 2) - (BALL_SIZE / 2);
		gameState.ballY = (CANVAS_HEIGHT / 2) - (BALL_SIZE / 2);
		gameState.ballSpeedX = gameState.ballSpeedX > 0 ? -6 : 6;
		gameState.ballSpeedY = Math.random() > 0.5 ? -(Math.random()) : (Math.random());

		// gameState.ballSpeedX = gameState.ballSpeedX > 0 ? -gameState.ballSpeedX : gameState.ballSpeedX; //reverse direction after scoring a point
		gameState.ballPaused = true;

		setTimeout(() => {
			gameState.ballPaused = false;
		}, 1000);
	}

	// Top and bottom collision
	if (gameState.ballY <= 0 || gameState.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
		gameState.ballSpeedY *= -1;
	}

	// Left paddle collision
	if (gameState.ballX <= gameState.paddleWidth 
		&& gameState.ballY + BALL_SIZE >= gameState.leftY
		&& gameState.ballY <= gameState.leftY + gameState.paddleHeight
    	&& gameState.ballY > 0 && gameState.ballY < CANVAS_HEIGHT - BALL_SIZE) {
			// gameState.ballSpeedX *= -1;
			let offset = Math.random() > 0.5 ? -0.1 : 0.1;
			const vector = getVector(gameState.ballY + (BALL_SIZE / 2), gameState.leftY, true);
			gameState.ballSpeedX = vector.x;
			gameState.ballSpeedY = vector.y + offset;
			bounceCount++;
			if (bounceCount >= 10) {
				const bounceSpeedIncrease = (bounceCount - 9) * 0.1;
				gameSpeed = Math.min(baseGameSpeed + bounceSpeedIncrease, 1.6);
			}
			// console.log(gameState.ballSpeedX * gameSpeed);
			console.log('Bounce count:', bounceCount, 'Base speed:', baseGameSpeed, 'Current speed:', gameSpeed);
	}

	// Right paddle collision
	if (gameState.ballX + BALL_SIZE >= CANVAS_WIDTH - gameState.paddleWidth 
		&& gameState.ballY + BALL_SIZE >= gameState.rightY
		&& gameState.ballY <= gameState.rightY + gameState.paddleHeight
    	&& gameState.ballY > 0 && gameState.ballY < CANVAS_HEIGHT - BALL_SIZE) {
			// gameState.ballSpeedX *= -1;
			let offset = Math.random() > 0.5 ? -0.1 : 0.1;
			const vector = getVector(gameState.ballY + (BALL_SIZE / 2), gameState.rightY, false);
			gameState.ballSpeedX = vector.x;
			gameState.ballSpeedY = vector.y + offset;
			bounceCount++;
			if (bounceCount >= 10) {
				const bounceSpeedIncrease = (bounceCount - 9) * 0.1; // +0.1 for each bounce after 10
				gameSpeed = Math.min(baseGameSpeed + bounceSpeedIncrease, 1.6);
			}
			// console.log(gameState.ballSpeedX * gameSpeed);
			console.log('Bounce count:', bounceCount, 'Base speed:', baseGameSpeed, 'Current speed:', gameSpeed);
	}
	if (gameState.aiEnabled) {
		if (gameState.rightY + (gameState.paddleHeight / 2) < gameState.ballY && gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight) {
			gameState.rightY += 4;
		}
		if (gameState.rightY + (gameState.paddleHeight / 2) > gameState.ballY && gameState.rightY > 0) {
			gameState.rightY -= 4;
		}
		// if (gameState.leftY + (gameState.paddleHeight / 2) < gameState.ballY && gameState.leftY < CANVAS_HEIGHT - gameState.paddleHeight) {
		// 	gameState.leftY += 4;
		// }
		// if (gameState.leftY + (gameState.paddleHeight / 2) > gameState.ballY && gameState.leftY > 0) {
		// 	gameState.leftY -= 4;
		// }
	}

	if (gameState.leftScore >= 10 || gameState.rightScore >= 10) {
		console.log('GAME OVER');
		gameState.gameOver = true;
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
    //   console.log('message from client:', message.toString());
		try {
			const input = JSON.parse(message.toString());
			// console.log(input);

			if (input.type === 'connect') {
				const clientId = input.clientId || (`anon-${Math.random().toString(36).slice(2, 10)}`);
				const record = attachClient(clientId, socket);
				socket.send(JSON.stringify({ type: 'role', role: record.role, clientId: record.clientId }))
				console.log(`Client-${record.clientId} connected at ${new Date(record.lastSeen).toLocaleString()} as "${record.role}"`);
			}

			const clientId = socketToClientId.get(socket);
			if (clientId) {
				const record = clientRecords.get(clientId);
				if (record) {
					record.lastSeen = Date.now();
					if (!record.connected) {
						record.connected = true;
						record.webSocket = socket;
						console.log(`Client-${record.clientId} reconnected`);
					}
				}
				else
					return;

				if (!gameState.gamePaused && !gameState.gameOver) {
					if (input.action === 'up' && (record.role === 'player1' || record.role === 'local') && gameState.leftY > 0)
						gameState.leftY -= 5;
					if (input.action === 'down' && (record.role === 'player1' || record.role === 'local') && gameState.leftY < CANVAS_HEIGHT - gameState.paddleHeight)
						gameState.leftY += 5;
					if (input.action === 'up' && record.role === 'player2' && gameState.rightY > 0)
						gameState.rightY -= 5;
					if (input.action === 'down' && record.role === 'player2' && gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight)
						gameState.rightY += 5;
					if (input.right === 'up' && record.role === 'local' && gameState.rightY > 0)
						gameState.rightY -= 5;
					if (input.right === 'down' && record.role === 'local' && gameState.rightY < CANVAS_HEIGHT - gameState.paddleHeight)
						gameState.rightY += 5;
				}
				if (input.game === 'pause' && (record.role === 'local' || record.role === 'player1'|| record.role === 'player2')) {
					gameState.gamePaused = !gameState.gamePaused;
					if (!gameState.gamePaused && gameState.gameStartTime) {
						// Resume timer - adjust start time to account for pause duration
						const pausedDuration = Date.now() - (gameState.gameStartTime + (GAME_TIME * 60 * 1000 - gameState.timeRemaining));
						gameState.gameStartTime += pausedDuration;
					}
					console.log(`Game ${gameState.gamePaused ? 'paused' : 'resumed'}`)
				}
				if (input.game === 'ai' && record.role === 'local') {
					gameState.aiEnabled = !gameState.aiEnabled;
					console.log(`AI ${gameState.aiEnabled ? 'enabled' : 'disabled'}`)
				}
				if (input.game === 'hidden') {
					console.log(`Client-${clientId} has hidden the game`)
					record.connected = false;
				}
				if (input.game === 'visible') {
					attachClient(clientId, socket);
				}
				if (input.game === 'reset' && (record.role === 'local' || record.role === 'player1'|| record.role === 'player2')) {
					resetGame();
				}
			}
		} catch {}
	});

    socket.on('close', () => {
      // Clean up client from maps when socket closes
      const clientId = socketToClientId.get(socket);
      if (clientId) {
		const record = clientRecords.get(clientId);
		if (record) {
			const wasPlayer1 = record.role === 'player1'; // Track if this was player2
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
                convertPlayer(1);
            }
			if (wasPlayer1) {
                convertPlayer(2);
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
