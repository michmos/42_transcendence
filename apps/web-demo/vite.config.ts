import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { viteComponentTransform } from './src/plugins/components/vite-plugin.js';
import { createRoutesPlugin } from './src/plugins/routes-plugin.js';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  const apiPort = env.API_PORT || '3002';
  const socketPort = env.SOCKET_PORT || '3001';
  const vitePort = parseInt(env.VITE_PORT || '5173');

  console.log(
    `🔧 Vite config - API: localhost:${apiPort}, Socket: localhost:${socketPort}, Vite: ${vitePort}`
  );

  return {
    server: {
      host: '0.0.0.0',
      port: vitePort,
      proxy: {
        // Proxy /api and everything after /api to the API server
        '^/api(/.*)?$': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: false,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/websocket': {
          target: `http://localhost:${socketPort}`,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    build: {
      outDir: 'out',
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(__dirname, 'index.html'),
      },
    },
    plugins: [
      viteComponentTransform(),
      viteStaticCopy({
        targets: [
          {
            src: 'src/static/*',
            dest: '',
          },
        ],
      }),
      createRoutesPlugin(),
    ],
  };
});
