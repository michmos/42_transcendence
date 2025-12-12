import type { User } from 'db/generated/client/index.js';

import { exec } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export default class Authenticate {
  private providers: Array<{ name: string; buttonUri: string }> = [];
  private hostname: string = '';
  private jwtToken: string | null = null;

  constructor(hostname: string) {
    this.hostname = hostname;
  }

  findProviderByName(
    name: string
  ): { name: string; buttonUri: string } | undefined {
    return this.providers.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
  }

  loginByProviderName(name: string) {
    const provider = this.findProviderByName(name);
    if (provider) {
      const separator = provider.buttonUri.includes('?') ? '&' : '?';
      const url = `${this.hostname}${provider.buttonUri}${separator}cli=true`;
      console.log(`🔗 Open in browser: `, url);
      this.openBrowser(encodeURI(url));
      return true;
    } else {
      console.log(`Provider ${name} not found.`);
      return false;
    }
  }

  async getProviders(hostname: string) {
    const response = await fetch(`${hostname}api/auth/providers`, {
      method: 'GET',
    });

    if (response.status !== 200) {
      console.log(
        `Failed to fetch providers from server. Status code: ${response.status}`
      );
      process.exit(0);
    }
    const data = (await response.json()) as
      | Array<{
          name: string;
          buttonUri: string;
        }>
      | { providers: Array<{ name: string; buttonUri: string }> };

    const providersArray = Array.isArray(data) ? data : (data.providers ?? []);

    this.providers.splice(0, this.providers.length, ...providersArray);
    return this.providers;
  }

  async loginWithToken(token: string, hostname: string): Promise<User | null> {
    try {
      const data = await fetch(`${hostname}api/auth/session`, {
        method: 'GET',
        headers: {
          Cookie: `session=${token}`,
          credentials: 'include',
        },
      });
      if (data.status !== 200) {
        console.error(`Authentication failed with status code: ${data.status}`);
        return null;
      }
      const user = (await data.json()) as User;
      if (!user || !user.uuid) {
        console.error('Authentication failed: No user data received');
        return null;
      } else {
        console.log(
          `\n\n\n🎉🎉🎉 Welcome to Transcendece CLI, ${user.fullName} 🎉🎉🎉\n\n\n`
        );
        return user;
      }
    } catch (error) {
      console.error('Error during authentication:', error);
    }
    return null;
  }

  openBrowser(url: string) {
    const start =
      process.platform === 'win32'
        ? 'start'
        : process.platform === 'darwin'
          ? 'open'
          : 'xdg-open';
    exec(`${start} "${url}"`);
    return this;
  }

  saveTokenToFile(token: string) {
    const homeDir = os.homedir();
    const tokenFilePath = path.join(homeDir, '.transcendence_cli_token');

    fs.writeFileSync(tokenFilePath, token, { encoding: 'utf-8', flag: 'w' });
    return this;
  }

  loadTokenFromFile(): string | null {
    const homeDir = os.homedir();
    const tokenFilePath = path.join(homeDir, '.transcendence_cli_token');

    if (fs.existsSync(tokenFilePath)) {
      this.jwtToken = fs.readFileSync(tokenFilePath, { encoding: 'utf-8' });

      return this.jwtToken.trim();
    }
    return null;
  }
}
