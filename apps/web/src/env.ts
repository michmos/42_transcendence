import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: 'VITE_', // <- changed
  client: {
    VITE_SOCKET_URL: z.string().nonempty({ message: 'SOCKET_URL is required' }),
    VITE_API_URL: z.string().nonempty({ message: 'API_URL is required' }),
  },
  server: {
    PORT: z.coerce.number().default(5173),
    API_SERVER: z.string().default('http://localhost:3000'),
    SOCKET_URL: z.string().default('ws://localhost:3000/socket'),
  },
  runtimeEnv: import.meta.env,
});
