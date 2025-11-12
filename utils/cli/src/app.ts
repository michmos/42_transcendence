import { build } from './build.js';
import readline from 'readline';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import WebSocket from 'ws';

// --- Readline setup ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

function openBrowser(url: string) {
  const start =
    process.platform === 'win32'
      ? 'start'
      : process.platform === 'darwin'
        ? 'open'
        : 'xdg-open';
  exec(`${start} "${url}"`);
}

async function prompt() {
  // Clear the console

  console.clear();

  if (app.jwtToken) {
    const user = await authenticateWithToken(app.jwtToken, app.hostname);
    if (user && user.uuid) {
      app.user = user;
      console.log(
        `\n\n\n🎉🎉🎉 Welcome to Transcendece CLI, ${user.fullName} 🎉🎉🎉\n\n\n`
      );
    }
  }

  console.log('Commands available:');
  console.log('- exit: Quit the CLI application');
  if (app.jwtToken) {
    console.log(`- game: Start a new CLI game session`);
    console.log(`- logout: Log out ${app.user.fullName}\n\n`);
  } else {
    for (const provider of app.providers) {
      console.log(
        `- login ${provider.name}: Authenticate via ${provider.name}`
      );
    }
  }
  rl.prompt();
}

function saveTokenToFile(token: string) {
  const homeDir = os.homedir();
  const tokenFilePath = path.join(homeDir, '.transcendence_cli_token');

  fs.writeFileSync(tokenFilePath, token, { encoding: 'utf-8', flag: 'w' });
}

function loadTokenFromFile(): string | null {
  const homeDir = os.homedir();
  const tokenFilePath = path.join(homeDir, '.transcendence_cli_token');

  if (fs.existsSync(tokenFilePath)) {
    const token = fs.readFileSync(tokenFilePath, { encoding: 'utf-8' });
    return token.trim();
  }
  return null;
}

import type { User } from 'db/generated/client/index.js';

async function authenticateWithToken(
  token: string,
  hostname: string
): Promise<User | null> {
  try {
    const data = await fetch(`http://${hostname}/api/auth/session`, {
      method: 'GET',
      headers: {
        Cookie: `session=${token}`,
        credentials: 'include',
      },
    });
    const user = await data.json();
    if (!user || !user.uuid) {
      console.error('Authentication failed: No user data received');
      return null;
    }
    return user as User;
  } catch (error) {
    console.error('Error during authentication:', error);
    return null;
  }
}

const app = await build();

app.jwtToken = loadTokenFromFile() || '';

prompt();

rl.on('line', async (line) => {
  const input = line.trim();

  switch (input) {
    case 'exit':
      await app.close();
      rl.close();
      process.exit(0);
      break;

    case 'logout':
      app.jwtToken = '';
      app.user = null;
      saveTokenToFile('');
      console.log('✅ Logged out successfully');
      break;

    case 'game':
      if (!app.jwtToken) {
        console.log('❌ You must be logged in to start a game session');
        break;
      }
      console.log('Starting CLI game session...');
      app.gameInProgress = true;

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

      const clientId = app.user.uuid;

      // Force terminal window size
      process.stdout.write(`\x1b[8;${WINDOW_HEIGHT + 10};${WINDOW_WIDTH}t`);

      const ws = app.socket.getSocket();

      await app.socket.waitingForConnection().then(() => {
        console.log('WebSocket connected. Joining game...');
        // Add pause 1 second to let user see the message
        return new Promise((resolve) => setTimeout(resolve, 1000));
      });

      ws.send(JSON.stringify({ type: 'connect', clientId }));
      enableKeyboardInput();

      ws.on('message', (msg: WebSocket.RawData) => {
        if (app.gameInProgress === false) return;

        const message = JSON.parse(msg.toString());
        if (message.type === 'state') {
          gameState = message;

          console.clear();
          console.log(
            `Ball: (${message.ballX.toFixed(2)}, ${message.ballY.toFixed(2)})`
          );
          console.log(
            `Paddles: left ${message.leftY}, right ${message.rightY}`
          );
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

          if (key.name === 'x') {
            app.gameInProgress = false;
            ws.send(JSON.stringify({ type: 'game', action: 'exit' }));
            return prompt();
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
        const ballX = Math.floor(
          (gameState.ballX / CANVAS_WIDTH) * WINDOW_WIDTH
        );
        const ballY = Math.floor(
          (gameState.ballY / CANVAS_HEIGHT) * WINDOW_HEIGHT
        );
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

      break;

    default:
      if (input.startsWith('login ')) {
        const providerName = input.slice(5).trim();
        const provider = app.providers.find(
          (p) => p.name.toLowerCase() === providerName.toLowerCase()
        );
        if (provider) {
          const separator = provider.buttonUri.includes('?') ? '&' : '?';
          const url = `http://${app.hostname}/${provider.buttonUri}${separator}cli=true`;

          console.log(`🔗 Open in browser: `, url);
          openBrowser(encodeURI(url));

          // Show JWT token input prompt
          rl.question('Copy/Paste received token here: ', async (token) => {
            const user = await authenticateWithToken(token, app.hostname);
            if (!user || !user.uuid) {
              console.log('❌ Authentication failed: No user data received');
              return;
            }
            app.jwtToken = token;
            saveTokenToFile(token);
            app.user = user;
            console.log(`✅ Welcome, ${user.fullName}`);
            return prompt();
          });
        } else {
          console.log(`❌ Unknown provider: ${providerName}`);
          return prompt();
        }
      } else {
        console.log(`Unknown command: ${input}`);
        return prompt();
      }
  }
  prompt();
});

rl.on('close', () => {
  console.log('Exiting CLI application. Goodbye!');
});
