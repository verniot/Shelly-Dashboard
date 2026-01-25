import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All requests starting with /rpc will be forwarded to designated device --> CORRECT IP
      '/rpc': {
        //target: 'http://192.168.1.204', // Shelly device IP
        target: 'http://localhost:1880', // Node-RED
        changeOrigin: true,
        secure: false,
      },
    },
  },
});