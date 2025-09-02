import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs';
import path from 'path';

const createSpaRoutes = () => {
  return {
    name: 'create-spa-routes',
    writeBundle() {
      // After build, copy index.html to route paths for SPA support
      const outDir = path.resolve(__dirname, 'out');
      const indexPath = path.join(outDir, 'index.html');
      
      if (!fs.existsSync(indexPath)) {
        console.warn('⚠️ index.html not found in output directory');
        return;
      }

      // Dynamically discover routes from src/routes directory
      const routesDir = path.resolve(__dirname, 'src/routes');
      
      if (!fs.existsSync(routesDir)) {
        console.warn('⚠️ src/routes directory not found');
        return;
      }

      const routes: string[] = [];
      
      // Read all directories in src/routes
      const entries = fs.readdirSync(routesDir, { withFileTypes: true });
      
      entries.forEach(entry => {
        if (entry.isDirectory()) {
          let routeName = entry.name;
          
          // Handle dynamic routes: convert [id] syntax to base route
          // e.g., "user[id]" becomes "user", "info[id]" becomes "info"
          if (routeName.includes('[') && routeName.includes(']')) {
            routeName = routeName.split('[')[0];
          }
          
          // Avoid duplicates
          if (!routes.includes(routeName)) {
            routes.push(routeName);
          }
        }
      });

      console.log(`🔍 Discovered routes: ${routes.join(', ')}`);

      routes.forEach(route => {
        const routeDir = path.join(outDir, route);
        
        // Create route directory if it doesn't exist
        if (!fs.existsSync(routeDir)) {
          fs.mkdirSync(routeDir, { recursive: true });
          console.log(`📁 Created route directory: ${route}/`);
        }
        
        // Copy index.html to route directory
        const routeIndexPath = path.join(routeDir, 'index.html');
        fs.copyFileSync(indexPath, routeIndexPath);
        console.log(`📄 Copied index.html to ${route}/index.html`);
      });
      
      console.log('✅ SPA routes created successfully');
    }
  };
};

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  const apiPort = env.API_PORT || '3002';
  const socketPort = env.SOCKET_PORT || '3001';
  const vitePort = parseInt(env.VITE_PORT || '5173');
  
  console.log(`🔧 Vite config - API: localhost:${apiPort}, Socket: localhost:${socketPort}, Vite: ${vitePort}`);

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
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/websocket': {
          target: `http://localhost:${socketPort}`,
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },
    build: {
      outDir: 'out',
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: 'src/static/*',
            dest: ''
          },
          {
            src: 'src/routes',
            dest: 'src'
          }
        ]
      }),
      createSpaRoutes()
    ]
  };
});
