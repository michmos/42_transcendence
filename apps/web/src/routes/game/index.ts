import { json } from 'zod';
import { drawScore, drawTime } from './score';

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

localStorage

let clientId = localStorage.getItem('transcendenceClientId');
if (!clientId) {
  clientId = (Math.random().toString(36).slice(2,10));
  localStorage.setItem('transcendenceClientId', clientId);
}

const ballSize = canvas.width / 80;
const padding = canvas.width / 80;

let isConnected = true;
let pingInterval: NodeJS.Timeout;

let serverState = {
	paddleWidth: 0,
	paddleHeight: 0,
	ballX: 0,
	ballY: 0,
	ballSpeedX: 0,
	ballSpeedY: 0,
	ballPaused: false,
	leftY: 0,
	rightY: 0,
	gamePaused: false,
	leftScore: 0,
	rightScore: 0,
	gameOver: false,
	aiEnabled: false,
	timeRemaining: 0,
	gameStartTime: 0,
	clientRole: 'spectator'
 };

let role = 'spectator';

// // const ws = new WebSocket("ws://10.11.4.4:3001/"); // Hardcoded network IP
// const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`);

// ws.onopen = () => {
// 	ws.send(JSON.stringify({ type: "connect", clientId }))
// }

// ws.onmessage = (event) => {
//   const message = JSON.parse(event.data);
  
//   // Only update serverState and draw if it's a state message
//   if (message.type === 'state') {
//     serverState = message;
//     draw();
//   }
  
//   // Handle other message types if needed
//   if (message.type === 'role') {
// 	role = message.role;
//     console.log(`Received role "${message.role}" for client ID: ${message.clientId}`);
//   }
// };

async function startPing() {
	pingInterval = setInterval(async () => {
		try {
		const response = await fetch(`http://${window.location.hostname}:3001/api/game/ping`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ clientId })
		});
		
		if (!response.ok) {
			console.warn('Ping failed, trying to rejoin...');
			await joinGame(); // Try to rejoin
		} else {
			isConnected = true;
		}
		} catch (error) {
		console.error('Ping error:', error);
		isConnected = false;
		}
	}, 5000);
}

async function joinGame() {
	try {
		const response = await fetch(`http://${window.location.hostname}:3001/api/game/join`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ clientId })
		});
		
		if (response.ok) {
			const data = await response.json();
			role = data.record.role;
			serverState = data.gameState;
			console.log(`Joined as ${role} (Client ID: ${clientId})`);
			
			// Start ping after successful join
			if (pingInterval) 
				clearInterval(pingInterval);
			startPing();
			
			draw();
		}
	} catch (error) {
		console.error('Error joining game:', error);
		isConnected = false;
	}
}

// async function joinGame() {
// 	try {
// 		const response = await fetch(`http://${window.location.hostname}:3001/api/game/join`, {
// 		method: 'POST',
// 		headers: { 'Content-Type': 'application/json' },
// 		body: JSON.stringify({ clientId })
// 		});
		
// 		if (response.ok) {
// 		const data = await response.json();
// 		role = data.record.role;
// 		serverState = data.gameState;
// 		console.log(`Joined as ${role} (Client ID: ${clientId})`);
// 		draw();
// 		}
// 	} catch (error) {
// 		console.error('Error joining game:', error);
// 	}
// }

