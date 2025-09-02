import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import db, { type User } from '../../plugins/Database.js';

export default async function (
    app: FastifyInstance,
    opts: FastifyPluginOptions
): Promise<void> {
    app.get(
        '/',
        async function (
            request: FastifyRequest,
            reply: FastifyReply
        ): Promise<{ message: typeof db.getAllUsers extends () => Promise<infer T> ? T : unknown }> {
            const users = await db.getAllUsers();
            return { message: users };
        }
    );

    app.post(
        '/',
        async function (
            request: FastifyRequest,
            reply: FastifyReply
        ): Promise<User | Error | void> {
            try {
                await db.addUser("test@example.com", "testuser").then((user) => {
                    reply.status(201);
                    return user;
                });
            } catch (err) {
                console.error(err);
                reply.status(500);
                return 
            }
        }
    );

    app.delete(
        '/',
        async function (
            request: FastifyRequest,
            reply: FastifyReply
        ): Promise<Error | void> {
            try {
                await db.removeUser("test@example.com").then((user) => {
                    reply.status(201);
                    return user;
                });
            } catch (err) {
                console.error(err);
                reply.status(500);
                return;
            }
        }
    );
}