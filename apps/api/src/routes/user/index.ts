import { type FastifyInstance } from 'fastify';
import { isAdmin, getUuid, isSameUUID } from '../../plugins/auth/utils.js';
import { cleanSelfUserData, cleanOtherUserData } from './utils.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import * as schemas from './userValidationSchemas.js';
import fastifyMultipart from '@fastify/multipart';
import { env } from '../../env.js';
import {
  getTournaments,
  type getTournamentsQuerystring,
} from '../tournaments/validationSchemas.js';
import { cleanFriendshipList } from '../friends/utils.js';
import type { fullFriendshipRecord } from '../friends/types.js';
import type { UserMatchRecord, UserDashboardResponse } from 'types';

export default function (app: FastifyInstance): void {
  // ----------- Get all users
  app.get('/', async function (request, reply) {
    try {
      if (!isAdmin(request, reply)) return;
      const users = await app.db.getUsers();
      return reply.status(200).send(users);
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ Error: 'Failed getting all user data' });
    }
  });

  // ----------- user/me requests for dashboard and socket API calls
  app.get('/me/uuid', async function (request, reply) {
    return reply.status(200).send({ uuid: getUuid(request) });
  });

  // TODO: Hacked this in as the web is requesting /me for own user data

  // Might need to refactor later

  app.get('/me', async function (request, reply) {
    try {
      const uuidSelf: string = request.user.uuid;
      const userData = await app.db.getUserMe(uuidSelf);
      const cleanedUserData = cleanSelfUserData(userData);
      return reply.code(200).send(cleanedUserData);
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ Error: 'Failed getting own user data' });
    }
  });

  app.get('/me/dashboard', async function (request, reply) {
    try {
      const uuidSelf: string = request.user.uuid;
      const userData = await app.db.getUserMe(uuidSelf);
      const cleanedUserData = cleanSelfUserData(userData);
      const userFriends: fullFriendshipRecord[] =
        await app.db.getFriendsMe(uuidSelf);
      const cleanedUserFriends = cleanFriendshipList(uuidSelf, userFriends);
      const userMatches: UserMatchRecord[] =
        await app.db.getUserMatchHistory(uuidSelf);
      const userDashboardData: UserDashboardResponse = {
        cleanedUserData,
        cleanedUserFriends,
        userMatches,
      };
      return reply.code(200).send(userDashboardData);
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ Error: 'Failed getting own user data' });
    }
  });

  app.get('/me/nickname', async function (request, reply) {
    try {
      const uuidSelf: string = request.user.uuid;
      const userData = await app.db.getUserMe(uuidSelf);
      const { nickname } = userData;
      return reply.code(200).send({ nickname: nickname });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ Error: 'Failed getting own user data' });
    }
  });

  app.patch<{ Params: schemas.changeStatusParamsType }>(
    '/me/isOnline/:status',
    {
      schema: schemas.ChangeStatus,
    },
    async function (request, reply) {
      try {
        const uuidSelf: string = request.user.uuid;

        const isOnline: string = request.params.status;
        let status: boolean;
        if (isOnline === 'true') status = true;
        else if (isOnline === 'false') status = false;
        else {
          reply.status(204).send({ Error: 'Invalid status parameter' });
          return;
        }
        await app.db.setUserOnlineStatus(uuidSelf, status);
        return reply.status(204).send();
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({
          Error: `Failed to update online status to ${request.params.status}`,
        });
      }
    }
  );

  // ----------- User settings
  app.patch<{ Body: schemas.PatchUserMeSetNicknameType }>(
    '/me/nickname',
    {
      schema: schemas.PatchUserMeSetNickname,
    },
    async function (request, reply) {
      try {
        const uuidSelf: string = request.user.uuid;
        const { newNickname } = request.body as { newNickname: string };
        const existingUser = await app.db.getUserByNickname(newNickname);
        if (existingUser) {
          return reply.code(409).send({
            Error: `Nickname ${newNickname} already exists and must be unique`,
          });
        }
        const userData = await app.db.setUserMeNickname(uuidSelf, newNickname);
        return reply.code(200).send(cleanSelfUserData(userData));
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({ Error: 'Failed changing nickname' });
      }
    }
  );

  app.post('/me/avatar', async function (request, reply) {
    try {
      const file: fastifyMultipart.MultipartFile | undefined =
        await request.file();
      if (!file) return reply.code(400).send({ Error: 'No image received' });
      if (
        file.mimetype !== 'image/png' &&
        file.mimetype !== 'image/jpeg' &&
        file.mimetype !== 'image/jpg'
      )
        return reply.code(415).send({
          Error: 'Invalid file type. Needs to be .png, .jpeg or .jpg',
        });

      // Reading file into buffer. Max 2MB
      const buffer = await file.toBuffer();
      if (buffer.length > 2 * 1024 * 1024)
        return reply.code(413).send({
          Error: 'File too large. Must be smaller than 2MB',
        });

      const uuidSelf: string = request.user.uuid;

      const avatarUuid = crypto.randomUUID();
      const newFilename = `${avatarUuid}.png`;
      const filePath = path.join('avatars', newFilename);
      const savePath = path.join(`${env.CDN_PATH}`, filePath);

      // ensure that directory exists
      await fs.promises.mkdir(path.dirname(savePath), { recursive: true });
      try {
        await sharp(buffer)
          .resize(256, 256, { fit: 'cover' })
          .png({ quality: 80 })
          .toFile(savePath);
      } catch {
        return reply.code(415).send({
          Error: 'Invalid file type. Needs to be .png, .jpeg or .jpg',
        });
      }
      // Setting/replacing image file path in user's record database
      const userData = await app.db.setUserMeAvatar(uuidSelf, filePath);
      return reply.code(200).send(cleanSelfUserData(userData));
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ Error: 'Failed changing user avatar' });
    }
  });

  // ----------- Get user's current tournaments
  app.get<{ Querystring: getTournamentsQuerystring }>(
    '/me/tournaments',
    { schema: getTournaments },
    async function (request, reply) {
      const participations =
        await app.db.getTournamentParticipationsByUserAndStatus(
          getUuid(request),
          request.query.status
        );
      return reply.status(200).send(participations);
    }
  );

  // ----------- Other user API calls
  app.get<{ Params: schemas.GetOtherUserProfileType }>(
    '/:nickname',
    { schema: schemas.GetOtherUserProfile },
    async function (request, reply) {
      try {
        const { nickname } = request.params;
        const user = await app.db.getUserByNickname(nickname);
        if (!user) return reply.code(404).send({ Error: 'user not found' });
        const cleanedUser = cleanOtherUserData(user);
        return reply.code(200).send(cleanedUser);
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({ Error: 'Failed getting user' });
      }
    }
  );

  // ----------- Add / delete users as admin
  // app.post('/', async function (request, reply) {
  //   const { email } = request.body as { email: string };
  //   if (!isAdmin(request, reply)) return;
  //   if (!email) {
  //     return new Error('Email is required');
  //   }
  //   const nickname = await app.db.generateUniqueNickName();
  //   return await app.db.addUser(email, nickname);
  // });

  // ----------- First deletes user's Friends records, and then deletes own User record
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