function draw()
{
	// Safety check: ensure we have valid server state
	if (typeof serverState.leftScore === 'undefined' || typeof serverState.rightScore === 'undefined') {
		return;
	}

	const fontSize = canvas.height / 12.5;
	
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	const dashHeight = canvas.width / 80;
	const dashWidth = dashHeight / 5;
	const dashSpacing = dashHeight + dashWidth;
	for (let y = 0; y < canvas.height - canvas.width / 20; y += dashHeight + dashSpacing)
		ctx.fillRect((canvas.width / 2) - (dashWidth / 2), y, dashWidth, dashHeight);

	drawScore(serverState.leftScore.toString(), (canvas.width / 4) + (canvas.width / 20), (canvas.height / 10), (canvas.height / 100));
	drawScore(serverState.rightScore.toString(), (canvas.width / 4 * 3) + (canvas.width / 20), (canvas.height / 10), (canvas.height / 100));

	ctx.fillRect(0, serverState.leftY, serverState.paddleWidth, serverState.paddleHeight);
	ctx.fillRect(canvas.width - serverState.paddleWidth, serverState.rightY, serverState.paddleWidth, serverState.paddleHeight);

	if (!serverState.ballPaused)
		ctx.fillRect(serverState.ballX, serverState.ballY, ballSize, ballSize);

	if (serverState.gamePaused){
		ctx.font = `${fontSize}px Arial`;
		ctx.textAlign = "center";
		ctx.fillText("PAUSED", (canvas.width / 2) + 2, (canvas.height / 2));
		ctx.font = `${fontSize / 3}px Arial`;
		ctx.fillText("Press 'P' to resume", (canvas.width / 2) + 2, canvas.height / 2 + fontSize / 2);
	}

	ctx.font = `${canvas.height / 20}px Arial`;
	ctx.textAlign = "left";
	if (role === 'player1') {
		ctx.fillText("↑ W", padding, padding * 3);
		ctx.fillText("↓ S", padding, canvas.height - padding);
	}
	else if (role === 'player2') {
		ctx.textAlign = "right";
		ctx.fillText("W ↑", canvas.width - padding, padding * 3);
		ctx.fillText("S ↓", canvas.width - padding, canvas.height - padding);
	}
	else if (role === 'local') {
		ctx.fillText("↑ W", padding, padding * 3);
		ctx.fillText("↓ S", padding, canvas.height - padding);
		ctx.textAlign = "right";
		ctx.fillText("O ↑", canvas.width - padding, padding * 3);
		ctx.fillText("L ↓", canvas.width - padding, canvas.height - padding);
	}
	else {
		ctx.textAlign = "center";
		ctx.fillText("SPECTATING", canvas.width / 2, canvas.height / 20);
	}

	// ctx.font = "48px Arial";
	// ctx.textAlign = "center";
	// if (serverState.gameOver && (role === 'local' || role === 'player1') && serverState.leftScore > serverState.rightScore) {
	// 	ctx.fillText("YOU WON", (canvas.width / 4), (canvas.height / 2));
	// 	ctx.font = "16px Arial";
	// 	ctx.fillText("Press 'R' to restart", canvas.width / 4, canvas.height / 2 + 25);
	// }
	// else if (serverState.gameOver && (role === 'local')) {
	// 	if (serverState.aiEnabled) {
	// 		ctx.fillText("YOU LOST", (canvas.width / 4), (canvas.height / 2));
	// 		ctx.font = "16px Arial";
	// 		ctx.fillText("Press 'R' to restart", canvas.width / 4, canvas.height / 2 + 25);
	// 	}
	// 	else {
	// 		ctx.fillText("YOU WON", (canvas.width / 4 * 3), (canvas.height / 2));
	// 		ctx.font = "16px Arial";
	// 		ctx.fillText("Press 'R' to restart", canvas.width / 4 * 3, canvas.height / 2 + 25);
	// 	}
	// }
	// else if (serverState.gameOver && (role === 'player1')) {
	// 	ctx.fillText("YOU LOST", (canvas.width / 4), (canvas.height / 2));
	// 	ctx.font = "16px Arial";
	// 	ctx.fillText("Press 'R' to restart", canvas.width / 4, canvas.height / 2 + 25);
	// }
	// else if (serverState.gameOver && (role === 'player2') && serverState.leftScore < serverState.rightScore)  {
	// 	ctx.fillText("YOU WON", (canvas.width / 4 * 3), (canvas.height / 2));
	// 	ctx.font = "16px Arial";
	// 	ctx.fillText("Press 'R' to restart", canvas.width / 4 * 3, canvas.height / 2 + 25);
	// }
	// else if (serverState.gameOver && (role === 'player2')) {
	// 	ctx.fillText("YOU LOST", (canvas.width / 4 * 3), (canvas.height / 2));
	// 	ctx.font = "16px Arial";
	// 	ctx.fillText("Press 'R' to restart", canvas.width / 4 * 3, canvas.height / 2 + 25);
	// }

	if (serverState.gameOver) {
		const leftWon = serverState.leftScore > serverState.rightScore;
		
		let playerWon: boolean;
		if (role === 'local' && serverState.aiEnabled) {
			playerWon = leftWon;
		} else {
			playerWon = (role === 'local') || 
						(role === 'player1' && leftWon) || 
						(role === 'player2' && !leftWon);
		}

		const x = (role === 'player2') ? 
				(canvas.width / 4 * 3) :
				(role === 'local' && !leftWon && !serverState.aiEnabled) ? 
				(canvas.width / 4 * 3) : 
				(canvas.width / 4);
		
		ctx.font = `${fontSize}px Arial`;
		ctx.textAlign = "center";
		ctx.fillText(playerWon ? "YOU WON" : "YOU LOST", x, canvas.height / 2);
		ctx.font = `${fontSize / 3}px Arial`;
		ctx.fillText("Press 'R' to restart", x, canvas.height / 2 + fontSize / 2);
	}

	drawTime(serverState.timeRemaining, canvas.width / 2 + 5, canvas.height - canvas.height / 15, (canvas.height / 200))
}	

