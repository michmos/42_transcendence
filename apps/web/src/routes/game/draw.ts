import { drawScore, drawTime } from './score';

const green = '#00ff00ff';
const yellow = '#ffff00ff';
const orange = '#ff5c00ff';
const red = '#ff0000ff';
const grey = '#9E9E9E';

import {
  getCanvas,
  getCtx,
  serverState,
  localPaddles,
  ballVelocity,
  lastServerUpdate,
  connectionState,
  reconnectAttempts,
  maxReconnectAttempts,
  role,
  ballSize,
  padding,
} from './state';

const canvas = getCanvas();
const ctx = getCtx();

export function predictBallPosition(deltaTimeMs: number) {
  // Continues ball on client side during (simulated) network outage so game doesn't freeze
  // on reconnect, the server's gamestate is resumed. Server's gamestate takes president
  // no points can be scored during simulation on client side.
  if ((!ballVelocity.x && !ballVelocity.y) || deltaTimeMs <= 0) {
    return { x: serverState.ballX, y: serverState.ballY };
  }

  let ballVelocityX = ballVelocity.x;
  let ballVelocityY = ballVelocity.y;
  let predictedX = serverState.ballX;
  let predictedY = serverState.ballY;

  let remaining = deltaTimeMs / 1000; // seconds
  const maxStep = 0.016; // 16ms

  while (remaining > 0) {
    const deltaTime = Math.min(maxStep, remaining);
    const nextX = predictedX + ballVelocityX * deltaTime;
    const nextY = predictedY + ballVelocityY * deltaTime;

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
    case 'connected':
      return green;
    case 'connecting':
      return yellow;
    case 'reconnecting':
      return orange;
    case 'disconnected':
      return red;
    default:
      return grey;
  }
}

export function draw() {
  if (
    typeof serverState.leftScore === 'undefined' ||
    typeof serverState.rightScore === 'undefined' ||
    !ctx
  )
    return;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';

  // Draw dashed center line
  const dashHeight = 10;
  const dashWidth = 2;
  const dashSpacing = dashHeight + dashHeight;
  for (let y = 0; y < canvas.height - 40; y += dashSpacing)
    ctx.fillRect(canvas.width / 2 - dashWidth / 2, y, dashWidth, dashHeight);

  // Scores
  drawScore(
    serverState.leftScore,
    canvas.width / 4 + canvas.width / 20,
    canvas.height / 10,
    canvas.height / 100
  );
  drawScore(
    serverState.rightScore,
    (canvas.width / 4) * 3 + canvas.width / 20,
    canvas.height / 10,
    canvas.height / 100
  );

  // Paddles
  ctx.fillRect(
    0,
    localPaddles.leftY,
    serverState.paddleWidth,
    serverState.paddleHeight
  );
  ctx.fillRect(
    canvas.width - serverState.paddleWidth,
    localPaddles.rightY,
    serverState.paddleWidth,
    serverState.paddleHeight
  );

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
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
  }

  // Controls / role display
  ctx.fillStyle = 'white';
  ctx.font = `30px Arial`;
  ctx.textAlign = 'left';

  if (role === 'player1') {
    ctx.fillText('↑ W', padding, padding * 3);
    ctx.fillText('↓ S', padding, canvas.height - padding);
  } else if (role === 'player2') {
    ctx.textAlign = 'right';
    ctx.fillText('W ↑', canvas.width - padding, padding * 3);
    ctx.fillText('S ↓', canvas.width - padding, canvas.height - padding);
  } else if (role === 'local') {
    ctx.fillText('↑ W', padding, padding * 3);
    ctx.fillText('↓ S', padding, canvas.height - padding);
    ctx.textAlign = 'right';
    ctx.fillText('O ↑', canvas.width - padding, padding * 3);
    ctx.fillText('L ↓', canvas.width - padding, canvas.height - padding);
  } else {
    ctx.textAlign = 'center';
    ctx.fillText('SPECTATING', canvas.width / 2, canvas.height / 20);
  }

  // Game over message
  if (serverState.gameOver) {
    const leftWon = serverState.leftScore > serverState.rightScore;
    const playerWon =
      role === 'local' ||
      (role === 'player1' && leftWon) ||
      (role === 'player2' && !leftWon);

    const x = (role === 'local' && !leftWon) ?
	    (canvas.width / 4) * 3 : (role === 'player2' ?
         (canvas.width / 4) * 3 : canvas.width / 4);
    const fontSize = 48;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(playerWon ? 'YOU WON' : 'YOU LOST', x, canvas.height / 2);
    ctx.font = `${fontSize / 3}px Arial`;
    ctx.fillText("Press 'R' to restart", x, canvas.height / 2 + fontSize / 2);
  }

  // Time
  drawTime(
    serverState.timeRemaining,
    canvas.width / 2 + 5,
    canvas.height - canvas.height / 15,
    canvas.height / 200
  );

  // Connection indicator
  ctx.fillStyle = getConnectionColor();
  ctx.beginPath();
  ctx.arc(
    canvas.width / 2 + canvas.height / 10,
    canvas.height - 2.5 * padding,
    5,
    0,
    2 * Math.PI
  );
  ctx.fill();

  if (connectionState !== 'connected') {
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    let statusText = '';

    switch (connectionState) {
      case 'connecting':
        statusText = 'Connecting...';
        break;
      case 'reconnecting':
        statusText = `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`;
        break;
      case 'disconnected':
        statusText =
          reconnectAttempts >= maxReconnectAttempts
            ? 'Connection Failed'
            : 'Disconnected';
        break;
    }

    ctx.fillText(
      statusText,
      canvas.width / 2 + canvas.height / 9,
      canvas.height - 2 * padding
    );
  }
}
