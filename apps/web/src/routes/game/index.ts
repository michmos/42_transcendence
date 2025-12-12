import { draw } from './draw';
import { Navbar } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import { handleLogout } from '../../utils/logout-handler.js';
import UserAPI from '../../plugins/api/user.js';
import { leaveMatch } from './buttonLogic.js';
import { getAvatarSrc } from '../../utils/avatar-helpers.js';
import { getIsLocalGame } from '../profile/index.js';

import {
  getCanvas,
  lastServerUpdate,
  ballVelocity,
  localPaddles,
  serverState,
  role,
  setServerState,
  setLastServerUpdate,
  setRole,
  resetCanvas,
  setPlayerNickname,
  setPlayer1Nickname,
  getPlayer1Nickname,
  setPlayer2Nickname,
  getPlayer2Nickname,
  type ServerState,
} from './state';

export interface StateMessage {
  type: 'message';
  data: {
    subtype: 'state';
    serverState: ServerState;
  };
}

export interface RoleMessage {
  type: 'message';
  data: {
    subtype: 'role';
    role: string;
    clientId: string;
  };
}

export interface GenericMessage {
  type: string;
  data: unknown;
}

export interface RoomMessage {
  event: string;
  uuid: string;
}

export type IncomingMessage =
  | StateMessage
  | RoleMessage
  | GenericMessage
  | RoomMessage;

let current_game_room: string = 'game:placeholder';

// --- Type guards ---
function isStateMessage(msg: IncomingMessage): msg is StateMessage {
  return (
    'type' in msg &&
    msg.type === 'message' &&
    typeof msg.data === 'object' &&
    msg.data !== null &&
    (msg.data as { subtype?: string }).subtype === 'state'
  );
}

function isRoomMessage(msg: IncomingMessage): msg is RoomMessage {
  return 'event' in msg && 'uuid' in msg;
}

function isGenericMessage(msg: IncomingMessage): msg is GenericMessage {
  return 'type' in msg && 'data' in msg;
}

function isRoleMessage(msg: IncomingMessage): msg is RoleMessage {
  return (
    'type' in msg &&
    msg.type === 'message' &&
    typeof msg.data === 'object' &&
    msg.data !== null &&
    (msg.data as { subtype?: string }).subtype === 'role'
  );
}

const keys: Record<string, boolean> = {};

let unregisterOnMessageHook: (() => void) | null = null;

export const setupWebSocketHook = () => {
  unregisterOnMessageHook = window.socket.registerWebSocketHook((event) => {
    const message = JSON.parse(event.data as string) as IncomingMessage;

    if (isGenericMessage(message)) {
      if (message.type == 'wait') {
        console.log(message.data);
      }
    }

    // ---- ROOM MESSAGE ----
    if (isRoomMessage(message)) {
      const message = JSON.parse(event.data as string) as RoomMessage;
      switch (message.event) {
        case 'room-created':
          current_game_room = message.uuid;
          console.log('room created', current_game_room);
      }
    }

    // ---- ROLE MESSAGE ----
    if (isRoleMessage(message)) {
      const data = message.data;
      setRole(data.role);

      console.log(
        `🎮 Received role "${data.role}" for client ID: ${data.clientId}`
      );
    }

    // ---- STATE MESSAGE ----
    if (isStateMessage(message)) {
      const data = message.data;
      const newState = data.serverState;

      const now = performance.now();
      const deltaTime = now - lastServerUpdate;

      if (lastServerUpdate > 0 && deltaTime > 0) {
        ballVelocity.x =
          (newState.ballX - serverState.ballX) / (deltaTime / 1000);
        ballVelocity.y =
          (newState.ballY - serverState.ballY) / (deltaTime / 1000);
      }

      setServerState(newState);
      setLastServerUpdate(now);

      if (window.socket.isConnected()) {
        localPaddles.leftY = newState.leftY;
        localPaddles.rightY = newState.rightY;
      }
    }
  });
};

// Store event listener functions so we can remove them
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let keyupHandler: ((e: KeyboardEvent) => void) | null = null;
// let unloadHandler: (() => void) | null = null;

