import readline from 'readline';

export default class Interface {
  private rl: readline.Interface;
  private menuOptions: Map<string, (line: string) => void> = new Map();
  private loginHandler: ((line: string) => void) | null = null;
  private providers: Array<{ name: string; buttonUri: string }> = [];
  private tokenGetter: (() => string | null) | null = null;

  constructor(providers: Array<{ name: string; buttonUri: string }> = []) {
    this.providers = providers;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });
  }

  close() {
    this.rl.close();
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

    // Handle user input
    this.rl.on('line', (line: string) => {
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
      console.log('Exiting CLI application. Goodbye!');
    });
  }

  clearMenu() {
    this.rl.removeAllListeners('line');
    this.rl.removeAllListeners('close');
  }

  refreshMenu() {
    // Remove all previous listeners to avoid duplicates
    this.clearMenu();
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
