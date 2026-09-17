import {build, loadEnv} from 'vite';
import {resolve} from 'node:path';
import {insightsPlugin} from './vite-plugin.mjs';
import {articleFixtures} from './fixtures.mjs';
// Explicit local command; a separate output directory keeps fixtures out of dist.
if (process.env.VERCEL || process.env.CI) throw new Error('Local QA only');
await build({
  configFile:false,appType:'mpa',
  plugins:[insightsPlugin({env:loadEnv('development',process.cwd(),''),fixtures:articleFixtures})],
  build:{outDir:'.qa-insights',rollupOptions:{input:{press:resolve('press/index.html'),insights:resolve('insights/index.html')}}}
});
