import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: 'CLIENT_',
  client: {
    CLIENT_SOCKET_URL: z.string().default('ws://localhost:5173/websocket'),
    CLIENT_API_URL: z.string().default('http://localhost:5173/api'),
  },
  server: {
    VITE_PORT: z.coerce.number().default(5173),
    API_SERVER: z.string().default('http://localhost:3002'),
    SOCKET_SERVER: z.string().default('http://localhost:3001'),
    SWAGGER_SERVER: z.string().default('http://localhost:3003'),
    SOCKET_URL: z.string().default('ws://localhost:5173/websocket'),
    API_URL: z.string().default('http://localhost:5173/api'),
  },
  runtimeEnv: import.meta.env,
});
