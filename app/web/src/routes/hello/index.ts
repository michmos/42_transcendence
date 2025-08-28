import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

export default async function (
    app: FastifyInstance,
    opts: FastifyPluginOptions
): Promise<void> {
    console.log('Hello from the hello route!');
    app.get(
        '/',
        async function (
            request: FastifyRequest,
            reply: FastifyReply
        ): Promise<{ message: string }> {
            return { message: 'Hello, World!' };
        }
    );
}