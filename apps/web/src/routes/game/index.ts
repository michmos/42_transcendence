import { draw } from './draw';

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
  type ServerState,
} from './state';

type ServerMessage =
  | (ServerState & { type: 'state' })
  | { type: 'role'; role: string; clientId: string };

const canvas = getCanvas();

function createWebSocket() {
  if (ws) {
    ws.close();
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
    // connectionState = 'connected';
    setConnectionState('connected');
    // reconnectAttempts = 0;
    setReconnectAttempts(0);
    console.log('🏓 Connected to game server');
    // ws.send(JSON.stringify({ type: "connect", clientId }));
    sendMessage({ type: 'connect', clientId });
  };

  socket.onclose = (event) => {
    // connectionState = 'disconnected';
    setConnectionState('disconnected');
    console.log('🔌 Disconnected from server:', event.code, event.reason);

    attemptReconnection();
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data as string) as ServerMessage;

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
      createWebSocket(); // Create entirely new connection
    }, delay)
  );
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', createWebSocket);
} else {
  createWebSocket();
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

document.addEventListener('keydown', (e) => {
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
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('🕶️ Page hidden');
    sendMessage({ type: 'game', action: 'hidden' });
  } else {
    console.log('👓 Page visible');
    sendMessage({ type: 'connect', clientId });
  }
});

function gameLoop() {
  draw();
  requestAnimationFrame(gameLoop);
}

setInterval(() => {
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

gameLoop();
