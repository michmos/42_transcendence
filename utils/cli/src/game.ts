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

interface IncomingMessage {
  type: string;
  room?: string;
  data?: {
    subtype?: string;
    serverState?: ServerState;
    role?: string;
  };
  event?: string;
  uuid?: string;
}

export default class game {
  private socket: Socket;

  private gameState: ServerState;

  private gameInProgress: boolean;
  private waitingForPlayer: boolean;
  private CANVAS_WIDTH = 800;
  private CANVAS_HEIGHT = 600;
  private WINDOW_WIDTH = 91;
  private WINDOW_HEIGHT = 34;

  private jwtToken: string;
  private currentGameRoom: string;
  private isRoomReady: boolean;
  private playerRole: string | null;
  private playerName: string;

  constructor(socket: Socket) {
    this.socket = socket;
    this.jwtToken = '';
    this.gameInProgress = false;
    this.waitingForPlayer = true;
    this.currentGameRoom = 'game:placeholder';
    this.isRoomReady = false;
    this.playerRole = null;
    this.playerName = 'You';
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
    this.waitingForPlayer = true;
    this.isRoomReady = false;

    // Force terminal window size
    process.stdout.write(
      `\x1b[8;${this.WINDOW_HEIGHT + 10};${this.WINDOW_WIDTH}t`
    );

    const ws = this.socket.getSocket();

    // Join online match queue (authentication via session cookie in headers)
    this.socket.joinRoom('game:online');

    return new Promise<void>((resolve) => {
      const keys: Record<string, boolean> = {};
      let inputInterval: NodeJS.Timeout | null = null;

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

          // Handle exit
          if (key.name === 'x') {
            this.gameInProgress = false;
            if (this.isRoomReady) {
              this.socket.leaveRoom(this.currentGameRoom);
            }
            // Clean up
            if (inputInterval) {
              clearInterval(inputInterval);
              inputInterval = null;
            }
            if (process.stdin.isTTY) {
              process.stdin.setRawMode(false);
            }
            process.stdin.removeListener('keypress', keypressHandler);
            process.stdin.removeAllListeners('keypress');
            process.stdout.write('\x1B[?25h'); // Show cursor
            resolve();
            return;
          }

          // Track key state
          if (key.name === 'w' || key.name === 's') {
            keys[key.name] = true;
          }

          // Handle pause and reset (immediate actions)
          if (key.name === 'p') {
            if (this.isRoomReady && this.socket.isConnected()) {
              this.socket.sendMessage(this.currentGameRoom, {
                action: 'pause',
              });
            }
          } else if (key.name === 'r') {
            if (this.isRoomReady && this.socket.isConnected()) {
              this.socket.sendMessage(this.currentGameRoom, {
                action: 'reset',
              });
            }
          }
        };

        const keyupHandler = (_: any, key: { name?: string }) => {
          if (!key) return;
          if (key.name === 'w' || key.name === 's') {
            keys[key.name] = false;
          }
        };

        process.stdin.on('keypress', keypressHandler);

        // Setup continuous input sending at 60Hz (like web client)
        inputInterval = setInterval(() => {
          if (!this.gameInProgress || !this.isRoomReady) {
            return;
          }

          if (
            this.socket.isConnected() &&
            !this.gameState.gamePaused &&
            !this.gameState.gameOver
          ) {
            if (keys['w']) {
              this.socket.sendMessage(this.currentGameRoom, { action: 'up' });
            }
            if (keys['s']) {
              this.socket.sendMessage(this.currentGameRoom, { action: 'down' });
            }
          }
        }, 1000 / 60);
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
      if (this.waitingForPlayer) {
        console.log('\n⏳ Waiting for opponent to join...\n');
      }
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

        const message = JSON.parse(msg.toString()) as IncomingMessage;

        // Handle wait message
        if (message.type === 'wait') {
          console.log('\n⏳ Waiting for opponent...\n');
          return;
        }

        // Handle room-created event
        if (message.event === 'room-created' && message.uuid) {
          this.currentGameRoom = message.uuid;
          this.isRoomReady = true;
          console.log(`\n✓ Joined game room: ${this.currentGameRoom}\n`);
          return;
        }

        // Handle role assignment
        if (
          message.type === 'message' &&
          message.data?.subtype === 'role' &&
          message.data.role
        ) {
          this.playerRole = message.data.role;
          console.log(`\n🎮 Your role: ${this.playerRole}\n`);
          return;
        }

        // Handle state updates
        if (
          message.type === 'message' &&
          message.data?.subtype === 'state' &&
          message.data.serverState
        ) {
          this.waitingForPlayer = false;
          this.gameState = message.data.serverState;

          // Redraw game board
          console.clear();

          // Display player names based on role
          const leftPlayer =
            this.playerRole === 'player1' ? this.playerName : 'Opponent';
          const rightPlayer =
            this.playerRole === 'player2' ? this.playerName : 'Opponent';

          console.log(`🎮 ${leftPlayer} vs ${rightPlayer}`);
          displayBoard();
          console.log(`Time: ${formatTime(this.gameState.timeRemaining)} ⏱`);
          console.log(
            `Score: ${this.gameState.leftScore} (${leftPlayer}) - ${this.gameState.rightScore} (${rightPlayer})`
          );

          // Check if game is over
          if (this.gameState.gameOver) {
            console.log('\n🏁 Game Over!');
            const winner =
              this.gameState.leftScore > this.gameState.rightScore
                ? leftPlayer
                : rightPlayer;
            console.log(`🏆 Winner: ${winner}`);
            console.log('\nPress X to exit');
          }
        }
      });

      // Handle incoming keypresses
      enableKeyboardInput();
    });
  }
}
