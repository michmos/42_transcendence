import { type FastifyInstance } from 'fastify';
import { isAdmin, isSameUUID } from '../../plugins/auth/utils.js';
import type { User } from 'db/generated/client/client.js';
import fs from 'fs';
import path from 'path';
import * as schemas from './userValidationSchemas.js';
import fastifyMultipart from '@fastify/multipart';

export default async function (app: FastifyInstance): Promise<void> {
  app.get('/user', async function (request, reply) {
    try {
      if (!isAdmin(request, reply)) return;

      const users = await app.db.getUsers();
      console.log('Fetched users:', users);
      return reply.status(200).send(users);
    } catch (error) {
      return reply.code(500).send({ Error: `${error}` });
    }
  });

  // Getting all logged-in user's own data to display on his profile page.
  // First getting the user data from the User table
  // Second getting all ACCEPTED friends and friend REQUESTS from other users
  // Returning an object with user and friends data
  app.get('/user/me', async function (request, reply) {
    try {
      const uuidSelf: string = request.user.uuid;

      const userData = await app.db.getUserMe(uuidSelf);
      const cleanedUserData = cleanSelfUserData(userData);
      const userFriends = await app.db.getFriends(uuidSelf);

      // For testing :
      console.log('/user/me - userData:', userData);
      console.log('/user/me - cleanedUserData:', cleanedUserData);
      console.log('/user/me - userFriends:', userFriends);
      console.log('/user/me - userFriends:', { cleanedUserData, userFriends });
      // End of testing

      return reply.code(200).send({ cleanedUserData, userFriends });
    } catch (error) {
      return reply.code(500).send({ Error: `${error}` });
    }
  });

  // USER SETTINGS
  app.patch<{ Body: schemas.PatchUserMeSetNicknameType }>(
    '/user/me/setNickname',
    {
      schema: schemas.PatchUserMeSetNickname,
    },
    async function (request, reply) {
      try {
        const uuidSelf: string = request.user.uuid;

        const { newNickname } = request.body as { newNickname: string };
        const existingUser = await app.db.getUser(newNickname);
        if (existingUser) {
          return reply.code(409).send({
            Error: `Nickname ${newNickname} already exists and must be unique`,
          });
        }

        const userData = await app.db.setUserMeNickname(uuidSelf, newNickname);
        return reply.code(200).send(cleanSelfUserData(userData));
      } catch (error) {
        return reply.code(500).send({ Error: `${error}` });
      }
    }
  );

  // ---- TODO:
  // - Needs image (type checking)
  // - changing image to 1:1 and appropriate size if possible, to save storage
  // - image name changing
  // - fixing path to where image is saved, e.g. /public/profile-images/user12345
  app.post('/user/me/setAvatar', async function (request, reply) {
    try {
      // Getting the file and file data from request.file() and checking if file
      const file: fastifyMultipart.MultipartFile | undefined =
        await request.file();
      if (!file) return reply.code(400).send({ Error: 'No image received' });

      // Getting the user uuid before doing any of the heavy lifting
      const uuidSelf: string = request.user.uuid;

      // Extracting the filename and stream from file
      const { filename, file: stream } = file;

      // Creating file path
      const savePath = path.join(
        process.cwd(),
        'public/userAvatars',
        request.user.uuid + path.extname(filename)
      );

      // Doing something I am not sure about
      await fs.promises.mkdir(path.dirname(savePath), { recursive: true });

      // Doing next thing I am not sure about
      await stream.pipe(fs.createWriteStream(savePath));

      // Setting/replacing image file path in user's record database
      const userData = await app.db.setUserMeAvatar(uuidSelf, savePath);
      return reply.code(200).send(cleanSelfUserData(userData));
    } catch (error) {
      return reply.code(500).send({ Error: `${error}` });
    }
  });

  // OTHER USER
  app.get('/user/:nickname', async function (request, reply) {
    try {
      const { nickname } = request.params as { nickname: string };
      const user = await app.db.getUser(nickname);

      if (!user) return reply.code(404).send({ Error: 'user not found' });

      const cleanedUser = cleanOtherUserData(user);
      return reply.code(200).send(cleanedUser);
    } catch (error) {
      return reply.code(500).send({ Error: `${error}` });
    }
  });

  // ----------- ADD / DELETE USERS
  app.post('/', async function (request, reply) {
    const { email } = request.body as { email: string };

    if (!isAdmin(request, reply)) return;

    if (!email) {
      return new Error('Email is required');
    }

    return await app.db.addUser(
      email,
      email.split('@')[0] || 'user' + Math.floor(Math.random() * 1000)
    );
  });

  // First deletes user's Friends records, and then deletes own User record
  app.delete('/', async function (request, reply) {
    const { uuid } = request.body as { uuid: string };

    if (!isAdmin(request, reply) && isSameUUID(request, reply, uuid)) return;

    if (!uuid) {
      return new Error('UUID is required');
    }
    app.db.deleteMultipleFriends(uuid);
    return await app.db.removeUser(uuid);
  });
}

// Cleans up another user's data that is requested but not the requesting user's own data
function cleanOtherUserData(user: User): Partial<User> {
  const {
    nickname,
    avatar,
    gamesPlayed,
    gamesWon,
    tournamentsPlayed,
    tournamentsWon,
  } = user;
  return {
    nickname,
    avatar,
    gamesPlayed,
    gamesWon,
    tournamentsPlayed,
    tournamentsWon,
  };
}

function cleanSelfUserData(userData: User): Partial<User> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { uuid, updatedAt, ...cleanedUserData } = userData;
  return cleanedUserData;
}
