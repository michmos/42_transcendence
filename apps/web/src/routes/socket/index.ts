import Socket from '../../plugins/websocket/index.js';

function updateServerTime(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data);
    if (data && typeof data === 'object' && 'timestamp' in data) {
      const serverTimeElement = document.getElementById('serverTime');
      if (serverTimeElement) {
        const date = new Date(data.timestamp);
        serverTimeElement.textContent = date.toLocaleString();
      }
    }
  } catch {
    // If it's not JSON, it might be a plain text message from server
    const messagesList = document.getElementById('messagesList');
    if (messagesList) {
      const listItem = document.createElement('li');
      listItem.textContent = `Server: ${event.data}`;
      listItem.style.color = 'green';
      listItem.style.marginBottom = '5px';
      messagesList.appendChild(listItem);

      // Auto-scroll to bottom
      messagesList.scrollTop = messagesList.scrollHeight;
    }
    console.log('Received non-JSON message from server:', event.data);
  }
}

function SendMessageToServer() {
  console.log('🔧 Setting up message sending functionality...');

  const sendButton = document.getElementById('sendMessageButton');
  const messageInput = document.getElementById(
    'messageInput'
  ) as HTMLInputElement | null;

  if (!sendButton) {
    console.error('❌ sendMessageButton not found');
    return;
  }

  if (!messageInput) {
    console.error('❌ messageInput not found');
    return;
  }

  console.log('✅ All DOM elements found, setting up event listeners...');

  // Add Enter key support for input field
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendButton.click();
    }
  });

  sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (!message) {
      alert('Please enter a message');
      return;
    }

    if (Socket.isConnected()) {
      console.log('Sending message:', message);
      Socket.sendMessage(message);

      // Display sent message in the messages list
      const listItem = document.createElement('li');
      listItem.textContent = `You: ${message}`;
      listItem.style.color = 'blue';
      listItem.style.marginBottom = '5px';

      // Clear the input field
      messageInput.value = '';
    } else {
      console.error('WebSocket not connected');
      alert('WebSocket is not connected. Please try again later.');
    }
  });

  console.log('✅ Message sending functionality setup complete');
}

// Route initialization function - called by the dynamic route loader
export function initRoute() {
  console.log('🔌 Socket route initializing...');

  // Small delay to ensure DOM is fully ready
  setTimeout(() => {
    console.log('🔌 Socket route DOM setup starting...');

    // Register a WebSocket hook to update server time on the page
    Socket.registerWebSocketHook(updateServerTime);

    // Set up message sending functionality
    SendMessageToServer();

    // Add about-specific class to the app container when this route loads for styling
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.classList.add('about-page');
    }

    console.log('✅ Socket route initialization complete');
  }, 100); // 100ms delay to ensure DOM is ready
}