function setupEventListeners() {
  // handle key presses
  keydownHandler = (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'p') {
      sendMessage({ action: 'pause' });
    }
    if (e.key === '.') {
      sendMessage({ action: 'ai' });
    }
  };
  document.addEventListener('keydown', keydownHandler);

  // handle key release
  keyupHandler = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
  };
  document.addEventListener('keyup', keyupHandler);
}

// Cleanup function to close WebSocket when leaving route
let controlsUpdateInterval: ReturnType<typeof setInterval> | null = null;
let gameLoopAnimationFrame: number | null = null;
let inputInterval: ReturnType<typeof setInterval> | null = null;
let isRouteActive = false;

function cleanup() {
  isRouteActive = false;

  // leave match if still inside one
  leaveMatch();

  // Stop game loop
  if (gameLoopAnimationFrame !== null) {
    cancelAnimationFrame(gameLoopAnimationFrame);
    gameLoopAnimationFrame = null;
  }

  // Clear input interval
  if (inputInterval) {
    clearInterval(inputInterval);
    inputInterval = null;
  }

  // Clear intervals
  if (controlsUpdateInterval) {
    clearInterval(controlsUpdateInterval);
    controlsUpdateInterval = null;
  }

  // Remove event listeners
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  if (keyupHandler) {
    document.removeEventListener('keyup', keyupHandler);
    keyupHandler = null;
  }

  // remove on message socket hook
  if (unregisterOnMessageHook) {
    unregisterOnMessageHook();
  }

  // Clear keys state
  Object.keys(keys).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete keys[key];
  });

  // Reset canvas references so they get reinitialized on next visit
  resetCanvas();

  // Clear player nicknames (session-only, cleared when leaving)
  setPlayerNickname(null);
  setPlayer1Nickname(null);
  setPlayer2Nickname(null);
}

// Initialize page structure and game
export default async function initRoute() {
  // Mark route as active
  isRouteActive = true;
  const pageRoot = document.querySelector('.game-page') as HTMLElement;
  if (!pageRoot) {
    console.error('Game page root not found');
    return;
  }

  // Clear and set up page structure
  pageRoot.innerHTML = '';

  // Main wrapper with gradient background
  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'min-h-screen bg-gradient-primary';
  pageRoot.appendChild(mainWrapper);

  // ===== HEADER =====
  const headerContainer = document.createElement('div');
  mainWrapper.appendChild(headerContainer);

  // Fetch user data for navbar
  const userInfo = await UserAPI.getMe();
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [
      { label: 'Tournaments', href: '/tournaments', active: false },
      { label: 'Profile', href: '/profile', active: false },
    ],
    userNickname: userInfo?.nickname || 'Guest',
    userAvatar: getAvatarSrc(userInfo?.avatar),
    onSettingsClick: () => {
      void navigateTo('/settings');
    },
    onLogoutClick: () => {
      void handleLogout();
    },
  });

  // ===== MAIN CONTENT =====
  const mainContent = document.createElement('main');
  mainContent.className =
    'max-w-7xl mx-auto px-6 py-8 flex items-center justify-center';
  mainWrapper.appendChild(mainContent);

  // Canvas container
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'flex flex-col items-center justify-center gap-4';
  mainContent.appendChild(canvasContainer);

  // Create canvas element - MUST exist before game logic tries to access it
  const gameCanvas = document.createElement('canvas');
  gameCanvas.id = 'gameCanvas';
  gameCanvas.width = 800;
  gameCanvas.height = 600;
  gameCanvas.className = 'pong-canvas';
  canvasContainer.appendChild(gameCanvas);

  // Controls display below canvas
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'gameControls';
  controlsContainer.className =
    'flex items-center justify-center gap-8 text-white';
  controlsContainer.style.minHeight = '60px';
  canvasContainer.appendChild(controlsContainer);

  // Leave Match button
  const leaveButtonContainer = document.createElement('div');
  leaveButtonContainer.className = 'mt-4';
  const leaveButton = document.createElement('button');
  leaveButton.className =
    'px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer';
  leaveButton.textContent = 'Leave Match';
  leaveButton.addEventListener('click', () => {
    cleanup();
    navigateTo('/profile');
  });
  leaveButtonContainer.appendChild(leaveButton);
  canvasContainer.appendChild(leaveButtonContainer);

  // Show nickname input dialog before starting game (local = 2 players)
  if (getIsLocalGame()) {
    showLocalGameNicknameDialog(() => {
      // Callback after nicknames are set - initialize game
      console.log('init game called');
      initializeGame();
    });
  } else {
    initializeGame();
  }
}

