import { build } from './build.js';

import { env } from './env.js';

import { Socket } from './plugins/websocket/index.js';

import Authenticate from './authentication.js';
import Interface from './interface.js';
import Game from './game.js';

const app = await build();

// Initialize WebSocket connection
const socket = new Socket(`${env.CORS_URL}websocket`);
app.decorate('socket', socket);

const auth = new Authenticate(env.CORS_URL);
const menu = new Interface(await auth.getProviders(env.CORS_URL));
const game = new Game(socket);

try {
  console.log('Connecting to server at', env.CORS_URL);
  await auth.getProviders(env.CORS_URL);
} catch {
  console.error(`Failed to connect to server`, env.CORS_URL, `Exiting...`);
  process.exit(0);
}

// Load JWT token from file if it exists and attempt to authenticate
app.jwtToken = auth.loadTokenFromFile();

// Initialize readline menu
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
