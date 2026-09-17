import { defineConfig, loadEnv } from 'vite';
import { insightsPlugin } from './scripts/insights/vite-plugin.mjs';
import { resolve } from 'node:path';

/* Multi-page build. The home page kept its place at the root; Press,
   Insights, Opportunities and Contact are plain directories with their own
   index.html, so each is a real URL on any static host. `cases` is the old
   Cases URL, kept as a forward to /#cases now that the four cases live on
   the home page. No framework, no router — the stack is unchanged, this is
   only the minimum Rollup needs to see the entries. */
export default defineConfig(({mode}) => ({
  plugins: [insightsPlugin({env: {...loadEnv(mode, process.cwd(), ''), ...process.env}})],
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        press: resolve(__dirname, 'press/index.html'),
        insights: resolve(__dirname, 'insights/index.html'),
        opportunities: resolve(__dirname, 'opportunities/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        cases: resolve(__dirname, 'cases/index.html'),
      },
    },
  },
}));
