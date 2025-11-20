import WebSocket from 'ws';
import readline from 'readline';
import { execSync } from "child_process";

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
process.stdout.write(`\x1b[8;${WINDOW_HEIGHT + 6};${WINDOW_WIDTH}t`);
// Hide cursor
process.stdout.write("\x1b[?25l");
// Clear window
console.clear();


ws.on('open', () => {
  console.log('Connected to server');
  ws.send(JSON.stringify({ type: "connect", room: "game:testRoom", data: { clientId }}));
//   ws.send(JSON.stringify({ type: 'connect', clientId }));
  enableKeyboardInput();
});

ws.on('message', (msg: WebSocket.RawData) => {
  const message = JSON.parse(msg.toString());
  if (message.type === 'message' && message.data.subtype === 'state') {
	gameState = message.data.serverState;
	// console.clear();
	displayBoard();
  }
});

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// let oldRate: string | null = null;

// function restoreRepeatRate() {
//   if (!oldRate) return;

//   const match = oldRate.match(/delay:\s*(\d+)\s+repeat:\s*(\d+)/);
//   if (match) {
//     const delay = match[1];
//     const rate = match[2];
//     execSync(`xset r rate ${delay} ${rate}`);
//   }
// }

// function saveOriginalRepeatRate() {
//   try {
//     oldRate = execSync("xset q | grep 'repeat delay'").toString().trim();
//   } catch {
//     console.error("Could not read repeat rate");
//   }
// }

// hard code repeat rate
function restoreRepeatRate() {
  execSync(`xset r rate 500 33`);
}

function setGameRepeatRate() {
  execSync("xset r rate 100 33");
}

function enableExitHandlers() {
  process.stdin.resume(); // important for receiving SIGHUP

  const cleanup = () => {
    restoreRepeatRate();
	process.stdout.write("\x1b[?25l");
    process.exit();
  };

  process.on("exit", restoreRepeatRate);
  process.on("exit", () => process.stdout.write("\x1b[?25h"));
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGHUP", cleanup);
}

// saveOriginalRepeatRate();
setGameRepeatRate();
enableExitHandlers();

const keys: Record<string, boolean> = {};

function enableKeyboardInput() {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  process.stdin.on('keypress', (_, key) => {
    if (!key) return;

    if (key.ctrl && key.name === 'c') {
      restoreRepeatRate();
      process.exit();
    }

    const keyName  = key.name.toLowerCase();

    keys[keyName] = true;

    clearTimeout((keys as any)[`${keyName}_timeout`]);
    (keys as any)[`${keyName}_timeout`] = setTimeout(() => {
        keys[keyName] = false;
    }, 50);
	});

  setInterval(() => {
    if (keys.w) ws.send(JSON.stringify({ type: 'message', room: 'game:testRoom', data: { action: 'up' }}));
    if (keys.s) ws.send(JSON.stringify({ type: 'message', room: 'game:testRoom', data: { action: 'down' }}));
    if (keys.p) {
      ws.send(JSON.stringify({ type: 'message', room: 'game:testRoom', data: { action: 'pause' }}));
      keys.p = false;
    }
    if (keys.r) {
      ws.send(JSON.stringify({ type: 'message', room: 'game:testRoom', data: { action: 'reset' }}));
      keys.r = false;
    }
  }, 1000 / 60);
}

let prevFrame = "";

function displayBoard() {
  // Game title
  let output = '';
  output += ' '.repeat(WINDOW_HEIGHT) + '🏓 PONG CLI CLIENT 🏓\n';
  output += '▁'.repeat(WINDOW_WIDTH) + '\n';

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
    output += line + '\n';
  }

  output += '▔'.repeat(WINDOW_WIDTH) + '\n';

  output += `Score: ${gameState.leftScore} - ${gameState.rightScore} \n`;
  output += `Time: ${formatTime(gameState.timeRemaining)} ⏱       \n`;

  if (output !== prevFrame) {
    process.stdout.write("\x1b[H");    // Move cursor to top-left
    process.stdout.write(output);       // Draw full frame
    prevFrame = output;
  }
}
