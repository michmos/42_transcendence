import { draw } from './draw';
import { Navbar } from '../../components/index.js';
import { navigateTo } from '../../utils/navigation.js';
import { handleLogout } from '../../utils/logout-handler.js';
import UserAPI from '../../plugins/api/user.js';

import {
  getCanvas,
  clientId,
  lastServerUpdate,
  ballVelocity,
  localPaddles,
  serverState,
  role,
  connectionState,
  reconnectAttempts,
  maxReconnectAttempts,
  reconnectTimeout,
  ws,
  networkBlocked,
  setServerState,
  setLastServerUpdate,
  setRole,
  setConnectionState,
  setReconnectAttempts,
  setWebSocket,
  setReconnectTimeout,
  setNetworkBlocked,
  resetCanvas,
  setPlayerNickname,
  getPlayerNickname,
  setPlayer1Nickname,
  getPlayer1Nickname,
  setPlayer2Nickname,
  getPlayer2Nickname,
} from './state';

// Cleanup function to close WebSocket when leaving route
let controlsUpdateInterval: ReturnType<typeof setInterval> | null = null;
let gameLoopAnimationFrame: number | null = null;
let inputInterval: ReturnType<typeof setInterval> | null = null;
let isRouteActive = false;

// Store event listener functions so we can remove them
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let keyupHandler: ((e: KeyboardEvent) => void) | null = null;
let visibilityChangeHandler: (() => void) | null = null;

