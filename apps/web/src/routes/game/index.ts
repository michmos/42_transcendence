import { draw } from './draw';

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
  setConnectionState,
} from './state';

import type { ServerState } from './state';

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

export type IncomingMessage = StateMessage | RoleMessage | GenericMessage;

let TEST_ROOM: string = 'game:placeholder';
const canvas = getCanvas();

window.socket.joinRoom('game:online');

window.socket.registerWebSocketHook((event: MessageEvent) => {
	// console.log("hook called");
	const message = JSON.parse(event.data) as { event: string; uuid: string};
	// console.log(message);
	// console.log("message.event: ", message.event);
	switch (message.event) {
		case 'room-created':
			TEST_ROOM = message.uuid;
			console.log('room created', TEST_ROOM);
			// store uuid
	}
})

// --- Type guards ---
function isStateMessage(msg: IncomingMessage): msg is StateMessage {
  return (
    msg.type === 'message' &&
    typeof msg.data === 'object' &&
    msg.data !== null &&
    (msg.data as { subtype?: string }).subtype === 'state'
  );
}

function isRoleMessage(msg: IncomingMessage): msg is RoleMessage {
  return (
    msg.type === 'message' &&
    typeof msg.data === 'object' &&
    msg.data !== null &&
    (msg.data as { subtype?: string }).subtype === 'role'
  );
}

// Register a hook to handle all incoming messages
window.socket.registerWebSocketHook((event) => {
  const message = JSON.parse(event.data as string) as IncomingMessage;

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

  // ---- ROLE MESSAGE ----
  if (isRoleMessage(message)) {
    const data = message.data;
    setRole(data.role);
    console.log(
      `🎮 Received role "${data.role}" for client ID: ${data.clientId}`
    );
  }
});

setConnectionState('connected');

export function sendMessage(msg: object) {
  window.socket.sendMessage(TEST_ROOM, msg);
}

sendMessage({ subtype: 'connect' });


// Keyboard handling
const keys: Record<string, boolean> = {};

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'p') {
    sendMessage({ action: 'pause' });
  }
  if (e.key === 'r') {
    sendMessage({ action: 'reset' });
  }
  if (e.key === '.') {
    sendMessage({ action: 'ai' });
  }
  if (e.key === 'x') {
    console.log('🧪 Simulating connection loss');
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('🕶️ Page hidden');
    sendMessage({ subtype: 'message', data: { action: 'hidden' } });
  } else {
    console.log('👓 Page visible');
    sendMessage({ subtype: 'connect' });
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

gameLoop();
