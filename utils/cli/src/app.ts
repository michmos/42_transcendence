import { build } from './build.js';

import { env } from './env.js';

import { Socket } from './plugins/websocket/index.js';

import Authenticate from './authentication.js';
import Interface from './interface.js';
import Game from './game.js';

const app = await build();

// Load JWT token from file if it exists
const auth = new Authenticate(env.CORS_URL);
app.jwtToken = auth.loadTokenFromFile();

// Strip https or http from CORS_URL for WebSocket connection
const protocolRegex = /^https?:\/\//i;
const wsProtocol = env.CORS_URL.startsWith('https') ? 'wss://' : 'ws://';
const cleanUrl = env.CORS_URL.replace(protocolRegex, '').replace(/\/$/, '');
const wsUrl = wsProtocol + cleanUrl + '/websocket/';

// Initialize WebSocket connection with session cookie if available
const socket = new Socket();
app.decorate('socket', socket);

const menu = new Interface(await auth.getProviders(env.CORS_URL));

try {
  console.log('Connecting to server at', env.CORS_URL);
  await auth.getProviders(env.CORS_URL);
} catch {
  console.error(`Failed to connect to server`, env.CORS_URL, `Exiting...`);
  process.exit(0);
}

// Attempt to authenticate with existing token
if (app.jwtToken) await auth.loginWithToken(app.jwtToken, env.CORS_URL);

menu
  .setTokenGetter(() => app.jwtToken)
  .registerMenuOption('exit', exitHandler)
  .registerMenuOption('logout', logoutHandler.bind(menu))
  .registerMenuOption('game', () => void gameHandler())
  .registerLoginHandler(loginHandler.bind(menu));

menu.showMenu();

// Game handler
async function gameHandler() {
  if (!app.jwtToken) {
    console.log('❌ You must be logged in to start a game');
    menu.refreshMenu();
  } else {
    menu.pause();
    try {
      socket.connect(wsUrl, app.jwtToken);
      await socket.waitingForConnection();
    } catch {
      console.error('❌ Failed to establish WebSocket connection');
      process.exit(0);
    }
    const game = new Game(socket);
    await game.startGameSession(app.jwtToken);
    // Give stdin a moment to settle
    await new Promise((resolve) => setTimeout(resolve, 100));
    menu.resume();
    menu.showMenu();
  }
}

// Exit handler
function exitHandler() {
  menu.close();
  process.exit(0);
}

// Logout handler
function logoutHandler() {
  app.jwtToken = '';
  app.user = null;
  auth.saveTokenToFile('');
  console.log('✅ Logged out successfully');
  menu.refreshMenu();
}

function loginHandler(input: string) {
  // If provider found, open browser for authentication
  if (auth.loginByProviderName(input)) {
    menu.showJWTTokenPrompt((token: string) => {
      app.jwtToken = token;
      auth.saveTokenToFile(token);

      // Reconnect WebSocket with new session cookie
      socket.connect(wsUrl, token);

      auth
        .loginWithToken(token, env.CORS_URL)
        .then((user) => {
          if (user) {
            app.user = user;
          } else {
            console.log('❌ Invalid token or failed to fetch user data');
          }
          menu.refreshMenu();
        })
        .catch(() => {
          console.log('❌ Error during login with token, exiting...');
          process.exit(0);
        });
    });
  }
}
