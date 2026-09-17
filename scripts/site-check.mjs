import {readdir, readFile, stat} from 'node:fs/promises';
import {resolve, dirname, extname} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const requiredRoutes = ['index.html','press/index.html','insights/index.html','opportunities/index.html','contact/index.html','cases/index.html','sitemap.xml'];

async function filesIn(directory) {
  const entries = await readdir(directory,{withFileTypes:true});
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesIn(resolve(directory,entry.name))
    : [resolve(directory,entry.name)]))).flat();
}

const exists = async file => stat(file).then(() => true, () => false);
const missing = [];
for (const route of requiredRoutes) if (!await exists(resolve(dist,route))) missing.push(route);

const htmlFiles = (await filesIn(dist)).filter(file => extname(file) === '.html');
for (const file of htmlFiles) {
  const html = await readFile(file,'utf8');
  const refs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  for (const raw of refs) {
    if (/^(?:https?:|mailto:|tel:|#|data:)/.test(raw)) continue;
    const pathname = raw.split(/[?#]/)[0];
    if (!pathname) continue;
    let target = pathname.startsWith('/') ? resolve(dist,`.${pathname}`) : resolve(dirname(file),pathname);
    if (pathname.endsWith('/')) target = resolve(target,'index.html');
    if (!await exists(target)) missing.push(`${file.slice(dist.length+1)} -> ${raw}`);
  }
}

const press = await readFile(resolve(dist,'press/index.html'),'utf8');
const insights = await readFile(resolve(dist,'insights/index.html'),'utf8');
if (!/id="blog"/.test(press) || !/No published articles yet\.|article-index/.test(press)) missing.push('Press Blog listing or empty state');
if (/PUBLISHED_ARTICLES|article-index|insight-articles/.test(insights)) missing.push('Insights still contains editorial articles');
if (/\bdata-video-src="(?!https?:\/\/|\/)[^"]+"/.test(press + insights)) missing.push('invalid permanent video source');

if (missing.length) {
  console.error('Site check failed:\n' + missing.map(item => `- ${item}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Site check passed: ${requiredRoutes.length} required routes and ${htmlFiles.length} HTML files; local links/assets resolve.`);
}
