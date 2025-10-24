import { drawScore, drawTime } from './score';

import {
	canvas,
	ctx,
	serverState,
	localPaddles,
	ballVelocity,
	lastServerUpdate,
	connectionState,
	reconnectAttempts,
	maxReconnectAttempts,
	role,
	ballSize,
	padding
} from './state';

export function predictBallPosition(deltaTimeMs: number) {
	if ((!ballVelocity.x && !ballVelocity.y) || (deltaTimeMs <= 0)) {
		return { x: serverState.ballX, y: serverState.ballY };
	}

	let ballVelocityX = ballVelocity.x;
	let ballVelocityY = ballVelocity.y;
	let predictedX = serverState.ballX;
	let predictedY = serverState.ballY;

	let remaining = deltaTimeMs / 1000; // seconds
	const maxStep = 0.016; // 16ms

	const paddleWidth = serverState.paddleWidth;
	const paddleHeight = serverState.paddleHeight;
	const leftY = localPaddles.leftY ?? serverState.leftY;
	const rightY = localPaddles.rightY ?? serverState.rightY;

	while (remaining > 0) {
		const deltaTime = Math.min(maxStep, remaining);
		let nextX = predictedX + (ballVelocityX * deltaTime);
		let nextY = predictedY + (ballVelocityY * deltaTime);

		if (nextY <= ballSize || nextY >= canvas.height - ballSize)
			ballVelocityY *= -1;
		if (nextX <= ballSize || nextX >= canvas.width - ballSize)
			ballVelocityX *= -1;

		predictedX = nextX;
		predictedY = nextY;
		remaining -= deltaTime;
	}

	return { x: predictedX, y: predictedY };
}

function getConnectionColor(): string {
	switch (connectionState) {
		case 'connected': return '#00ff00ff';     // Green
		case 'connecting': return '#ffff00ff';    // Yellow
		case 'reconnecting': return '#ff5c00ff';  // Orange
		case 'disconnected': return '#ff0000ff';  // Red
		default: return '#9E9E9E';                // Gray
	}
}

