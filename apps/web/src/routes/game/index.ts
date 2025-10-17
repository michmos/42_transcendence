
import { drawScore, drawTime } from './score';

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

localStorage

let clientId = localStorage.getItem('transcendenceClientId');
if (!clientId) {
  clientId = (Math.random().toString(36).slice(2,10));
  localStorage.setItem('transcendenceClientId', clientId);
}

const ballSize = 5;
const padding = 10;

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
 };

let role = 'spectator';
let connectionState = 'connecting';
let reconnectAttempts = 0;
const maxReconnectAttempts = 3;
let reconnectTimeout: NodeJS.Timeout;
let ws: WebSocket;
let networkBlocked = false;

// const ws = new WebSocket("ws://10.11.4.4:3001/"); // Hardcoded network IP
function createWebSocket() {
	if (ws) {
		ws.close();
	}

	// If network is blocked, immediately fail
	if (networkBlocked) {
		console.log('🧪 Network blocked - connection attempt failed');
		connectionState = 'disconnected';
		
		attemptReconnection();
		return;
	}

	connectionState = 'connecting';
	ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`);
	
	ws.onopen = () => {
		connectionState = 'connected';
		reconnectAttempts = 0;
		console.log('🏓 Connected to game server');
		// ws.send(JSON.stringify({ type: "connect", clientId }));
		sendMessage({ type: "connect", clientId });
	}
	
	ws.onclose = (event) => {
		connectionState = 'disconnected';
		console.log('🔌 Disconnected from server:', event.code, event.reason);
	
		attemptReconnection();
	}
	
	ws.onerror = (error) => {
		console.error('WebSocket error:', error);
	}
	
	ws.onmessage = (event) => {
	  const message = JSON.parse(event.data);
	  
	  // Only update serverState and draw if it's a state message
	  if (message.type === 'state') {
		serverState = message;
		// draw();
	  }
	  
	  // Handle other message types if needed
	  if (message.type === 'role') {
		role = message.role;
		console.log(`🎮 Received role "${message.role}" for client ID: ${message.clientId}`);
	  }
	};
}

function attemptReconnection() {
	
	if (reconnectAttempts >= maxReconnectAttempts) {
		connectionState = 'disconnected';
		console.log('⛔ Max reconnection attempts reached. Please refresh the page.');
		return;
	}
	
	connectionState = 'reconnecting';
	reconnectAttempts++;
	
	const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 16000);
	console.log(`🔁 Reconnection attempt ${reconnectAttempts} in ${delay}ms`);
	
	reconnectTimeout = setTimeout(() => {
		createWebSocket(); // Create entirely new connection
	}, delay);
}

createWebSocket();

function draw()
{
	// Safety check: ensure we have valid server state
	if (typeof serverState.leftScore === 'undefined' || typeof serverState.rightScore === 'undefined') {
		return;
	}
	
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	// drawScore(1000, canvas.width / 2 + 50, canvas.height - 30, 2)
	const dashHeight = 10;
	const dashWidth = 2;
	const dashSpacing = dashHeight + (dashHeight / 5);
	for (let y = 0; y < canvas.height - 40; y += dashHeight + dashSpacing) 
		ctx.fillRect((canvas.width / 2) - (dashWidth / 2), y, dashWidth, dashHeight);

	drawScore(serverState.leftScore, (canvas.width / 4) + (canvas.width / 20), (canvas.height / 10), (canvas.height / 100));
	drawScore(serverState.rightScore, (canvas.width / 4 * 3) + (canvas.width / 20), (canvas.height / 10), (canvas.height / 100));

	ctx.fillRect(0, serverState.leftY, serverState.paddleWidth, serverState.paddleHeight);
	ctx.fillRect(canvas.width - serverState.paddleWidth, serverState.rightY, serverState.paddleWidth, serverState.paddleHeight);

	if (!serverState.ballPaused) {
		ctx.beginPath();
		ctx.arc(serverState.ballX, serverState.ballY, ballSize, 0, 2 * Math.PI);
		ctx.fill();
		// ctx.fillRect(serverState.ballX, serverState.ballY, ballSize, ballSize);
	}

	if (serverState.gamePaused){
		ctx.fillStyle = "rgba(255, 255, 255)";
		ctx.font = "48px Arial";
		ctx.textAlign = "center";
		ctx.fillText("PAUSED", (canvas.width / 2) + 2, (canvas.height / 2));
	}

	ctx.fillStyle = "rgba(255, 255, 255)";
	ctx.font = `30px Arial`;
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
		
		const fontSize = 48;
		ctx.font = `${fontSize}px Arial`;
		ctx.textAlign = "center";
		ctx.fillText(playerWon ? "YOU WON" : "YOU LOST", x, canvas.height / 2);
		ctx.font = `${fontSize / 3}px Arial`;
		ctx.fillText("Press 'R' to restart", x, canvas.height / 2 + fontSize / 2);
	}

	drawTime(serverState.timeRemaining, canvas.width / 2 + 5, canvas.height -  canvas.height / 15, (canvas.height / 200));

	// Draw connection status indicator
	ctx.fillStyle = getConnectionColor();
	ctx.beginPath();
	ctx.arc(canvas.width / 2 + (canvas.height / 10), canvas.height - 2.5 * padding, 5, 0, 2 * Math.PI);
	ctx.fill();

	if (connectionState !== 'connected') {
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        let statusText = '';
        
        switch (connectionState) {
            case 'connecting':
                statusText = 'Connecting...';
                break;
            case 'reconnecting':
                statusText = `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`;
                break;
            case 'disconnected':
                statusText = reconnectAttempts >= maxReconnectAttempts ? 'Connection Failed' : 'Disconnected';
                break;
        }
        
        ctx.fillText(statusText, canvas.width / 2 + (canvas.height / 9), canvas.height - 2 * padding);
    }
}

function getConnectionColor(): string {
	switch (connectionState) {
		case 'connected': return '#00ff00ff';     // Green
		case 'connecting': return '#ffff00ff';    // Orange
		case 'reconnecting': return '#ff5c00ff';  // Red-orange
		case 'disconnected': return '#ff0000ff';  // Red
		default: return '#9E9E9E';              // Gray
	}	
}

let inputBuffer: any[] = [];

function sendMessage(data: any) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        
        // Send any buffered messages
        while (inputBuffer.length > 0) {
            const bufferedMessage = inputBuffer.shift();
            ws.send(JSON.stringify(bufferedMessage));
        }
    } else if (connectionState === 'reconnecting') {
        // Buffer the message for when connection is restored
        inputBuffer.push(data);
        console.log('Buffering message during reconnection:', data);
    } else {
        console.warn('WebSocket not connected, message not sent:', data);
    }
}

const keys: { [key: string]: boolean } = {};

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "p") {
	// ws.send(JSON.stringify({ game: "pause"}));
	sendMessage({ game: "pause"});
  }
  if (e.key === "r") {
	// ws.send(JSON.stringify({ game: "reset"}));
	sendMessage({ game: "reset"});
  }
  if (e.key === ".") {
	// ws.send(JSON.stringify({ game: "ai"}));
	sendMessage({ game: "ai"});
  }
  if (e.key === "x") {
	if (!networkBlocked) {
		// Simulate network outage
		console.log("🧪 Simulating connection loss");
		networkBlocked = true;

		if (reconnectTimeout) {
        	clearTimeout(reconnectTimeout);
      	}

		if (ws && ws.readyState === WebSocket.OPEN) {
		  ws.close(3000, 'Simulated network error'); // 1006 = abnormal closure
		}

		connectionState = 'disconnected';
    } else {
		// Restore network
		console.log("🧪 Network connection restored");
		networkBlocked = false;

		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
      	}

		// Reset reconnection attempts
		reconnectAttempts = 0;
		createWebSocket();
	}
  }
})

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
})

document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		console.log('🕶️ Page hidden');
		// ws.send(JSON.stringify({ game: "hidden"}));
		sendMessage({ game: "hidden"});
	}
	else {
		console.log('👓 Page visible');
		// ws.send(JSON.stringify({ type: "connect", clientId }));
		sendMessage({ type: "connect", clientId });
	}
})

function gameLoop() {
	draw();
	requestAnimationFrame(gameLoop);
}

setInterval(() => {
	if (role === 'local' || role === 'player1' || role === 'player2') {
		if (keys.w) {
			// ws.send(JSON.stringify({ type: "move", action: "up"}));
			sendMessage({ type: "move", action: "up"});
		}
		if (keys.s) {
			// ws.send(JSON.stringify({ type: "move", action: "down"}));
			sendMessage({ type: "move", action: "down"});
		}
		if (keys.o) {
			// ws.send(JSON.stringify({ type: "move", right: "up"}));
			sendMessage({ type: "move", right: "up"});
		}
		if (keys.l) {
			// ws.send(JSON.stringify({ type: "move", right: "down"}));
			sendMessage({ type: "move", right: "down"});
		}
	}
}, 1000 / 60);

gameLoop();