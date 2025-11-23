import { type FastifyInstance } from 'fastify';
import { isAdmin, getUuid, isSameUUID } from '../../plugins/auth/utils.js';
import { cleanSelfUserData, cleanOtherUserData } from './utils.js';
// import fs from 'fs';
// import path from 'path';
// import { pipeline } from 'stream/promises';
import * as schemas from './userValidationSchemas.js';
// import fastifyMultipart from '@fastify/multipart';
import { getTournaments } from '../tournaments/validationSchemas.js';
import { cleanFriendshipList } from '../friends/utils.js';
import type { fullFriendshipRecord } from '../friends/types.js';

export default async function (app: FastifyInstance): Promise<void> {
  app.get('/', async function (request, reply) {
    try {
      if (!isAdmin(request, reply)) return;
      const users = await app.db.getUsers();
      return reply.status(200).send(users);
    } catch (error) {
      return reply.code(500).send({ Error: `${error}` });
    }
  });

  // Getting all logged-in user's own data to display on his profile page.
  // First getting the user data from the User table
  // Second getting all ACCEPTED friends and friend REQUESTS from other users
  // Third getting user's match history - both 1v1 and tournament matches
  // Returning an object with user and friends data
  app.get('/me', async function (request, reply) {
    try {
      const uuidSelf: string = request.user.uuid;

      const userData = await app.db.getUserMe(uuidSelf);
      const cleanedUserData = cleanSelfUserData(userData);
      const userFriends: fullFriendshipRecord[] =
        await app.db.getFriendsMe(uuidSelf);
      const cleanedUserFriends = cleanFriendshipList(uuidSelf, userFriends);
      const userMatches = await app.db.getUserMatchHistory(uuidSelf);

      return reply
        .code(200)
        .send({ cleanedUserData, cleanedUserFriends, userMatches });
    } catch (error) {
      return reply.code(500).send({ Error: `${error}` });
    }
  });

  // USER SETTINGS
  app.patch<{ Body: schemas.PatchUserMeSetNicknameType }>(
    '/me/nickname',
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
  // app.post('/me/avatar', async function (request, reply) {
  //   try {
  //     // if (request.headers['content-length'])
  //     //   continue // Needs to send back an error if something with content-length... Not sure what

  //     // Getting the file and file data from request.file() and checking if file
  //     const file: fastifyMultipart.MultipartFile | undefined =
  //       await request.file();
  //     if (!file) return reply.code(400).send({ Error: 'No image received' });

  //     // Checking if file has correct media type
  //     if (
  //       file.mimetype !== 'image/png' &&
  //       file.mimetype !== 'image/jpeg' &&
  //       file.mimetype !== 'image/jpg'
  //     )
  //       return reply.code(415).send({
  //         Error: 'Invalid file type. Needs to be .png, .jpeg or .jpg',
  //       });

  //     const uuidSelf: string = request.user.uuid;

  //     // Extracting the filename and stream from file
  //     const { filename, file: stream } = file;

  //     // Creating file path
  //     const savePath = path.join(
  //       process.cwd(),
  //       'public/userAvatars',
  //       request.user.uuid + path.extname(filename)
  //     );

  //     // ensure that directory exists
  //     await fs.promises.mkdir(path.dirname(savePath), { recursive: true });

  //     // Doing next thing I am not sure about
  //     stream.pipe(fs.createWriteStream(savePath));
  //     await pipeline(stream, fs.createWriteStream(savePath));

  //     // Setting/replacing image file path in user's record database
  //     const userData = await app.db.setUserMeAvatar(uuidSelf, savePath);
  //     return reply.code(200).send(cleanSelfUserData(userData));
  //   } catch (error) {
  //     return reply.code(500).send({ Error: `${error}` });
  //   }
  // });

  app.get<{ Querystring: getTournaments }>(
    '/me/tournaments',
    { schema: getTournaments },
    async function (request, reply) {
      const tournaments = await app.db.getTournamentsByParticipant(
        getUuid(request),
        request.query.status
      );
      return reply.status(200).send(tournaments);
    }
  );

  // OTHER USER
  app.get<{ Params: schemas.GetOtherUserProfileType }>(
    '/:nickname',
    { schema: schemas.GetOtherUserProfile },
    async function (request, reply) {
      try {
        const { nickname } = request.params;
        const user = await app.db.getUser(nickname);

        if (!user) return reply.code(404).send({ Error: 'user not found' });

        const cleanedUser = cleanOtherUserData(user);
        // console.log('Cleaned Other user data:', cleanedUser); // FOR TESTING ONLY
        return reply.code(200).send(cleanedUser);
      } catch (error) {
        return reply.code(500).send({ Error: `${error}` });
      }
    }
  );

  // ----------- ADD / DELETE USERS
  app.post('/', async function (request, reply) {
    const { email } = request.body as { email: string };

    if (!isAdmin(request, reply)) return;

    if (!email) {
      return new Error('Email is required');
    }
    const nickname = await app.db.generateUniqueNickName();
    return await app.db.addUser(email, nickname);
  });

  // First deletes user's Friends records, and then deletes own User record
  app.delete('/', async function (request, reply) {
    const { uuid } = request.body as { uuid: string };

    if (!isAdmin(request, reply) || !isSameUUID(request, reply, uuid)) return;

    if (!uuid) {
      return new Error('UUID is required');
    }
    await app.db.deleteMultipleFriends(uuid);
    return await app.db.removeUser(uuid);
  });
}
