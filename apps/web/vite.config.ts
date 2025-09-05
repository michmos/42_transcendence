import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const apiPort = env.API_PORT || '3002';
  const socketPort = env.SOCKET_PORT || '3001';
  const vitePort = parseInt(env.VITE_PORT || '5173');

  return {
    root: 'src',
    server: {
      host: '0.0.0.0',
      port: vitePort,
      proxy: {
        // Proxy /api/** requests to the API server
        '^/api(/.*)?$': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: false,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        // Proxy WebSocket connections to the WebSocket server
        '/websocket': {
          target: `http://localhost:${socketPort}`,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/websocket/, ''),
        },
      },
    },
    build: {
      outDir: '../out',
      emptyOutDir: true,
    },
    plugins: [
      // Copy static files to the root of the build output directory
      viteStaticCopy({
        targets: [
          {
            src: 'static/*',
            dest: '',
          },
        ],
      }),
    ],
  };
});
