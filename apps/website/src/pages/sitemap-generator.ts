/* eslint-disable no-console */
import { execSync } from 'child_process';
import fs from 'fs';
import type { GetStaticProps } from 'next';
import path from 'path';
import { ROUTES } from '../lib/routes';

const BASE_URL = 'https://bluedot.org';

/** Parse git history to determine when file was last updated */
const getLastModified = (filePath: string): string => {
  try {
    const result = execSync(`git log -1 --format=%cI -- ${filePath}`, { encoding: 'utf8' });
    return result.trim() || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
};

const getRouteFilePath = (url: string): string => {
  if (url === '/') return 'src/pages/index.tsx';
  return `src/pages${url}.tsx`;
};

export const getStaticProps: GetStaticProps = () => {
  const urls = Object.values(ROUTES)
    .filter((route) => !route.url.includes('?')) // Exclude URLs with query params
    .filter((route) => route.url !== '/login/clear') // Exclude logout route
    // We don't have 'base' routes, e.g. /blog, /courses, /projects, etc, only slugs for those
    .filter((route) => fs.existsSync(`src/pages${route.url}.tsx`))
    .map((route) => {
      const filePath = getRouteFilePath(route.url);
      const lastModified = getLastModified(filePath);
      return `  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${route.url === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
    })
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${getLastModified('src/pages/index.tsx')}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urls}
</urlset>`;

  const sitemapOutputPath = path.join(process.cwd(), 'public', 'sitemap.xml');

  try {
    fs.writeFileSync(sitemapOutputPath, sitemap, 'utf8');
    console.log(`[Sitemap] Sitemap successfully generated at ${sitemapOutputPath}`);
  } catch (error) {
    console.error(`[Sitemap] Error generating sitemap: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    props: {},
  };
};

export default function Sitemap() {}
