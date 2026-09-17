import {fetchArticles, publishedArticles, publicConfig} from './content.mjs';
import {renderListing, renderArticlePage, renderLegacyRedirect, renderSitemap, siteOrigin} from './render.mjs';

// Runs only during build. Production never reads fixtures or a local CMS path.
export function insightsPlugin({env = process.env, fixtures} = {}) {
  let articles, config, origin;
  return {
    name: 'published-insights',
    apply: 'build',
    async buildStart() {
      if (fixtures !== undefined) {
        if (env.VERCEL || env.CI || env.NODE_ENV === 'production') throw new Error('Fixtures are forbidden in production builds');
        articles = publishedArticles(fixtures);
        config = publicConfig(env);
      } else ({articles, config} = await fetchArticles({env}));
      origin = siteOrigin(env);
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        if (context.path === '/press/index.html') {
          if (!html.includes('<!-- PUBLISHED_ARTICLES -->')) throw new Error('Press article insertion point is missing');
          return html.replace('<!-- PUBLISHED_ARTICLES -->', () => renderListing(articles, config))
            .replace('</head>', '<link rel="canonical" href="' + origin + '/press/">\n<meta property="og:url" content="' + origin + '/press/">\n</head>');
        }
        if (context.path === '/insights/index.html') {
          return html.replace('</head>', '<link rel="canonical" href="' + origin + '/insights/">\n<meta property="og:url" content="' + origin + '/insights/">\n</head>');
        }
        return html;
      },
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const shell = bundle['press/index.html'];
        if (!shell || shell.type !== 'asset') throw new Error('The compiled Press page is missing');
        for (const article of articles) {
          this.emitFile({type:'asset', fileName:'press/' + article.slug.current + '/index.html', source:renderArticlePage(String(shell.source),article,config,articles,origin)});
          this.emitFile({type:'asset', fileName:'insights/' + article.slug.current + '/index.html', source:renderLegacyRedirect(article,origin)});
        }
        this.emitFile({type:'asset', fileName:'sitemap.xml', source:renderSitemap(articles,origin)});
      },
    },
  };
}
