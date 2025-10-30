import { draw } from './draw';

import {
  canvas,
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
  setNetworkBlocked
} from './state';

// const ws = new WebSocket("ws://10.11.4.4:3001/"); // Hardcoded network IP
function createWebSocket() {
	if (ws) {
		ws.close();
	}

	// If network is blocked, immediately fail
	if (networkBlocked) {
		console.log('🧪 Network blocked - connection attempt failed');
		// connectionState = 'disconnected';
		setConnectionState('disconnected');
		
		attemptReconnection();
		return;
	}

	// connectionState = 'connecting';
	setConnectionState('connecting');
	// ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`);
	setWebSocket(new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`));
	
	ws.onopen = () => {
		// connectionState = 'connected';
		setConnectionState('connected');
		// reconnectAttempts = 0;
		setReconnectAttempts(0);
		console.log('🏓 Connected to game server');
		// ws.send(JSON.stringify({ type: "connect", clientId }));
		sendMessage({ type: "connect", clientId });
	}
	
	ws.onclose = (event) => {
		// connectionState = 'disconnected';
		setConnectionState('disconnected');
		console.log('🔌 Disconnected from server:', event.code, event.reason);
	
		attemptReconnection();
	}
	
	ws.onerror = (error) => {
		console.error('WebSocket error:', error);
	}
	
	ws.onmessage = (event) => {
	  const message = JSON.parse(event.data);
	  
	  // Only update serverState
	  if (message.type === 'state') {
		const now = performance.now();
		const deltaTime = now - lastServerUpdate;

		if (lastServerUpdate > 0 && deltaTime > 0) {
			ballVelocity.x = (message.ballX - serverState.ballX) / (deltaTime / 1000);
			ballVelocity.y = (message.ballY - serverState.ballY) / (deltaTime / 1000);
		}

		// serverState = message;
		setServerState(message);
		// lastServerUpdate = now;
		setLastServerUpdate(now);

		if (connectionState === 'connected') {
			localPaddles.leftY = serverState.leftY;
			localPaddles.rightY = serverState.rightY;
		}
		// draw();
	  }
	  
	  // Handle other message types if needed
	  if (message.type === 'role') {
		// role = message.role;
		setRole(message.role);
		console.log(`🎮 Received role "${message.role}" for client ID: ${message.clientId}`);
	  }
	};
}

function attemptReconnection() {
	
	if (reconnectAttempts >= maxReconnectAttempts) {
		// connectionState = 'disconnected';
		setConnectionState('disconnected');
		console.log('⛔ Max reconnection attempts reached. Please refresh the page.');
		return;
	}
	
	// connectionState = 'reconnecting';
	setConnectionState('reconnecting');
	// reconnectAttempts++;
	setReconnectAttempts(reconnectAttempts + 1);
	
	const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 16000);
	console.log(`🔁 Reconnection attempt ${reconnectAttempts} in ${delay}ms`);
	
	// reconnectTimeout = setTimeout(() => {
	// 	createWebSocket(); // Create entirely new connection
	// }, delay);
	setReconnectTimeout(setTimeout(() => {
		createWebSocket(); // Create entirely new connection
	}, delay));
}

createWebSocket();

let inputBuffer: any[] = [];

export function sendMessage(data: any) {
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

const keys: { [key: string]: boolean } = {};

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "p") {
	// ws.send(JSON.stringify({ game: "pause"}));
	sendMessage({ game: "pause"});
  }
  if (e.key === "r") {
	// ws.send(JSON.stringify({ game: "reset"}));
	sendMessage({ game: "reset"});
  }
  if (e.key === ".") {
	// ws.send(JSON.stringify({ game: "ai"}));
	sendMessage({ game: "ai"});
  }
  if (e.key === "x") {
	if (!networkBlocked) {
		// Simulate network outage
		console.log("🧪 Simulating connection loss");
		// networkBlocked = true;
		setNetworkBlocked(true);

		if (reconnectTimeout) {
        	clearTimeout(reconnectTimeout);
      	}

		if (ws && ws.readyState === WebSocket.OPEN) {
		  ws.close(3000, 'Simulated network error'); // 1006 = abnormal closure
		}

		// connectionState = 'disconnected';
		setConnectionState('disconnected');
    } else {
		// Restore network
		console.log("🧪 Network connection restored");
		// networkBlocked = false;
		setNetworkBlocked(false);

		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
      	}

		// Reset reconnection attempts
		// reconnectAttempts = 0;
		setReconnectAttempts(0);
		createWebSocket();
	}
  }
})

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
})

document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		console.log('🕶️ Page hidden');
		// ws.send(JSON.stringify({ game: "hidden"}));
		sendMessage({ game: "hidden"});
	}
	else {
		console.log('👓 Page visible');
		// ws.send(JSON.stringify({ type: "connect", clientId }));
		sendMessage({ type: "connect", clientId });
	}
})

function gameLoop() {
	draw();
	requestAnimationFrame(gameLoop);
}

setInterval(() => {
	if ((role === 'local' || role === 'player1' || role === 'player2') && !serverState.gamePaused && !serverState.gameOver) {
		if (keys.w) {
			// ws.send(JSON.stringify({ type: "move", action: "up"}));
			if (role === 'player2' && localPaddles.rightY > 0) {
				localPaddles.rightY -= 5;
			} else if ( localPaddles.leftY > 0) {
				localPaddles.leftY -= 5;
			}
			sendMessage({ type: "move", action: "up"});
		}
		if (keys.s) {
			// ws.send(JSON.stringify({ type: "move", action: "down"}));
			if (role === 'player2' && localPaddles.rightY < (canvas.height - serverState.paddleHeight)) {
				localPaddles.rightY += 5;
			} else if ( localPaddles.leftY < (canvas.height - serverState.paddleHeight)) {
				localPaddles.leftY += 5;
			}
			sendMessage({ type: "move", action: "down"});
		}
		if (keys.o) {
			// ws.send(JSON.stringify({ type: "move", right: "up"}));
			if (role === 'local' && localPaddles.rightY > 0) {
				localPaddles.rightY -= 5;
			}
			sendMessage({ type: "move", right: "up"});
		}
		if (keys.l) {
			// ws.send(JSON.stringify({ type: "move", right: "down"}));
			if (role === 'local' && localPaddles.rightY < (canvas.height - serverState.paddleHeight)) {
				localPaddles.rightY += 5;
			}
			sendMessage({ type: "move", right: "down"});
		}
	}
}, 1000 / 60);

gameLoop();

// import {
//   PageContainer,
//   Card,
//   KeyValueList,
//   Button,
//   HeaderBar,
// } from '../../components/index.js';

// export default function initRoute() {
//   const pageRoot = document.querySelector('.game-page') as HTMLElement | null;
//   if (!pageRoot) return;
//   pageRoot.innerHTML = '';
//   const container = new PageContainer(pageRoot, {
//     maxWidth: 'xl',
//     padding: 'lg',
//   });

//   const header = document.createElement('div');
//   container.getContentElement()?.appendChild(header);
//   new HeaderBar(header, {
//     title: 'Game',
//     links: [
//       { label: 'Dashboard', href: '/dashboard' },
//       { label: 'Tournaments', href: '/tournaments' },
//     ],
//     onNavigate: (href) =>
//       window.navigateToRoute && window.navigateToRoute(href),
//   });

//   const lobby = document.createElement('div');
//   container.getContentElement()?.appendChild(lobby);
//   const lobbyCard = new Card(lobby, { variant: 'default', title: 'Lobby' });
//   const lobbyBody = lobbyCard.getBodyElement();
//   if (lobbyBody) {
//     lobbyBody.classList.add('flex', 'gap-3');
//     const b1 = document.createElement('div');
//     new Button(b1, {
//       text: 'Ready',
//       variant: 'primary',
//       onClick: () => {
//         console.log('Ready clicked');
//       },
//     });
//     lobbyBody.appendChild(b1);
//     const b2 = document.createElement('div');
//     new Button(b2, {
//       text: 'Invite Friends',
//       variant: 'ghost',
//       onClick: () => {
//         console.log('Invite clicked');
//       },
//     });
//     lobbyBody.appendChild(b2);
//   }

//   const canvasWrap = document.createElement('div');
//   container.getContentElement()?.appendChild(canvasWrap);
//   const canvasCard = new Card(canvasWrap, { title: 'Game' });
//   const canvasBody = canvasCard.getBodyElement();
//   if (canvasBody) {
//     const ph = document.createElement('div');
//     ph.className = 'canvas-placeholder';
//     canvasBody.appendChild(ph);
//   }

//   const hudWrap = document.createElement('div');
//   container.getContentElement()?.appendChild(hudWrap);
//   const hudCard = new Card(hudWrap, { title: 'HUD' });
//   const hudBody = hudCard.getBodyElement();
//   if (hudBody) {
//     const kvHost = document.createElement('div');
//     new KeyValueList(kvHost, {
//       items: [
//         { key: 'Score', value: '0 - 0' },
//         { key: 'Timer', value: '—' },
//         { key: 'Players', value: 'You vs Opponent' },
//       ],
//     });
//     hudBody.appendChild(kvHost);
//   }

//   // Back to Home link for reviewers
//   const back = document.createElement('nav');
//   back.className = 'mt-6';
//   back.innerHTML = '<a href="/" data-link>← Back to Home</a>';
//   container.getContentElement()?.appendChild(back);
// }