function cleanup() {
  isRouteActive = false;

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

  // Close WebSocket connection
  if (ws) {
    try {
      ws.close(1000, 'Route cleanup');
    } catch (e) {
      // Ignore errors when closing
    }
    setWebSocket(undefined as any);
  }

  // Clear any reconnection timeouts
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    setReconnectTimeout(undefined as any);
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
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
    visibilityChangeHandler = null;
  }

  // Reset reconnection attempts
  setReconnectAttempts(0);

  // Clear keys state
  Object.keys(keys).forEach((key) => {
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
  // Cleanup any existing connections first
  cleanup();

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
  const userInfo = await UserAPI.getUserBasicInfo();
  new Navbar(headerContainer, {
    title: 'The Pong Game',
    links: [
      { label: 'Tournaments', href: '/tournaments', active: false },
      { label: 'Profile', href: '/profile', active: false },
    ],
    userNickname: userInfo?.nickname,
    userAvatar: userInfo?.avatar || undefined,
    onSettingsClick: () => {
      navigateTo('/settings');
    },
    onLogoutClick: handleLogout,
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

  // Show nickname input dialog before starting game (local = 2 players)
  showLocalGameNicknameDialog(() => {
    // Callback after nicknames are set - initialize game
    initializeGame();
  });
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
  const canvas = getCanvas();

  // Setup controls display
  setupControlsDisplay();

  // Setup event listeners
  setupEventListeners();

  // Setup game input handling
  setupGameInput();

  // Initialize WebSocket connection
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', createWebSocket);
  } else {
    createWebSocket();
  }

  // Start game loop
  gameLoop();
}

function setupControlsDisplay() {
  const controlsContainer = document.getElementById('gameControls');
  if (!controlsContainer) return;

  // Update controls display based on role
  function updateControls() {
    controlsContainer.innerHTML = '';

    if (role === 'player1') {
      controlsContainer.innerHTML = `
        <div class="flex flex-col items-center gap-2">
          <div class="text-2xl">↑</div>
          <div class="text-sm text-white/80">W</div>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="text-2xl">↓</div>
          <div class="text-sm text-white/80">S</div>
        </div>
      `;
    } else if (role === 'player2') {
      controlsContainer.innerHTML = `
        <div class="flex flex-col items-center gap-2">
          <div class="text-2xl">↑</div>
          <div class="text-sm text-white/80">W</div>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="text-2xl">↓</div>
          <div class="text-sm text-white/80">S</div>
        </div>
      `;
    } else if (role === 'local') {
      controlsContainer.innerHTML = `
        <div class="flex flex-col items-center gap-2">
          <div class="text-lg font-semibold">Left Player</div>
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
          <div class="text-lg font-semibold">Right Player</div>
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

  // Update initially
  updateControls();

  // Watch for role changes and update controls
  let lastRole = role;
  controlsUpdateInterval = setInterval(() => {
    if (role !== lastRole) {
      lastRole = role;
      updateControls();
    }
  }, 100);
}

function createWebSocket() {
  // Don't create WebSocket if route is no longer active
  if (!isRouteActive) {
    console.log('🚫 Skipping WebSocket creation - route no longer active');
    return;
  }

  // Close existing connection if any
  if (ws) {
    try {
      ws.close();
    } catch (e) {
      // Ignore errors when closing
    }
    setWebSocket(undefined as any);
  }

  // If network is blocked, immediately fail
  if (networkBlocked) {
    console.log('🧪 Network blocked - connection attempt failed');
    setConnectionState('disconnected');
    attemptReconnection();
    return;
  }

  setConnectionState('connecting');
  // TODO: Double Websocket connection!? Already established in app.ts and loaded into window.socket

  const socket = new WebSocket(
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`
  );

  socket.onopen = () => {
    // Check if route is still active before proceeding
    if (!isRouteActive) {
      socket.close();
      return;
    }

    setConnectionState('connected');
    setReconnectAttempts(0);
    console.log('🏓 Connected to game server');
    sendMessage({ type: 'connect', clientId });
  };

  socket.onclose = (event) => {
    setConnectionState('disconnected');
    console.log('🔌 Disconnected from server:', event.code, event.reason);

    // Only attempt reconnection if route is still active
    if (isRouteActive) {
      attemptReconnection();
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    // Only update serverState
    if (message.type === 'state') {
      const now = performance.now();
      const deltaTime = now - lastServerUpdate;

      if (lastServerUpdate > 0 && deltaTime > 0) {
        ballVelocity.x =
          (message.ballX - serverState.ballX) / (deltaTime / 1000);
        ballVelocity.y =
          (message.ballY - serverState.ballY) / (deltaTime / 1000);
      }

      setServerState(message);
      setLastServerUpdate(now);

      if (connectionState === 'connected') {
        localPaddles.leftY = serverState.leftY;
        localPaddles.rightY = serverState.rightY;
      }
    }

    // Handle other message types if needed
    if (message.type === 'role') {
      setRole(message.role);
      console.log(
        `🎮 Received role "${message.role}" for client ID: ${message.clientId}`
      );
    }
  };
  setWebSocket(socket);
}

function attemptReconnection() {
  // Don't reconnect if we're not on the game page anymore
  if (!isRouteActive) {
    console.log('🚫 Skipping reconnection - route no longer active');
    return;
  }

  if (reconnectAttempts >= maxReconnectAttempts) {
    setConnectionState('disconnected');
    console.log(
      '⛔ Max reconnection attempts reached. Please refresh the page.'
    );
    return;
  }

  setConnectionState('reconnecting');
  setReconnectAttempts(reconnectAttempts + 1);

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 16000);
  console.log(`🔁 Reconnection attempt ${reconnectAttempts} in ${delay}ms`);

  setReconnectTimeout(
    setTimeout(() => {
      // Check again before reconnecting
      if (isRouteActive) {
        createWebSocket(); // Create entirely new connection
      }
    }, delay)
  );
}

type GameMessage =
  | { type: 'connect'; clientId: string | null }
  | {
      type: 'game';
      action:
        | 'up'
        | 'down'
        | 'up_r'
        | 'down_r'
        | 'pause'
        | 'reset'
        | 'ai'
        | 'hidden';
    };

const inputBuffer: GameMessage[] = [];

export function sendMessage(data: GameMessage) {
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

const keys: Record<string, boolean> = {};

function setupEventListeners() {
  // Create handler functions so we can remove them later
  keydownHandler = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'p') {
      sendMessage({ type: 'game', action: 'pause' });
    }
    if (e.key === 'r') {
      sendMessage({ type: 'game', action: 'reset' });
    }
    if (e.key === '.') {
      sendMessage({ type: 'game', action: 'ai' });
    }
    if (e.key === 'x') {
      if (!networkBlocked) {
        // Simulate network outage
        console.log('🧪 Simulating connection loss');
        setNetworkBlocked(true);

        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close(3000, 'Simulated network error'); // 3000 = custom application-specific close code
        }

        setConnectionState('disconnected');
      } else {
        // Restore network
        console.log('🧪 Network connection restored');
        setNetworkBlocked(false);

        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }

        // Reset reconnection attempts
        setReconnectAttempts(0);
        createWebSocket();
      }
    }
  };

  keyupHandler = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
  };

  visibilityChangeHandler = () => {
    if (!isRouteActive) return; // Don't handle if route is not active

    if (document.hidden) {
      console.log('🕶️ Page hidden');
      sendMessage({ type: 'game', action: 'hidden' });
    } else {
      console.log('👓 Page visible');
      sendMessage({ type: 'connect', clientId });
    }
  };

  document.addEventListener('keydown', keydownHandler);
  document.addEventListener('keyup', keyupHandler);
  document.addEventListener('visibilitychange', visibilityChangeHandler);
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
      if (keys.w) {
        if (role === 'player2' && localPaddles.rightY > 0) {
          localPaddles.rightY -= 5;
        } else if (localPaddles.leftY > 0) {
          localPaddles.leftY -= 5;
        }
        sendMessage({ type: 'game', action: 'up' });
      }
      if (keys.s) {
        if (
          role === 'player2' &&
          localPaddles.rightY < canvas.height - serverState.paddleHeight
        ) {
          localPaddles.rightY += 5;
        } else if (
          localPaddles.leftY <
          canvas.height - serverState.paddleHeight
        ) {
          localPaddles.leftY += 5;
        }
        sendMessage({ type: 'game', action: 'down' });
      }
      if (keys.o) {
        if (role === 'local' && localPaddles.rightY > 0) {
          localPaddles.rightY -= 5;
        }
        sendMessage({ type: 'game', action: 'up_r' });
      }
      if (keys.l) {
        if (
          role === 'local' &&
          localPaddles.rightY < canvas.height - serverState.paddleHeight
        ) {
          localPaddles.rightY += 5;
        }
        sendMessage({ type: 'game', action: 'down_r' });
      }
    }
  }, 1000 / 60);
}