/**
 * Show nickname input dialog for local game (2 players)
 */
function showLocalGameNicknameDialog(onConfirm: () => void) {
  // Check if nicknames already set (e.g., returning to game)
  const existingPlayer1 = getPlayer1Nickname();
  const existingPlayer2 = getPlayer2Nickname();
  if (existingPlayer1 && existingPlayer2) {
    // Already have nicknames, proceed directly
    onConfirm();
    return;
  }

  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className =
    'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in';
  backdrop.style.animationDuration = '200ms';

  // Create dialog
  const dialog = document.createElement('div');
  dialog.className =
    'bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95';
  dialog.style.animationDuration = '200ms';

  dialog.innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2 text-gray-900">Enter Player Nicknames</h2>
      <p class="text-sm text-gray-600">Enter names for both players (local multiplayer)</p>
    </div>
    
    <div class="space-y-4">
      <div class="space-y-2">
        <label for="player1-nickname-input" class="text-sm font-semibold text-gray-700">Player 1 (W/S keys)</label>
        <input
          id="player1-nickname-input"
          type="text"
          placeholder="Player 1"
          maxlength="20"
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          autofocus
        />
      </div>
      
      <div class="space-y-2">
        <label for="player2-nickname-input" class="text-sm font-semibold text-gray-700">Player 2 (O/L keys)</label>
        <input
          id="player2-nickname-input"
          type="text"
          placeholder="Player 2"
          maxlength="20"
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>
      
      <div class="flex gap-3 pt-4">
        <button 
          id="start-game-btn"
          class="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg cursor-pointer"
        >
          Start Game
        </button>
        <button 
          id="cancel-nickname-btn"
          class="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  `;

  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);

  // Close handlers
  const closeDialog = () => {
    backdrop.classList.add('animate-out', 'fade-out');
    dialog.classList.add('animate-out', 'zoom-out-95');
    setTimeout(() => backdrop.remove(), 200);
  };

  const startGame = () => {
    const player1Input = dialog.querySelector(
      '#player1-nickname-input'
    ) as HTMLInputElement;
    const player2Input = dialog.querySelector(
      '#player2-nickname-input'
    ) as HTMLInputElement;

    const player1Nickname = player1Input.value.trim() || 'Player 1';
    const player2Nickname = player2Input.value.trim() || 'Player 2';

    // Set nicknames (max 20 chars each)
    setPlayer1Nickname(player1Nickname.substring(0, 20));
    setPlayer2Nickname(player2Nickname.substring(0, 20));

    closeDialog();
    onConfirm();
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      // If clicked outside, cancel and go back
      closeDialog();
      navigateTo('/profile');
    }
  });

  const cancelBtn = dialog.querySelector('#cancel-nickname-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      closeDialog();
      navigateTo('/profile');
    });
  }

  const startBtn = dialog.querySelector('#start-game-btn');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }

  // Allow Enter key to start game (from either input)
  const player1Input = dialog.querySelector(
    '#player1-nickname-input'
  ) as HTMLInputElement;
  const player2Input = dialog.querySelector(
    '#player2-nickname-input'
  ) as HTMLInputElement;

  if (player1Input) {
    player1Input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        player2Input?.focus();
      }
    });
  }

  if (player2Input) {
    player2Input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        startGame();
      }
    });
  }
}

function initializeGame() {
  // Get canvas after it's been created
  getCanvas();

  // Setup controls display
  setupControlsDisplay();

  // Setup event listeners
  setupEventListeners();

  // Register cleanup to run when navigating away from this route
  window.router.onBeforeNavigate(cleanup);

  // Setup game input handling
  setupGameInput();

  // Start game loop
  gameLoop();
}

