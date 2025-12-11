import readline from 'readline';
import { Socket, WebSocket } from './plugins/websocket/index.js';
import { formatTime } from './gameUtils.js';

interface ServerState {
  paddleWidth: number;
  paddleHeight: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
  ballPaused: boolean;
  leftY: number;
  rightY: number;
  gamePaused: boolean;
  leftScore: number;
  rightScore: number;
  gameOver: boolean;
  aiEnabled: boolean;
  timeRemaining: number;
  gameStartTime: number;
}

export default class game {
  private socket: Socket;

  private gameState: ServerState;

  private gameInProgress: boolean;
  private CANVAS_WIDTH = 800;
  private CANVAS_HEIGHT = 600;
  private WINDOW_WIDTH = 91;
  private WINDOW_HEIGHT = 34;

  private jwtToken: string;

  constructor(socket: Socket) {
    this.socket = socket;
    this.jwtToken = '';
    this.gameInProgress = false;
    this.gameState = {
      paddleWidth: 10,
      paddleHeight: 100,
      ballX: this.CANVAS_WIDTH / 2,
      ballY: this.CANVAS_HEIGHT / 2,
      ballSpeedX: 0,
      ballSpeedY: 0,
      ballPaused: false,
      leftY: this.CANVAS_HEIGHT / 2 - 50,
      rightY: this.CANVAS_HEIGHT / 2 - 50,
      gamePaused: false,
      leftScore: 0,
      rightScore: 0,
      gameOver: false,
      aiEnabled: false,
      timeRemaining: 180,
      gameStartTime: 0,
    };
  }

  startGameSession(jwtToken: string) {
    this.jwtToken = jwtToken;
    this.gameInProgress = true;

    // // Force terminal window size
    // process.stdout.write(
    //   `\x1b[8;${this.WINDOW_HEIGHT + 10};${this.WINDOW_WIDTH}t`
    // );

    const ws = this.socket.getSocket();

    // Start game session
    ws.send(JSON.stringify({ type: 'connect', jwtToken: this.jwtToken }));

    return new Promise<void>((resolve) => {
      const enableKeyboardInput = () => {
        // Clean up any existing keypress listeners first
        process.stdin.removeAllListeners('keypress');

        // Set up raw mode for game input
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true);
        }
        process.stdin.setEncoding('utf8');

        // Hide cursor and disable echo
        process.stdout.write('\x1B[?25l'); // Hide cursor

        const keypressHandler = (
          _: any,
          key: { name?: string; ctrl?: boolean }
        ) => {
          if (!key) return;
          if (key.name === 'x') {
            this.gameInProgress = false;
            ws.send(JSON.stringify({ type: 'game', action: 'exit' }));
            // Clean up
            if (process.stdin.isTTY) {
              process.stdin.setRawMode(false);
            }
            process.stdin.removeListener('keypress', keypressHandler);
            process.stdin.removeAllListeners('keypress');
            process.stdout.write('\x1B[?25h'); // Show cursor
            resolve();
            return;
          }
          if (key.name === 'w') {
            ws.send(JSON.stringify({ type: 'game', action: 'up' }));
          } else if (key.name === 's') {
            ws.send(JSON.stringify({ type: 'game', action: 'down' }));
          } else if (key.name === 'p') {
            ws.send(JSON.stringify({ type: 'game', action: 'pause' }));
          } else if (key.name === 'r') {
            ws.send(JSON.stringify({ type: 'game', action: 'reset' }));
          }
        };

        process.stdin.on('keypress', keypressHandler);
      };
      const displayBoard = () => {
        // Game title
        console.log(' '.repeat(this.WINDOW_HEIGHT), '🏓 PONG CLI CLIENT 🏓');
        console.log('▁'.repeat(this.WINDOW_WIDTH));
        // Game field (simplified ASCII representation)
        // const width = 91;
        // const height = 34;
        // Calculate positions scaled to ASCII field
        const ballX = Math.floor(
          (this.gameState.ballX / this.CANVAS_WIDTH) * this.WINDOW_WIDTH
        );
        const ballY = Math.floor(
          (this.gameState.ballY / this.CANVAS_HEIGHT) * this.WINDOW_HEIGHT
        );
        const leftPaddleY = Math.floor(
          (this.gameState.leftY / this.CANVAS_HEIGHT) * this.WINDOW_HEIGHT
        );
        const rightPaddleY = Math.floor(
          (this.gameState.rightY / this.CANVAS_HEIGHT) * this.WINDOW_HEIGHT
        );
        // Draw game field
        for (let y = 0; y < this.WINDOW_HEIGHT; y++) {
          let line = '';
          for (let x = 0; x < this.WINDOW_WIDTH; x++) {
            if (x === 0) {
              // Left paddle
              if (y >= leftPaddleY && y < leftPaddleY + 6) {
                line += '█';
              } else {
                line += '🭰';
              }
            } else if (x === this.WINDOW_WIDTH - 1) {
              // Right paddle
              if (y >= rightPaddleY && y < rightPaddleY + 6) {
                line += '█';
              } else {
                line += '🭵';
              }
            } else if (x === Math.floor(this.WINDOW_WIDTH / 2)) {
              // Center line
              line += y % 2 === 0 ? '|' : ' ';
            } else if (
              x === ballX &&
              y === ballY &&
              !this.gameState.ballPaused
            ) {
              // Ball
              line += '●';
            } else {
              line += ' ';
            }
          }
          console.log(line);
        }
        console.log('▔'.repeat(this.WINDOW_WIDTH));
      };

      // Initial draw
      console.clear();
      console.log('🏓 Starting CLI Pong Game...');
      console.log(`Time: ${formatTime(this.gameState.timeRemaining)} ⏱`);
      console.log(
        `Score: ${this.gameState.leftScore} - ${this.gameState.rightScore}`
      );
      displayBoard();
      console.log(
        '\nControls: W/S = Move paddle, P = Pause, R = Reset, X = Exit'
      );

      // Handle incoming messages
      ws.on('message', (msg: WebSocket.RawData) => {
        if (this.gameInProgress === false) return;
        const message = JSON.parse(msg.toString()) as ServerState & {
          type: string;
        };
        if (message.type === 'state') {
          this.gameState = message;
          console.clear();
          console.log(
            `Ball: (${message.ballX.toFixed(2)}, ${message.ballY.toFixed(2)})`
          );
          console.log(
            `Paddles: left ${message.leftY}, right ${message.rightY}`
          );
          displayBoard();
          console.log(`Time: ${formatTime(this.gameState.timeRemaining)} ⏱`);
          console.log(`Score: ${message.leftScore} - ${message.rightScore}`);
        }
      });

      // Handle incoming keypresses
      enableKeyboardInput();
    });
  }
}
