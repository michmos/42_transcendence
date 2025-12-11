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
  private onMessageCallbacks: Array<(input: Buffer) => void | Promise<void>> =
    [];
  private onCloseCallbacks: (() => void | Promise<void>)[] = [];
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
      this.connected = false;
      for (const callback of this.onCloseCallbacks) {
        Promise.resolve(callback()).catch((error) =>
          this.consoleError(`error on close: ${error}`)
        );
      }
      this.leaveAll();
      this.consoleLog(`connection closed`);
    });

    this.socket.on('message', (input: Buffer) => {
      this.consoleLog(`new message`);
      this.messageQueue.push(input);
      void this.processMessageQueue();
    });
  }

  private async processMessageQueue() {
    if (this.isProcessingQueue) {
      console.log('early return');
      return;
    }
    this.isProcessingQueue = true;

    // process all messages in order of arrival
    while (this.messageQueue.length > 0) {
      const oldestMessage = this.messageQueue.shift();
      if (!oldestMessage) break;

      // apply all onMessage callbacks in order (of registration)
      for (const callback of this.onMessageCallbacks) {
        try {
          Promise.resolve(callback(oldestMessage));
        } catch (error) {
          this.consoleError(`error on message: ${(error as Error).message}`);
          this.sendError('Internal error');
        }
      }
    }
    this.isProcessingQueue = false;
  }

  // add Hooks
  public onClose(callback: () => void | Promise<void>) {
    this.onCloseCallbacks.push(callback);
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

  // TODO: maybe delete throw
  public sendError(message: string) {
    if (!this.connected) {
      throw new Error('Cannot send error: socket is not connected');
    }
    this.send(JSON.stringify({ event: 'error', message }));
  }

  public sendSuccess() {
    if (!this.connected) {
      throw new Error('Cannot send success: socket is not connected');
    }
    this.send(JSON.stringify({ event: 'success' }));
  }

  // general
  public getSocketInstance() {
    return this.socket;
  }
}