export function draw() {
	if (typeof serverState.leftScore === 'undefined' || typeof serverState.rightScore === 'undefined')
		return;

	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "white";
	ctx.textAlign = "center";

	// Draw dashed center line
	const dashHeight = 10;
	const dashWidth = 2;
	const dashSpacing = dashHeight + dashHeight;
	for (let y = 0; y < canvas.height - 40; y += dashSpacing)
		ctx.fillRect((canvas.width / 2) - (dashWidth / 2), y, dashWidth, dashHeight);

	// Scores
	drawScore(serverState.leftScore, (canvas.width / 4) + (canvas.width / 20), (canvas.height / 10), (canvas.height / 100));
	drawScore(serverState.rightScore, (canvas.width / 4 * 3) + (canvas.width / 20), (canvas.height / 10), (canvas.height / 100));

	// Paddles
	ctx.fillRect(0, localPaddles.leftY, serverState.paddleWidth, serverState.paddleHeight);
	ctx.fillRect(canvas.width - serverState.paddleWidth, localPaddles.rightY, serverState.paddleWidth, serverState.paddleHeight);

	// Ball
	const timeSinceLastUpdate = performance.now() - lastServerUpdate;
	const shouldPredict = timeSinceLastUpdate > 100;
	let ballX = serverState.ballX;
	let ballY = serverState.ballY;

	if (shouldPredict && !serverState.ballPaused) {
		const predicted = predictBallPosition(timeSinceLastUpdate);
		ballX = predicted.x;
		ballY = predicted.y;
	}

	if (!serverState.ballPaused) {
		ctx.beginPath();
		ctx.arc(ballX, ballY, ballSize, 0, 2 * Math.PI);
		ctx.fill();
	}

	// Paused overlay
	if (serverState.gamePaused) {
		ctx.fillStyle = "white";
		ctx.font = "48px Arial";
		ctx.textAlign = "center";
		ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
	}

	// Controls / role display
	ctx.fillStyle = "white";
	ctx.font = `30px Arial`;
	ctx.textAlign = "left";

	if (role === 'player1') {
		ctx.fillText("↑ W", padding, padding * 3);
		ctx.fillText("↓ S", padding, canvas.height - padding);
	} else if (role === 'player2') {
		ctx.textAlign = "right";
		ctx.fillText("W ↑", canvas.width - padding, padding * 3);
		ctx.fillText("S ↓", canvas.width - padding, canvas.height - padding);
	} else if (role === 'local') {
		ctx.fillText("↑ W", padding, padding * 3);
		ctx.fillText("↓ S", padding, canvas.height - padding);
		ctx.textAlign = "right";
		ctx.fillText("O ↑", canvas.width - padding, padding * 3);
		ctx.fillText("L ↓", canvas.width - padding, canvas.height - padding);
	} else {
		ctx.textAlign = "center";
		ctx.fillText("SPECTATING", canvas.width / 2, canvas.height / 20);
	}

	// Game over message
	if (serverState.gameOver) {
		const leftWon = serverState.leftScore > serverState.rightScore;
		const playerWon = (role === 'local') ||
			(role === 'player1' && leftWon) ||
			(role === 'player2' && !leftWon);

		const x = (role === 'player2') ? (canvas.width / 4 * 3) : (canvas.width / 4);
		const fontSize = 48;
		ctx.font = `${fontSize}px Arial`;
		ctx.textAlign = "center";
		ctx.fillText(playerWon ? "YOU WON" : "YOU LOST", x, canvas.height / 2);
		ctx.font = `${fontSize / 3}px Arial`;
		ctx.fillText("Press 'R' to restart", x, canvas.height / 2 + fontSize / 2);
	}

	// Time
	drawTime(serverState.timeRemaining, canvas.width / 2 + 5, canvas.height -  canvas.height / 15, (canvas.height / 200));
	
	// Connection indicator
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




























// const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
// const ctx = canvas.getContext("2d")!;

// import { drawScore, drawTime } from "./score";


// import {
// 	role,
// 	serverState,
// 	localPaddles,
// 	ballVelocity,
// 	ballSize,
// 	padding,
// 	lastServerUpdate,
// 	connectionState,
// 	reconnectAttempts,
// 	maxReconnectAttempts,
// } from "./index";

// function getConnectionColor(): string {
// 	switch (connectionState) {
// 		case 'connected': return '#00ff00ff';     // Green
// 		case 'connecting': return '#ffff00ff';    // Orange
// 		case 'reconnecting': return '#ff5c00ff';  // Red-orange
// 		case 'disconnected': return '#ff0000ff';  // Red
// 		default: return '#9E9E9E';              // Gray
// 	}	
// }

// function predictBallPosition(deltaTimeMs: number, canvas: HTMLCanvasElement) {
// 	// if we don't have a velocity estimate, just return server position
// 	if ((!ballVelocity.x && !ballVelocity.y) || (deltaTimeMs <= 0)) {
// 		return { x: serverState.ballX, y: serverState.ballY };
// 	}

// 	// Local copies so prediction doesn't mutate the global estimate
// 	let ballVelocityX = ballVelocity.x;
// 	let ballVelocityY = ballVelocity.y;
// 	let predictedX = serverState.ballX;
// 	let predictedY = serverState.ballY;

// 	let remaining = deltaTimeMs / 1000; // seconds

// 	const maxStep = 0.016; // 16ms
// 	const paddleWidth = serverState.paddleWidth;
// 	const paddleHeight = serverState.paddleHeight;
// 	const leftY = localPaddles.leftY ?? serverState.leftY;
// 	const rightY = localPaddles.rightY ?? serverState.rightY;
// 	while (remaining > 0) {
// 		const deltaTime = Math.min(maxStep, remaining);

// 		let nextX = predictedX + (ballVelocityX * deltaTime);
// 		let nextY = predictedY + (ballVelocityY * deltaTime);

// 		if (nextY <= ballSize || nextY >= canvas.height - ballSize) {
// 			ballVelocityY *= -1;
// 		}
// 		if (nextX <= ballSize || nextX >= canvas.width - ballSize) {
// 			ballVelocityX *= -1;
// 		}

// 		// if (nextX <= paddleWidth + ballSize) {
// 		// 	if (nextY + ballSize >= leftY && nextY <= leftY + paddleHeight) {
// 		// 		// Bounce
// 		// 		// const vector = getVector(nextY, leftY, true);
// 		// 		// const bounced = applyBounceVector(ballVelocityX, ballVelocityY, vector)
// 		// 		// ballVelocityX = bounced.vx;
// 		// 		// ballVelocityY = bounced.vy;
// 		// 		ballVelocityX = Math.abs(ballVelocityX);
// 		// 	} else if (nextX <= 0) {
// 		// 		// Missed left paddle — reset ball
// 		// 		return resetPredictedBall(ballVelocityX, ballVelocityY);
// 		// 	}
// 		// }

// 		// // Check right paddle collision or miss
// 		// if (nextX >= canvas.width - paddleWidth - ballSize) {
// 		// 	if (nextY + ballSize >= rightY && nextY <= rightY + paddleHeight) {
// 		// 		// Bounce
// 		// 		// const vector = getVector(nextY, rightY, false);
// 		// 		// const bounced = applyBounceVector(ballVelocityX, ballVelocityY, vector)
// 		// 		// ballVelocityX = bounced.vx;
// 		// 		// ballVelocityY = bounced.vy;
// 		// 		ballVelocityX = -Math.abs(ballVelocityX);
// 		// 	} else if (nextX >= canvas.width - ballSize) {
// 		// 		// Missed right paddle — reset ball
// 		// 		return resetPredictedBall(ballVelocityX, ballVelocityY);
// 		// 	}
// 		// }
		
// 		predictedX = nextX;
// 		predictedY = nextY;

// 		remaining -= deltaTime;
// 	}

// 	return { x: predictedX, y: predictedY };
// }

// export function draw()
// {
// 	// Safety check: ensure we have valid server state
// 	if (typeof serverState.leftScore === 'undefined' || typeof serverState.rightScore === 'undefined') {
// 		return;
// 	}
	
// 	ctx.fillStyle = "black";
// 	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
// 	ctx.fillStyle = "white";
// 	ctx.textAlign = "center";
// 	// drawScore(1000, canvas.width / 2 + 50, canvas.height - 30, 2)
// 	const dashHeight = 10;
// 	const dashWidth = 2;
// 	const dashSpacing = dashHeight + (dashHeight / 5);
// 	for (let y = 0; y < canvas.height - 40; y += dashHeight + dashSpacing) 
// 		ctx.fillRect((canvas.width / 2) - (dashWidth / 2), y, dashWidth, dashHeight);

	// drawScore(serverState.leftScore, (canvas.width / 4) + (canvas.width / 20), (canvas.height / 10), (canvas.height / 100));
	// drawScore(serverState.rightScore, (canvas.width / 4 * 3) + (canvas.width / 20), (canvas.height / 10), (canvas.height / 100));

	// ctx.fillRect(0, localPaddles.leftY, serverState.paddleWidth, serverState.paddleHeight);
	// ctx.fillRect(canvas.width - serverState.paddleWidth, localPaddles.rightY, serverState.paddleWidth, serverState.paddleHeight);

	// const timeSinceLastUpdate = performance.now() - lastServerUpdate;
	// const shouldPredict = timeSinceLastUpdate > 100; // larger than 100ms

	// let ballX, ballY;
	// ballX = serverState.ballX;
	// ballY = serverState.ballY;

	// if (shouldPredict && !serverState.ballPaused) {
	// 	const predicted = predictBallPosition(timeSinceLastUpdate, canvas);
	// 	ballX = predicted.x;
	// 	ballY = predicted.y;
	// } else {
	// 	ballX = serverState.ballX;
	// 	ballY = serverState.ballY;
	// }
	// // console.log(timeSinceLastUpdate);
	// if (!serverState.ballPaused) {
	// 	// ctx.fillStyle = shouldPredict ? "#ffff88" : "white";
	// 	ctx.beginPath();
	// 	ctx.arc(ballX, ballY, ballSize, 0, 2 * Math.PI);
	// 	ctx.fill();
	// 	// ctx.fillRect(serverState.ballX, serverState.ballY, ballSize, ballSize);
	// }

	// if (serverState.gamePaused){
	// 	ctx.fillStyle = "white";
	// 	ctx.font = "48px Arial";
	// 	ctx.textAlign = "center";
	// 	ctx.fillText("PAUSED", (canvas.width / 2) + 2, (canvas.height / 2));
	// }

	// ctx.fillStyle = "white";
	// ctx.font = `30px Arial`;
	// ctx.textAlign = "left";
	// if (role === 'player1') {
	// 	ctx.fillText("↑ W", padding, padding * 3);
	// 	ctx.fillText("↓ S", padding, canvas.height - padding);
	// }
	// else if (role === 'player2') {
	// 	ctx.textAlign = "right";
	// 	ctx.fillText("W ↑", canvas.width - padding, padding * 3);
	// 	ctx.fillText("S ↓", canvas.width - padding, canvas.height - padding);
	// }
	// else if (role === 'local') {
	// 	ctx.fillText("↑ W", padding, padding * 3);
	// 	ctx.fillText("↓ S", padding, canvas.height - padding);
	// 	ctx.textAlign = "right";
	// 	ctx.fillText("O ↑", canvas.width - padding, padding * 3);
	// 	ctx.fillText("L ↓", canvas.width - padding, canvas.height - padding);
	// }
	// else {
	// 	ctx.textAlign = "center";
	// 	ctx.fillText("SPECTATING", canvas.width / 2, canvas.height / 20);
	// }

	// if (serverState.gameOver) {
	// 	const leftWon = serverState.leftScore > serverState.rightScore;
		
	// 	let playerWon: boolean;
	// 	if (role === 'local' && serverState.aiEnabled) {
	// 		playerWon = leftWon;
	// 	} else {
	// 		playerWon = (role === 'local') || 
	// 					(role === 'player1' && leftWon) || 
	// 					(role === 'player2' && !leftWon);
	// 	}

	// 	const x = (role === 'player2') ? 
	// 			(canvas.width / 4 * 3) :
	// 			(role === 'local' && !leftWon && !serverState.aiEnabled) ? 
	// 			(canvas.width / 4 * 3) : 
	// 			(canvas.width / 4);
		
	// 	const fontSize = 48;
	// 	ctx.font = `${fontSize}px Arial`;
	// 	ctx.textAlign = "center";
	// 	ctx.fillText(playerWon ? "YOU WON" : "YOU LOST", x, canvas.height / 2);
	// 	ctx.font = `${fontSize / 3}px Arial`;
	// 	ctx.fillText("Press 'R' to restart", x, canvas.height / 2 + fontSize / 2);
	// }

	// drawTime(serverState.timeRemaining, canvas.width / 2 + 5, canvas.height -  canvas.height / 15, (canvas.height / 200));

	// // Draw connection status indicator
	// ctx.fillStyle = getConnectionColor();
	// ctx.beginPath();
	// ctx.arc(canvas.width / 2 + (canvas.height / 10), canvas.height - 2.5 * padding, 5, 0, 2 * Math.PI);
	// ctx.fill();

	// if (connectionState !== 'connected') {
    //     ctx.fillStyle = "white";
    //     ctx.font = "14px Arial";
    //     ctx.textAlign = "left";
    //     let statusText = '';
        
    //     switch (connectionState) {
    //         case 'connecting':
    //             statusText = 'Connecting...';
    //             break;
    //         case 'reconnecting':
    //             statusText = `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`;
    //             break;
    //         case 'disconnected':
    //             statusText = reconnectAttempts >= maxReconnectAttempts ? 'Connection Failed' : 'Disconnected';
    //             break;
    //     }
        
    //     ctx.fillText(statusText, canvas.width / 2 + (canvas.height / 9), canvas.height - 2 * padding);
    // }
// }

