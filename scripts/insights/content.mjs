// Build-only Sanity read. No credentials, CDN cache, drafts or operational fields.
export const ARTICLE_QUERY = '*[_type == "article" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(featured desc, publishedAt desc){_id,_type,title,slug,kicker,excerpt,body,category,coverImage,publishedAt,featured,seoTitle,seoDescription,sourceUrl,outputLanguage}';
export function publicConfig(env = process.env) {
  const projectId = env.SANITY_PROJECT_ID || 'jzyfrwem';
  const dataset = env.SANITY_DATASET || 'production';
  const apiVersion = env.SANITY_API_VERSION || '2026-08-01';
  if (!/^[a-z0-9]+$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset) || !/^\d{4}-\d{2}-\d{2}$/.test(apiVersion)) throw new Error('Invalid public Sanity configuration');
  return {projectId, dataset, apiVersion};
}
export function publishedArticles(documents) {
  if (!Array.isArray(documents)) throw new Error('Sanity returned an invalid article list');
  const seen = new Set();
  return documents.filter(doc => doc?._type === 'article' && typeof doc._id === 'string' && !/^(drafts|versions)\./.test(doc._id)).map(doc => {
    const slug = doc.slug?.current;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '') || slug.length > 96) throw new Error('A published article has an invalid slug');
    if (seen.has(slug)) throw new Error('Published articles have duplicate slugs');
    seen.add(slug);
    if (!doc.title?.trim() || !doc.excerpt?.trim() || !Array.isArray(doc.body) || !doc.body.length || !Number.isFinite(Date.parse(doc.publishedAt))) throw new Error('A published article is missing required editorial fields');
    return doc;
  }).sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
}
export async function fetchArticles({env = process.env, fetchImpl = globalThis.fetch} = {}) {
  const config = publicConfig(env);
  const url = new URL('https://' + config.projectId + '.api.sanity.io/v' + config.apiVersion + '/data/query/' + config.dataset);
  url.searchParams.set('query', ARTICLE_QUERY);
  url.searchParams.set('perspective', 'published');
  const response = await fetchImpl(url, {signal: AbortSignal.timeout(30000), redirect: 'error'});
  if (!response.ok) throw new Error('Published article fetch failed (' + response.status + '); keeping the previous deployment');
  const result = await response.json();
  return {articles: publishedArticles(result.result), config};
}
