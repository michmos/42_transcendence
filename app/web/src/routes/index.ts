import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import path from 'path';

import { join } from 'node:path'
const __dirname = path.dirname(new URL(import.meta.url).pathname);
import { readFile } from 'node:fs/promises'

export default async function (
    app: FastifyInstance,
    opts: FastifyPluginOptions
): Promise<void> {

    app.get('/', async (_req, reply) => {
    const data = await readFile(join(__dirname, '../static/', 'index.html'))
    reply.header('content-type', 'text/html; charset=utf-8')
    reply.send(data)
    })
}