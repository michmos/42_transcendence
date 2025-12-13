import readline from 'readline';

export default class Interface {
  private rl: readline.Interface;
  private menuOptions: Map<string, (line: string) => void> = new Map();
  private loginHandler: ((line: string) => void) | null = null;
  private providers: Array<{ name: string; buttonUri: string }> = [];
  private tokenGetter: (() => string | null) | null = null;
  private isPaused: boolean = false;

  constructor(providers: Array<{ name: string; buttonUri: string }> = []) {
    this.providers = providers;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });

    this.setupEventListeners();
  }

  close() {
    this.rl.close();
  }

  pause() {
    this.isPaused = true;
    // Clear the prompt line
    if (process.stdout.isTTY) {
      process.stdout.write('\r\x1b[K');
    }
    // Remove event listeners before closing to prevent triggering events
    this.rl.removeAllListeners('line');
    this.rl.removeAllListeners('close');
    // Close readline to release stdin completely
    this.rl.close();
    // Ensure stdin is still available for the game
    process.stdin.resume();
  }

  resume() {
    this.isPaused = false;

    // Ensure stdin is in proper state before recreating readline
    if (process.stdin.isTTY && process.stdin.isRaw) {
      process.stdin.setRawMode(false);
    }

    // Remove any leftover keypress listeners from game
    process.stdin.removeAllListeners('keypress');

    // Show cursor again
    process.stdout.write('\x1B[?25h');

    // Recreate the readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });

    // Re-attach the event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle user input
    this.rl.on('line', (line: string) => {
      // Ignore input if paused
      if (this.isPaused) {
        return;
      }

      const input = line.trim();

      // Check if the input matches any registered menu option
      if (this.menuOptions.has(input)) {
        const handler = this.menuOptions.get(input);
        if (handler) {
          return handler(line);
        }
      }

      // Handle special cases like login
      if (input.startsWith('login ') && this.loginHandler) {
        this.loginHandler(input.slice(5).trim());
        return;
      }

      // Unknown command
      this.refreshMenu();
    });

    this.rl.on('close', () => {
      // Only exit if we're not paused (paused means we closed it intentionally for game)
      if (!this.isPaused) {
        console.log('Exiting CLI application. Goodbye!');
        process.exit(0);
      }
    });
  }

  showMenu() {
    // Clear the console
    console.clear();

    const jwtToken = this.tokenGetter ? this.tokenGetter() : null;

    console.log('Commands available:');
    console.log('- exit: Quit the CLI application');
    if (jwtToken) {
      console.log(`- game: Start a new CLI game session`);
      console.log(`- logout: Log out\n\n`);
    } else {
      for (const provider of this.providers) {
        console.log(
          `- login ${provider.name}: Authenticate via ${provider.name}`
        );
      }
    }

    // Display the prompt
    this.rl.prompt();
  }

  clearMenu() {
    this.rl.removeAllListeners('line');
    this.rl.removeAllListeners('close');
  }

  refreshMenu() {
    // Remove all previous listeners to avoid duplicates
    this.clearMenu();
    // Re-setup event listeners
    this.setupEventListeners();
    this.showMenu();
  }

  showJWTTokenPrompt(callback: (token: string) => void) {
    this.rl.question('Copy/Paste received token here: ', (token) => {
      callback(token.trim());
      this.showMenu();
    });
  }

  setTokenGetter(getter: () => string | null) {
    this.tokenGetter = getter;
    return this;
  }

  registerMenuOption(option: string, handler: (line: string) => void) {
    this.menuOptions.set(option, handler);
    return this;
  }

  registerLoginHandler(handler: (line: string) => void) {
    this.loginHandler = handler;
    return this;
  }
}
