import { json } from 'zod';
import { drawScore } from './score';

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

localStorage

let clientId = localStorage.getItem('transcendenceClientId');
if (!clientId) {
  clientId = (Math.random().toString(36).slice(2,10));
  localStorage.setItem('transcendenceClientId', clientId);
}

const ballSize = 10;
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
 };

let role = 'spectator';

// const ws = new WebSocket("ws://10.11.4.4:3001/"); //Hardcoded network IP
const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`);

ws.onopen = () => {
	ws.send(JSON.stringify({ type: "connect", clientId }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  // Only update serverState and draw if it's a state message
  if (message.type === 'state') {
    serverState = message;
    draw();
  }
  
  // Handle other message types if needed
  if (message.type === 'role') {
	role = message.role;
    console.log(`Received role "${message.role}" for client ID: ${message.clientId}`);
  }
};

function draw()
{
	// Safety check: ensure we have valid server state
	if (typeof serverState.leftScore === 'undefined' || typeof serverState.rightScore === 'undefined') {
		return;
	}
	
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	ctx.fillStyle = "white";

	const dashHeight = 10;
	const dashWidth = 2;
	const dashSpacing = dashHeight + (dashHeight / 5);
	for (let y = 0; y < canvas.height; y += dashHeight + dashSpacing) 
		ctx.fillRect((canvas.width / 2) - (dashWidth / 2), y, dashWidth, dashHeight);

	drawScore(serverState.leftScore.toString(), (canvas.width / 4), 60);
	drawScore(serverState.rightScore.toString(), ((canvas.width * 3) / 4), 60);

	ctx.fillRect(0, serverState.leftY, serverState.paddleWidth, serverState.paddleHeight);
	ctx.fillRect(canvas.width - serverState.paddleWidth, serverState.rightY, serverState.paddleWidth, serverState.paddleHeight);

	if (!serverState.ballPaused)
		ctx.fillRect(serverState.ballX, serverState.ballY, ballSize, ballSize);

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
		// ctx.fillText("YOU", padding, canvas.height - padding);
		// ctx.textAlign = "right";
		// ctx.fillText("PLAYER 2", canvas.width - padding, canvas.height - padding);
	}
	else if (role === 'player2') {
		// ctx.fillText("PLAYER 1", padding, canvas.height - padding);
		// ctx.textAlign = "right";
		// ctx.fillText("YOU", canvas.width - padding, canvas.height - padding);
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
		ctx.fillText("SPECTATING", canvas.width / 2, canvas.height - padding);
	}
}

const keys: { [key: string]: boolean } = {};

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "p")
	ws.send(JSON.stringify({ game: "pause"}));
})

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
})


setInterval(() => {
	if (role === 'local' || role === 'player1' || role === 'player2') {
		// if (keys.w)
		// 	ws.send(JSON.stringify({ type: "move", left: "up"}));
		// if (keys.s)
		// 	ws.send(JSON.stringify({ type: "move", left: "down"}));
		// if (keys.o)
		// 	ws.send(JSON.stringify({ type: "move", right: "up"}));
		// if (keys.l)
		// 	ws.send(JSON.stringify({ type: "move", right: "down"}));
		if (keys.w)
			ws.send(JSON.stringify({ type: "move", action: "up"}));
		if (keys.s)
			ws.send(JSON.stringify({ type: "move", action: "down"}));
		if (keys.o)
			ws.send(JSON.stringify({ type: "move", right: "up"}));
		if (keys.l)
			ws.send(JSON.stringify({ type: "move", right: "down"}));
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