function setupControlsDisplay() {
  const controlsContainer = document.getElementById('gameControls');
  if (!controlsContainer) return;
  controlsContainer.innerHTML = '';

  // Update controls display based on role
  controlsContainer.innerHTML = '';

  if (role === 'player1') {
    controlsContainer.innerHTML = `
      <div class="flex flex-col items-center gap-2">
        <div class="text-lg font-semibold">Left Paddle</div>
        <div class="flex gap-4">
          <div class="flex flex-col items-center gap-1">
            <div class="text-xl">↑</div>
            <div class="text-xs text-white/80">W</div>
          </div>
          <div class="flex flex-col items-center gap-1">
            <div class="text-xl">↓</div>
            <div class="text-xs text-white/80">S</div>
          </div>
        </div>
      </div>
    `;
  } else if (role === 'player2') {
    controlsContainer.innerHTML = `
      <div class="flex flex-col items-center gap-2">
        <div class="text-lg font-semibold">Right Paddle</div>
        <div class="flex gap-4">
          <div class="flex flex-col items-center gap-1">
            <div class="text-xl">↑</div>
            <div class="text-xs text-white/80">W</div>
          </div>
          <div class="flex flex-col items-center gap-1">
            <div class="text-xl">↓</div>
            <div class="text-xs text-white/80">S</div>
          </div>
        </div>
      </div>
    `;
  } else if (role === 'local') {
    controlsContainer.innerHTML = `
      <div class="flex flex-col items-center gap-2">
        <div class="text-lg font-semibold">Left Paddle</div>
        <div class="flex gap-4">
          <div class="flex flex-col items-center gap-1">
            <div class="text-xl">↑</div>
            <div class="text-xs text-white/80">W</div>
          </div>
          <div class="flex flex-col items-center gap-1">
            <div class="text-xl">↓</div>
            <div class="text-xs text-white/80">S</div>
          </div>
        </div>
      </div>
      <div class="text-white/50">|</div>
      <div class="flex flex-col items-center gap-2">
        <div class="text-lg font-semibold">Right Paddle</div>
        <div class="flex gap-4">
          <div class="flex flex-col items-center gap-1">
            <div class="text-xl">↑</div>
            <div class="text-xs text-white/80">O</div>
          </div>
          <div class="flex flex-col items-center gap-1">
            <div class="text-xl">↓</div>
            <div class="text-xs text-white/80">L</div>
          </div>
        </div>
      </div>
    `;
  } else {
    controlsContainer.innerHTML = `
      <div class="text-white/60 text-sm">Spectating - No controls</div>
    `;
  }
}

export function sendMessage(msg: object) {
  window.socket.sendMessage(current_game_room, msg);
}

function gameLoop() {
  if (!isRouteActive) {
    // Stop loop if route is no longer active
    return;
  }

  draw();
  gameLoopAnimationFrame = requestAnimationFrame(gameLoop);
}

function setupGameInput() {
  const canvas = getCanvas();

  // Clear any existing interval first
  if (inputInterval) {
    clearInterval(inputInterval);
  }

  // TODO: stop interval on game over
  inputInterval = setInterval(() => {
    if (!isRouteActive) {
      // Stop if route is no longer active
      return;
    }

    if (
      (role === 'local' || role === 'player1' || role === 'player2') &&
      !serverState.gamePaused &&
      !serverState.gameOver
    ) {
      if (keys['w']) {
        if (role === 'player2' && localPaddles.rightY > 0)
          localPaddles.rightY -= 5;
        else if (localPaddles.leftY > 0) localPaddles.leftY -= 5;
        sendMessage({ action: 'up' });
      }
      if (keys['s']) {
        if (
          role === 'player2' &&
          localPaddles.rightY < canvas.height - serverState.paddleHeight
        )
          localPaddles.rightY += 5;
        else if (localPaddles.leftY < canvas.height - serverState.paddleHeight)
          localPaddles.leftY += 5;
        sendMessage({ action: 'down' });
      }
      if (keys['o'] && role === 'local' && localPaddles.rightY > 0) {
        localPaddles.rightY -= 5;
        sendMessage({ action: 'up_r' });
      }
      if (
        keys['l'] &&
        role === 'local' &&
        localPaddles.rightY < canvas.height - serverState.paddleHeight
      ) {
        localPaddles.rightY += 5;
        sendMessage({ action: 'down_r' });
      }
    }
  }, 1000 / 60);
}
