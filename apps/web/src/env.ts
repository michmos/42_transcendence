import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    VITE_PORT: z.coerce.number().default(5173),

    SOCKET_SERVER: z.string().nonempty('SOCKET_URL is required'),
    API_SERVER: z.string().nonempty('API_URL is required'),
    SWAGGER_SERVER: z.string().nonempty('SWAGGER_URL is required'),

    SOCKET_URL: z.string().nonempty('SOCKET_URL is required'),
    API_URL: z.string().nonempty('API_URL is required'),
  },

  runtimeEnv: process.env,
});
