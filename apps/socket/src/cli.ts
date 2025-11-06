import WebSocket from 'ws';
import readline from 'readline';

interface ServerState {
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
  gameStartTime: number;
}

let gameState: ServerState;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const WINDOW_WIDTH = 91;
const WINDOW_HEIGHT = 34;

const url = 'ws://localhost:3001/'; // Match your server port
const clientId = `${Math.random().toString(36).slice(2, 10)}`; // or pass from CLI args
const ws = new WebSocket(url);

// Force terminal window size
// process.stdout.write('\x1b[8;50;91t');
process.stdout.write(`\x1b[8;${WINDOW_HEIGHT + 10};${WINDOW_WIDTH}t`);

ws.on('open', () => {
  console.log('Connected to server');
  ws.send(JSON.stringify({ type: 'connect', clientId }));
  enableKeyboardInput();
});

ws.on('message', (msg: WebSocket.RawData) => {
  const message = JSON.parse(msg.toString());
  if (message.type === 'state') {
    gameState = message;

    console.clear();
    console.log(
      `Ball: (${message.ballX.toFixed(2)}, ${message.ballY.toFixed(2)})`
    );
    console.log(`Paddles: left ${message.leftY}, right ${message.rightY}`);
    displayBoard();
    console.log(`Time: ${formatTime(gameState.timeRemaining)} ⏱`);
    console.log(`Score: ${message.leftScore} - ${message.rightScore}`);
  }
});

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function enableKeyboardInput() {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  process.stdin.on('keypress', (_, key) => {
    if (!key) return;

    if (key.ctrl && key.name === 'c') {
      process.exit();
    }

    if (key.name === 'w') {
      ws.send(JSON.stringify({ type: 'game', action: 'up' }));
    } else if (key.name === 's') {
      ws.send(JSON.stringify({ type: 'game', action: 'down' }));
    } else if (key.name === 'p') {
      ws.send(JSON.stringify({ type: 'game', action: 'pause' }));
    } else if (key.name === 'r') {
      ws.send(JSON.stringify({ type: 'game', action: 'reset' }));
    }
  });
}

function displayBoard() {
  // Game title
  console.log(' '.repeat(WINDOW_HEIGHT), '🏓 PONG CLI CLIENT 🏓');
  console.log('▁'.repeat(WINDOW_WIDTH));

  // Game field (simplified ASCII representation)
  // const width = 91;
  // const height = 34;

  // Calculate positions scaled to ASCII field
  const ballX = Math.floor((gameState.ballX / CANVAS_WIDTH) * WINDOW_WIDTH);
  const ballY = Math.floor((gameState.ballY / CANVAS_HEIGHT) * WINDOW_HEIGHT);
  const leftPaddleY = Math.floor(
    (gameState.leftY / CANVAS_HEIGHT) * WINDOW_HEIGHT
  );
  const rightPaddleY = Math.floor(
    (gameState.rightY / CANVAS_HEIGHT) * WINDOW_HEIGHT
  );

  // Draw game field
  for (let y = 0; y < WINDOW_HEIGHT; y++) {
    let line = '';

    for (let x = 0; x < WINDOW_WIDTH; x++) {
      if (x === 0) {
        // Left paddle
        if (y >= leftPaddleY && y < leftPaddleY + 6) {
          line += '█';
        } else {
          line += '🭰';
        }
      } else if (x === WINDOW_WIDTH - 1) {
        // Right paddle
        if (y >= rightPaddleY && y < rightPaddleY + 6) {
          line += '█';
        } else {
          line += '🭵';
        }
      } else if (x === Math.floor(WINDOW_WIDTH / 2)) {
        // Center line
        line += y % 2 === 0 ? '|' : ' ';
      } else if (x === ballX && y === ballY && !gameState.ballPaused) {
        // Ball
        line += '●';
      } else {
        line += ' ';
      }
    }
    console.log(line);
  }
  console.log('▔'.repeat(WINDOW_WIDTH));
}
