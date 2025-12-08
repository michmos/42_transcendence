import RoomManager, { type Room } from './RoomManager.js';
import { type WebSocket } from 'ws';
import User, { getUser } from './User.js';

export interface SocketMetaData {
  uuid?: string;
  lastSeen?: Date;
  connected?: boolean;
}

export default class WSocket {
  private socket: WebSocket;
  private user: User | null;
  private messageQueue: Buffer[] = [];
  private onMessageCallbacks: ((input: Buffer) => void | Promise<void>)[] = [];
  private isProcessingQueue: boolean = false;

  public uuid: string;
  public jwt: string;
  public lastSeen?: Date;
  public connected: boolean;

  constructor(socket: WebSocket, uuid: string, jwt: string) {
    this.socket = socket;
    this.uuid = uuid;
    this.jwt = jwt;
    this.connected = true;
    this.user = getUser(this);

    this.socket.on('close', () => {
      this.user?.removeSocket(this);
      this.user = null;
      this.leaveAll();
      this.connected = false;
      this.consoleLog(`connection closed`);
    });

    this.socket.on('message', async (input: Buffer) => {
      this.consoleLog(`new message`);
      this.messageQueue.push(input);
      this.processMessageQueue();
    });
  }

  private async processMessageQueue() {
    if (this.isProcessingQueue) {
      return;
    }

    // process all messages in order of arrival
    while (this.messageQueue.length > 0) {
      const oldestMessage = this.messageQueue.shift();
      if (!oldestMessage) break;

      // apply all onMessage callbacks in order (of registration)
      for (const callback of this.onMessageCallbacks) {
        try {
          await Promise.resolve(callback(oldestMessage));
        } catch (error) {
          this.consoleError(`error on message: ${error}`);
          this.sendError('Internal error');
        }
      }
    }
    this.isProcessingQueue = false;
  }

  // add Hooks
  public onClose(callback: () => void | Promise<void>) {
    this.socket.on('close', () => {
      Promise.resolve(callback()).catch((error) =>
        this.consoleError(`error on close: ${error}`)
      );
    });
  }

  public onMessage(callback: (input: Buffer) => void | Promise<void>) {
    this.onMessageCallbacks.push(callback);
  }

  // User
  public getUser() {
    return this.user;
  }

  // formatted logging
  public consoleLog(message: string) {
    console.log(`[${this.uuid}]: ${message}`);
  }

  public consoleError(message: string) {
    console.error(`[${this.uuid}]: ${message}`);
  }

  // room operations
  public join(name: string): Room {
    if (!this.connected) {
      throw new Error('Cannot join room: socket is not connected');
    }
    return RoomManager.joinRoom(this, name);
  }

  public leave(name: string) {
    RoomManager.leaveRoom(this, name);
  }

  public leaveAll() {
    RoomManager.leaveAllRooms(this);
  }

  public isInRoom(name: string) {
    return RoomManager.get(name)?.has(this) === true;
  }

  // data operations
  public set(data: Partial<SocketMetaData>) {
    if (data.uuid !== undefined) this.uuid = data.uuid;
    if (data.lastSeen !== undefined) this.lastSeen = data.lastSeen;
    if (data.connected !== undefined) this.connected = data.connected;
  }

  // communication
  public send(message: string) {
    if (!this.connected) {
      throw new Error('Cannot send message: socket is not connected');
    }
    this.socket.send(message);
  }

  public sendError(message: string) {
    if (!this.connected) {
      throw new Error('Cannot send error: socket is not connected');
    }
    this.send(JSON.stringify({ status: 'error', message }));
  }

  public sendSuccess() {
    if (!this.connected) {
      throw new Error('Cannot send success: socket is not connected');
    }
    this.send(JSON.stringify({ status: 'success' }));
  }

  // general
  public getSocketInstance() {
    return this.socket;
  }
}
