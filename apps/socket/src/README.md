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

**Each handler is responsible for:**

- Validating if the room exists (and how to handle if not)
  (see further down)

* Validating if the socket is allowed to perform the action in the room
  (e.g. 'message' or 'leave-room' in a room you are not part of)

- Handling the message according to its type

**What is already done preHandler:**

- Validate message
  - against type (see defined above)

## Usage

### Creating a new handler

1. add a directory under `src/sockets/roomHandlers/` with the handler name
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

### WSocket API

WSocket is a wrapper class around the native WebSocket that adds:

- room management
- metadata -> uuid, connected, lastSeen
- auto logging (messages, closure)
- default error handling

For details check out `src/plugins/rooms/WSocket/index.ts`

```ts
  socket.join(name: string); // join room or create if not exists
  socket.leave(name: string); // leave room
  socket.leaveAll(); // leave all rooms
  socket.isInRoom(name: string); boolean;
  socket.send(message: string);
  socket.sendError(message: string);
  socket.sendSuccess();

  socket.uuid; // string
  socket.lastSeen; // Date
  socket.connected; // boolean

```

### RoomManager API

The RoomManager is a singleton that should be used to all room-related operations that are not accessible via the socket API.

```ts
  import RoomManager from './SOMEPATH/plugins/rooms/RoomManager/index.js';

  RoomManager.get(`someExistingRoom`);                     // get the room instance
  RoomManager.get(`someExistingRoom`)?.setData(data:any);  // set room metadata
  RoomManager.get(`someExistingRoom`)?.getData();          // get room metadata
  RoomManager.get(`someExistingRoom`)?.close();            // close the room
  RoomManager.get(`someExistingRoom`)?.broadcast();        // broadcast a message to all room members
  RoomManager.get(`someExistingRoom`)?.size();             // get number of members in the room
  RoomManager.get(`someExistingRoom`)?.has(socket: WebSocket); // check if a socket is in the room
  RoomManager.get(`someExistingRoom`)?.getConnections();  // get all sockets in the room
```

## TODOs
