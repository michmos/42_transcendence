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
} from './state';

type GameMessage =
  | { type: 'connect'; data: { clientId: string | null } }
  | {
      type: 'message';
      data: {
        action:
          | 'up'
          | 'down'
          | 'up_r'
          | 'down_r'
          | 'pause'
          | 'reset'
          | 'ai'
          | 'hidden';
      }
    };

const inputBuffer: GameMessage[] = [];

const canvas = getCanvas();
const TEST_ROOM = "game:testRoom";

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
  const socket = new WebSocket(
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`
  );

  socket.onopen = () => {
    // connectionState = 'connected';
    setConnectionState('connected');
    // reconnectAttempts = 0;
    setReconnectAttempts(0);
    console.log('🏓 Connected to game server');
    // ws.send(JSON.stringify({ type: "connect", room: TEST_ROOM, data: { clientId }}));
    sendMessage({ type: 'connect', data: { clientId } });
    // Flush buffered messages
    while (inputBuffer.length > 0) {
      const bufferedMessage = inputBuffer.shift();
      if (bufferedMessage) {
        const bufferedStructured = {
          type: bufferedMessage.type,
          room: TEST_ROOM,
          data: bufferedMessage.data,
        };
        console.log("Sending buffered message:", bufferedStructured);
        ws.send(JSON.stringify(bufferedStructured));
      }
    }
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
    const message = JSON.parse(event.data);

    // Only update serverState
    if (message.type === 'message' && message.data.subtype === 'state') {
      const now = performance.now();
      const deltaTime = now - lastServerUpdate;

      const newState = message.data.serverState;

      if (lastServerUpdate > 0 && deltaTime > 0) {
        ballVelocity.x =
          (newState.ballX - serverState.ballX) / (deltaTime / 1000);
        ballVelocity.y =
          (newState.ballY - serverState.ballY) / (deltaTime / 1000);
      }

      setServerState(newState);
      setLastServerUpdate(now);

      if (connectionState === 'connected') {
        localPaddles.leftY = newState.leftY;
        localPaddles.rightY = newState.rightY;
      }
    }

    // Handle other message types if needed
    if (message.type === 'message' && message.data.subtype === 'role') {
      setRole(message.data.role);
      console.log(
        `🎮 Received role "${message.data.role}" for client ID: ${message.data.clientId}`
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

export function sendMessage(msg: GameMessage) {
  
	const structuredMessage = {
		type: msg.type,
		room: TEST_ROOM,
		data: msg.data,
	};

	if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(structuredMessage));

    // Send any buffered messages
    while (inputBuffer.length > 0) {
      const bufferedMessage = inputBuffer.shift();
      if (bufferedMessage) {
        const bufferedStructured = {
          type: bufferedMessage.type,
          room: TEST_ROOM,
          data: bufferedMessage.data,
        };
        console.log("bufferedmessage: ", bufferedStructured);
        ws.send(JSON.stringify(bufferedStructured));
      }
    }
  } else if (connectionState === 'reconnecting') {
    // Buffer the message for when connection is restored
    inputBuffer.push(msg);
    console.log('Buffering message during reconnection:', msg);
  } else {
    console.warn('WebSocket not connected, message not sent:', msg);
  }
}

const keys: Record<string, boolean> = {};

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'p') {
    sendMessage({ type: 'message', data: { action: 'pause' }});
  }
  if (e.key === 'r') {
    sendMessage({ type: 'message', data: { action: 'reset' }});
  }
  if (e.key === '.') {
    sendMessage({ type: 'message', data: { action: 'ai' }});
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
    sendMessage({ type: 'message', data: { action: 'hidden' }});
  } else {
    console.log('👓 Page visible');
    sendMessage({ type: 'connect', data: { clientId }});
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
      sendMessage({ type: 'message', data: { action: 'up' }});
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
      sendMessage({ type: 'message', data: { action: 'down' }});
    }
    if (keys.o) {
      if (role === 'local' && localPaddles.rightY > 0) {
        localPaddles.rightY -= 5;
      }
      sendMessage({ type: 'message', data: { action: 'up_r' }});
    }
    if (keys.l) {
      if (
        role === 'local' &&
        localPaddles.rightY < canvas.height - serverState.paddleHeight
      ) {
        localPaddles.rightY += 5;
      }
      sendMessage({ type: 'message', data: { action: 'down_r' }});
    }
  }
}, 1000 / 60);

gameLoop();
