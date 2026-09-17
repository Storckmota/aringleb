import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ARTICLE_QUERY, fetchArticles, publishedArticles, publicConfig} from './content.mjs';
import {renderBody, renderArticlePage, renderArticleMain, renderListing, renderLegacyRedirect, renderSitemap, imageUrl} from './render.mjs';
import {articleFixture as a, articleFixtures} from './fixtures.mjs';
import {insightsPlugin} from './vite-plugin.mjs';
const config = publicConfig({});
test('only published articles survive the query and defensive filter', () => {
  assert.match(ARTICLE_QUERY,/drafts\.\*\*/);
  assert.match(ARTICLE_QUERY,/versions\.\*\*/);
  assert.deepEqual(publishedArticles([{...a,_id:'drafts.x'},{...a,_id:'versions.r.x'},{...a,_type:'articleIngestion'},a]),[a]);
});
test('read requests use published perspective and send no token', async () => {
  let request;
  const result = await fetchArticles({env:{SANITY_WRITE_TOKEN:'never-send-this'},fetchImpl:async (url,options) => {
    request = {url:String(url),options};
    return Response.json({result:[a]});
  }});
  assert.match(request.url,/perspective=published/);
  assert.doesNotMatch(JSON.stringify(request),/never-send|authorization/i);
  assert.equal(result.articles.length,1);
});
test('an upstream failure fails the build rather than removing articles', async () => {
  await assert.rejects(fetchArticles({fetchImpl:async()=>new Response('',{status:503})}),/keeping the previous deployment/);
});
test('slugs cannot collide or escape the Insights directory', () => {
  assert.throws(()=>publishedArticles([a,{...a,_id:'another'}]),/duplicate/);
  for (const slug of ['../press','a/b','<script>','', 'x'.repeat(97)]) assert.throws(()=>publishedArticles([{...a,slug:{current:slug}}]),/slug/);
});
test('all schema blocks and nested lists render with semantic HTML', () => {
  const html = renderBody(a.body,config);
  for (const tag of ['p','h2','h3','blockquote','ul','ol','li','a','strong','em','figure','img','figcaption']) assert.match(html,new RegExp('<'+tag+'(?:>| )'),tag);
  assert.match(html,/<li>First consideration<ul><li>A supporting detail<\/li><\/ul><\/li>/);
});
test('article text is escaped and unsafe links never become hrefs', () => {
  const body = [{_type:'block',style:'normal',children:[{_type:'span',text:'<script>alert("x")</script>',marks:['bad']}],markDefs:[{_key:'bad',_type:'link',href:'javascript:alert(1)'}]}];
  const html = renderBody(body,config);
  assert.doesNotMatch(html,/<script|href=/);
  assert.match(html,/&lt;script&gt;/);
});
test('images use permanent Sanity references and require alt text', () => {
  assert.match(imageUrl(a.coverImage,config),/^https:\/\/cdn.sanity.io\/images\//);
  assert.equal(imageUrl({url:'https://cdninstagram.com/temporary'},config),null);
  assert.throws(()=>renderBody([{_type:'image',asset:a.coverImage.asset}],config),/alternative text/);
});
test('unknown blocks fail visibly instead of silently losing editorial content', () => {
  assert.throws(()=>renderBody([{_type:'table'}],config),/Unsupported/);
});
test('metadata, original source, sharing and canonical are complete', () => {
  const shell = '<html lang="en"><head><title>old</title><meta property="og:title" content="old"></head><body><main>reels</main></body></html>';
  const html = renderArticlePage(shell,a,config,articleFixtures);
  for (const text of ['rel="canonical"','og:title','og:description','og:url','og:image','twitter:card','application/ld+json','Original source','Share by email','Back to Blog','Related articles']) assert.ok(html.includes(text),text);
  assert.equal((html.match(/<title>/g)||[]).length,1);
  assert.doesNotMatch(html,/>old</);
  assert.match(html,/https:\/\/aringleb.com\/press\/qa-the-details\//);
});
test('blog listing has published and empty states; fixtures are forbidden on Vercel', async () => {
  assert.match(renderListing([],config),/No published articles yet/);
  assert.match(renderListing([a],config),/href="\/press\/qa-the-details\/"/);
  await assert.rejects(()=>insightsPlugin({env:{VERCEL:'1'},fixtures:[a]}).buildStart(),/forbidden/);
});
test('individual article related content excludes itself and has an empty state', () => {
  const withRelated = renderArticleMain(a,config,articleFixtures);
  assert.match(withRelated,/qa-maintenance/);
  assert.doesNotMatch(withRelated.slice(withRelated.indexOf('related-articles')),/qa-the-details/);
  assert.match(renderArticleMain(a,config,[a]),/No related articles are published yet/);
});
test('legacy Insights URLs redirect to Press and sitemap lists only canonical article URLs', () => {
  assert.match(renderLegacyRedirect(a),/\/press\/qa-the-details\//);
  const sitemap=renderSitemap([a]);
  assert.match(sitemap,/\/press\/qa-the-details\//);
  assert.doesNotMatch(sitemap,/\/insights\/qa-the-details\//);
});
test('production config has no fixture imports and the Reels are preserved', async () => {
  const vite = await readFile(new URL('../../vite.config.js',import.meta.url),'utf8').catch(()=>readFile(new URL('../../../../vite.config.js',import.meta.url),'utf8'));
  assert.doesNotMatch(vite,/fixtures/);
  const insights = await readFile(new URL('../../insights/index.html',import.meta.url),'utf8').catch(()=>readFile(new URL('../../../../insights/index.html',import.meta.url),'utf8'));
  assert.equal((insights.match(/data-social-item/g)||[]).length,6);
  assert.doesNotMatch(insights,/PUBLISHED_ARTICLES/);
});
