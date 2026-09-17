export const SITE_ORIGIN = 'https://aringleb.com';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeHtml;

export function siteOrigin(env={}) {
  const value = env.SITE_ORIGIN || env.VITE_SITE_ORIGIN || SITE_ORIGIN;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') throw new Error('Invalid public site origin');
  return url.origin;
}

export function safeHref(value) {
  try {
    const url = new URL(value);
    return ['http:','https:','mailto:','tel:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function imageUrl(image, config, width=1400) {
  const match = /^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-(jpg|jpeg|png|webp|gif)$/.exec(image?.asset?._ref || '');
  if (!match) return null;
  return `https://cdn.sanity.io/images/${config.projectId}/${config.dataset}/${match[1]}-${match[2]}x${match[3]}.${match[4]}?auto=format&w=${width}&fit=max`;
}

function spans(block) {
  return (block.children || []).map(span => {
    if (span._type !== 'span') throw new Error('Unsupported inline article block');
    let text = e(span.text).replace(/\n/g,'<br>');
    for (const mark of span.marks || []) {
      if (mark === 'strong' || mark === 'em') text = `<${mark}>${text}</${mark}>`;
      else {
        const def = (block.markDefs || []).find(item => item._key === mark && item._type === 'link');
        const href = safeHref(def?.href);
        if (href) text = `<a href="${e(href)}">${text}</a>`;
      }
    }
    return text;
  }).join('');
}

export function renderBody(blocks, config) {
  let index = 0;
  function list(level, kind) {
    const tag = kind === 'number' ? 'ol' : 'ul';
    let html = `<${tag}>`;
    while (index < blocks.length) {
      const block = blocks[index];
      if (!block.listItem || (block.level || 1) < level || ((block.level || 1) === level && block.listItem !== kind)) break;
      if ((block.level || 1) > level) throw new Error('Invalid list nesting in published article');
      index++;
      html += `<li>${spans(block)}`;
      while (blocks[index]?.listItem && (blocks[index].level || 1) > level) html += list(blocks[index].level || 1, blocks[index].listItem);
      html += '</li>';
    }
    return `${html}</${tag}>`;
  }

  let html = '';
  while (index < blocks.length) {
    const block = blocks[index];
    if (block._type === 'image') {
      index++;
      const url = imageUrl(block,config);
      if (!url || !block.alt?.trim()) throw new Error('Published body image needs an asset and alternative text');
      html += `<figure><img src="${e(url)}" alt="${e(block.alt)}" loading="lazy"><figcaption>${e(block.caption || '')}</figcaption></figure>`;
    } else if (block._type === 'block') {
      if (block.listItem) {
        if (!['bullet','number'].includes(block.listItem)) throw new Error('Unsupported article list');
        html += list(block.level || 1, block.listItem);
      } else {
        index++;
        const tag = {normal:'p',h2:'h2',h3:'h3',blockquote:'blockquote'}[block.style || 'normal'];
        if (!tag) throw new Error('Unsupported article text style');
        html += `<${tag}>${spans(block)}</${tag}>`;
      }
    } else throw new Error('Unsupported article block');
  }
  return html;
}

const categoryLabel = value => ({market:'Market',hospitality:'Hospitality',investment:'Investment',notes:'Notes'}[value] || 'Blog');
const articlePath = article => `/press/${article.slug.current}/`;
function dateMarkup(article) {
  const label = new Intl.DateTimeFormat('en',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(article.publishedAt));
  return `<time datetime="${e(article.publishedAt)}">${e(label)}</time>`;
}
function cover(article,config,loading='lazy') {
  const url = imageUrl(article.coverImage,config,1400);
  if (!url || !article.coverImage?.alt?.trim()) throw new Error('Published article needs a cover and alternative text');
  return `<img src="${e(url)}" srcset="${e(imageUrl(article.coverImage,config,720))} 720w, ${e(url)} 1400w" sizes="(max-width: 700px) 92vw, 42vw" alt="${e(article.coverImage.alt)}" loading="${loading}">`;
}
function card(article,config) {
  return `<li class="article-entry"><a class="article-entry-link" href="${articlePath(article)}"><span class="article-entry-cover">${cover(article,config)}</span><span class="article-entry-copy"><span class="article-meta">Blog &middot; ${e(categoryLabel(article.category))} &middot; ${dateMarkup(article)}</span><h3>${e(article.title)}</h3><span class="article-excerpt">${e(article.excerpt)}</span><span class="article-read">Read article &rarr;</span></span></a></li>`;
}

export function renderListing(articles,config) {
  const content = articles.length
    ? `<ol class="article-index">${articles.map(article => card(article,config)).join('')}</ol>`
    : '<p class="article-empty">No published articles yet.</p>';
  return `<section class="sec insight-articles" id="blog" aria-labelledby="blog-heading"><div class="wrap"><p class="page-kicker">Blog</p><h2 id="blog-heading" class="sec-display">Notes &amp; perspectives.</h2>${content}</div></section>`;
}

function relatedFor(article,articles) {
  return articles.filter(item => item._id !== article._id).sort((a,b) => Number(b.category === article.category) - Number(a.category === article.category) || Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,3);
}

export function renderArticleMain(article,config,articles=[],origin=SITE_ORIGIN) {
  const source = safeHref(article.sourceUrl);
  const related = relatedFor(article,articles);
  const relatedMarkup = related.length
    ? `<ol class="related-list">${related.map(item => card(item,config)).join('')}</ol>`
    : '<p class="article-empty">No related articles are published yet.</p>';
  return `<main id="page-main" tabindex="-1"><article class="editorial-article wrap"><header class="article-open"><a class="link-arrow" href="/press/#blog" data-safe-back>&larr; Back to Blog</a><p class="page-kicker">${e(article.kicker || categoryLabel(article.category))}</p><h1>${e(article.title)}</h1><p class="article-lede">${e(article.excerpt)}</p><p class="article-meta">${e(categoryLabel(article.category))} &middot; ${dateMarkup(article)}</p></header><figure class="article-cover">${cover(article,config,'eager')}</figure><div class="article-body">${renderBody(article.body,config)}</div><footer class="article-end">${source ? `<p><a href="${e(source)}" target="_blank" rel="noopener noreferrer">Original source &#8599;</a></p>` : ''}<p><a href="/press/#blog">More from the Blog &rarr;</a></p><p><a href="mailto:?subject=${encodeURIComponent(article.title)}&amp;body=${encodeURIComponent(origin+articlePath(article))}">Share by email</a></p></footer></article><section class="related-articles wrap" aria-labelledby="related-heading"><p class="page-kicker">Continue reading</p><h2 id="related-heading">Related articles</h2>${relatedMarkup}</section></main>`;
}

export function renderArticlePage(shell,article,config,articles=[],origin=SITE_ORIGIN) {
  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt;
  const canonical = origin + articlePath(article);
  const url = imageUrl(article.coverImage,config);
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:article.title,description,image:[url],datePublished:article.publishedAt,author:{'@type':'Person',name:'Alexander Ringleb'},mainEntityOfPage:canonical}).replace(/</g,'\\u003c');
  const metadata = `<title>${e(title)}</title>\n<meta name="description" content="${e(description)}">\n<link rel="canonical" href="${canonical}">\n<meta property="og:type" content="article">\n<meta property="og:title" content="${e(title)}">\n<meta property="og:description" content="${e(description)}">\n<meta property="og:url" content="${canonical}">\n<meta property="og:image" content="${e(url)}">\n<meta property="og:image:alt" content="${e(article.coverImage.alt)}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${e(title)}">\n<meta name="twitter:description" content="${e(description)}">\n<meta name="twitter:image" content="${e(url)}">\n<script type="application/ld+json">${schema}</script>`;
  return shell.replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta\s+(?:name="(?:description|twitter:[^"]+)"|property="(?:og|article):[^"]+")[^>]*>/g,'').replace(/<link rel="canonical"[^>]*>/g,'')
    .replace('</head>',`${metadata}\n</head>`)
    .replace(/<main\b[\s\S]*?<\/main>/,() => renderArticleMain(article,config,articles,origin))
    .replace(/<html lang="[^"]*"/,`<html lang="${e(/^[a-z]{2}(?:-[A-Za-z]{2,8})?$/.test(article.outputLanguage || '') ? article.outputLanguage : 'en')}"`);
}

export function renderLegacyRedirect(article,origin=SITE_ORIGIN) {
  const destination = articlePath(article);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${origin+destination}"><meta http-equiv="refresh" content="0;url=${destination}"><script>location.replace(${JSON.stringify(destination)})</script><title>Article moved</title></head><body><p>This article moved to <a href="${destination}">${destination}</a>.</p></body></html>`;
}

export function renderSitemap(articles,origin=SITE_ORIGIN) {
  const paths = ['/','/press/','/insights/','/opportunities/','/contact/',...articles.map(article => articlePath(article))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${e(origin+path)}</loc></url>`).join('')}</urlset>`;
}