const keys: { [key: string]: boolean } = {};

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "p")
	sendAction("pause")
  if (e.key === "r")
	sendAction("reset")
  if (e.key === ".")
	sendAction("ai")
})

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
})

// Handle page visibility change (when user switches tabs/minimizes)
document.addEventListener('visibilitychange', () => {
	if (document.hidden) {
		// Page is hidden, client might be considered disconnected
		console.log('Page hidden');
	} else {
		// Page is visible again, ensure we're still connected
		console.log('Page visible');
		if (!isConnected) {
			joinGame();
		}
	}
});

async function sendAction(action: string) {
	await fetch(`http://${window.location.hostname}:3001/api/game/action`, {
		method: 'POST',
      	headers: { 'Content-Type': 'application/json' },
      	body: JSON.stringify({ clientId: clientId, action })
	});
}

async function updateGameState() {
	try {
		const response = await fetch(`http://${window.location.hostname}:3001/api/game/state`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
		if (response.ok) {
			const gameState = await response.json();
			serverState = gameState; // Update your local state

			if (gameState.clientRole) {
				role = gameState.clientRole;
			}
			draw(); // Redraw the game with new state
		} else {
			console.error('Failed to fetch game state:', response.status);
		}
	} catch (error) {
		console.error('Error updating game state:', error);
	}
}

// Initialize game
joinGame();

setInterval(() => {
	updateGameState()
	if (role === 'local' || role === 'player1' || role === 'player2') {
		// if (keys.w)
		// 	ws.send(JSON.stringify({ type: "move", left: "up"}));
		// if (keys.s)
		// 	ws.send(JSON.stringify({ type: "move", left: "down"}));
		// if (keys.o)
		// 	ws.send(JSON.stringify({ type: "move", right: "up"}));
		// if (keys.l)
		// 	ws.send(JSON.stringify({ type: "move", right: "down"}));
		// if (keys.w)
		// 	ws.send(JSON.stringify({ type: "move", action: "up"}));
		// if (keys.s)
		// 	ws.send(JSON.stringify({ type: "move", action: "down"}));
		// if (keys.o)
		// 	ws.send(JSON.stringify({ type: "move", right: "up"}));
		// if (keys.l)
		// 	ws.send(JSON.stringify({ type: "move", right: "down"}));
		if (keys.w)
			sendAction("upL")
		if (keys.s)
			sendAction("downL")
		if (keys.o)
			sendAction("upR")
		if (keys.l)
			sendAction("downR")
	}
}, 1000 / 60);

// const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
// const ctx = canvas.getContext("2d")!;

// const paddleWidth = 10;
// const paddleHeight = 100;
// const ballSize = 10;
// const moveSpeed = 5;

// let ballX = canvas.width / 2;
// let ballY = canvas.height / 2;
// let ballSpeed = 5;
// let leftY = (canvas.height / 2) - (paddleHeight / 2);
// let rightY = (canvas.height / 2) - (paddleHeight / 2);

// function draw()
// {
// 	ctx.fillStyle = "black";
// 	ctx.fillRect(0, 0, canvas.width, canvas.height);

// 	ctx.fillStyle = "white";

// 	ctx.fillRect(0, leftY, paddleWidth, paddleHeight);
// 	ctx.fillRect(canvas.width - paddleWidth, rightY, paddleWidth, paddleHeight);

// 	ctx.fillRect(ballX, ballY, ballSize, ballSize);

// }

// const keys: { [key: string]: boolean } = {};

// document.addEventListener("keydown", (e) => {
//   keys[e.key.toLowerCase()] = true;
// })

// document.addEventListener("keyup", (e) => {
//   keys[e.key.toLowerCase()] = false;
// })

// function input()
// {
// 	if (keys['w'] && leftY > 0)
// 		leftY -= moveSpeed;
// 	if (keys['s'] && leftY < (canvas.height - paddleHeight))
// 		leftY += moveSpeed;
// }

// function update()
// {
// 	ballX -= ballSpeed;
// 	// ballY -= ballSpeed;

// 	if (ballX <= 0 || ballX >= (canvas.width - ballSize))
// 	{
// 		ballX = canvas.width / 2;
// 		ballY = canvas.height / 2;
// 	}

// 	if (ballX <= paddleWidth && ballY + ballSize >= leftY && ballY <= leftY + paddleHeight)
// 		ballSpeed = ballSpeed * -1;

// 	if (ballX + ballSize >= canvas.width - paddleWidth && ballY + ballSize >= rightY && ballY <= rightY + paddleHeight)
// 		ballSpeed = ballSpeed * -1;

// }

// function gameLoop()
// {
// 	input();
// 	update();
// 	draw();
// 	requestAnimationFrame(gameLoop);
// }

// gameLoop();