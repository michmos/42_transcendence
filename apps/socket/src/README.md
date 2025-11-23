# WebSocket Room Management

## Structure

### Message structure

Each receiving socket message should have the following structure:

```json
// normal message
{
  "type": "join-room" | 'leave-room' | 'message'    // The message type
  "room": "string",                                 // The room identifier
  "data"?: {                                      // The payload data
    // event-specific data
  }
}
```

Incoming messages will be checked for that structure and rejected otherwise

### Room structure

Rooms can have all sorts of names since we might want to create many (e.g. a separate room for each match)
But somewhere the logic needs to be handled -> this is where handlers come into play
Each room name needs to follow the following structure:

```
room: <handlerName>:<extension>

//e.g.
room: tournament:main
room: tournament:c75f7c66-e858-47d6-bb82-7ea5547c800c
room: match:main
room: match:d13f7c68-e858-27d1-bb82-7333444c8003
```

So the room name specifies the handler!

When a new message is received, the handler name is extracted from the room name and the corresponding handler is invoked.

## Creating a new handler

1. add a directory under `src/roomHandlers/` with the handler name
   _! ATTENTION: this is the name that will be used to map the handler_
2. add your logic
   _important_: there must be an `index.ts` file with a default export of the following type:

   ```ts
   import { type SocketMessage } from '../../plugins/rooms/index.js';
   import { WSocket } from '../../plugins/rooms/WSocket/index.js';

   export default {
     onStartup: async () => {
       console.log('This code is being run on server start');
       // e.g. fetching api for ongoing tournaments
     },
     onOpen: (socket: WSocket) => {
       console.log('This code is run if a socket connects to the server');
       // socket.join('tournament:main');
     },
     onMessage: (socket: WSocket, message: SocketMessage) => {
       console.log(
         'This code is run if a socket sends a message TO THIS HANDLER'
       );
       // e.g. Tournament logic (create tournament, join tournament, leave tournament)
     },
     onClose: (socket: WSocket) => {
       console.log('This code is run if a socket disconnects from a server');
       // e.g. remove him from tournament rooms (or leave him in)
     },
   };
   ```

**!! I included ? to express that all fields are optional -> you can create a handler that just has logic for `onMessage` or `onOpen` if you want!!**
That's all you need to do! The system will automatically pick up the new handler and route messages accordingly.

### Responsibilities

**Each handler is responsible for:**

- Validating if the room exists (and how to handle if not)
  (see further down)

* Validating if the socket is allowed to perform the action in the room
  (e.g. 'message' or 'leave-room' in a room you are not part of)

- Handling the message according to its type

- Dealing with multiple socket connections to the same client (use: User api for bulk operations (see further below))

- handling reconnectsj

**What is already done preHandler:**

- Validate message against type (see defined above)
- authenticate user / socket
- log changes in connection state and messages
- catch errors and send default error message to client

## WSocket API

Consists of three different levels:

1. Socket level: individual socket connection
2. User level: collection of connected sockets from the same user
3. Room level: collection of sockets based on rooms

Depending on the level the operations have a different meaning ->
socket.send sends a message to that socket
user.send sends a message to all sockets of that user
room.send sends a message to all sockets in that room

### 1. WSocket

For details check out `src/plugins/rooms/WSocket/Socket.ts`

WSocket is a wrapper class around the native WebSocket that adds:

- room management
- metadata -> uuid, connected, lastSeen
- auto logging (messages, closure)
- default error handling

```ts
  socket.join(name: string); // join room or create if not exists
  socket.leave(name: string); // leave room
  socket.leaveAll(); // leave all rooms
  socket.isInRoom(name: string); boolean;
  socket.send(message: string);
  socket.sendError(message: string);
  socket.sendSuccess(); // send a simple success message
  socket.getUser();;  // returns the User object to which this socket belongs

  socket.uuid; // string
  socket.lastSeen; // Date
  socket.connected; // boolean

```

### 2. User

For details check out `src/plugins/rooms/WSocket/User.ts`

When a WSocket is created it is automatically added to a User object (if the User already exists, i.e. has already other connected sockets) or a new User object is created. This object can be retrieved through the socket instance:

```ts
const user = socket.getUser();
```

When a WSocket is closed it is automatically removed from the User object -> The user object contains only open socket connections

=> The User object allows to perform bulk actions to all sockets belonging to the same user. The methods follow the same naming convention as for `WSocket`

```ts
  user.leave(name: string); // all sockets of that user leave a room
  user.leaveAll(); // leave all rooms
  user.send(message: string);
  user.sendError(message: string);
  user.sendSuccess(); // send a simple success message
```

### RoomManager

For details check out `src/plugins/rooms/WSocket/RoomManager.ts`

The RoomManager is a singleton that performs actions to sockets on a room level.

```ts
  import RoomManager from './SOCKETAPPROOT/src/plugins/rooms/RoomManager/index.js';

  RoomManager.get(`someExistingRoom`);                     // get the room instance
  RoomManager.get(`someExistingRoom`)?.setData(data:any);  // set room metadata
  RoomManager.get(`someExistingRoom`)?.getData();          // get room metadata
  RoomManager.get(`someExistingRoom`)?.broadcast();        // broadcast a message to all room members
  RoomManager.get(`someExistingRoom`)?.size();             // get number of members in the room
  RoomManager.get(`someExistingRoom`)?.has(socket: WebSocket); // check if a socket is in the room
```

## TODOs
