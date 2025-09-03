// Replace with your WebSocket server URL
const socket = new WebSocket('ws://' + window.location.host + '/websocket');

socket.onopen = function () {
  console.log('WebSocket connection established');

  socket.send('Hello Server!');
};

socket.onmessage = function (event) {
  console.log('Message from server:', event.data);
};

socket.onclose = function () {
  console.log('WebSocket connection closed');
};

socket.onerror = function (error) {
  console.error('WebSocket error:', error);
};
