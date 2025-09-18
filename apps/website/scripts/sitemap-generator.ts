/* eslint-disable no-console */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ROUTES } from '../src/lib/routes';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bluedot.org';
const INCLUDED_ROUTES = [
  ROUTES.home,
  ROUTES.about,
  ROUTES.certification,
  ROUTES.contact,
  ROUTES.courses,
  ROUTES.joinUs,
  ROUTES.privacyPolicy,
  // blog, courses and projects do not have base routes, only slugs
];

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

const generateSitemaps = async () => {
  const urls = Object.values(INCLUDED_ROUTES)
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
${urls}
</urlset>`;

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/blog/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/courses/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/projects/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>
`;

  const sitemapOutputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  const sitemapIndexOutputPath = path.join(process.cwd(), 'public', 'sitemap_index.xml');

  try {
    fs.writeFileSync(sitemapOutputPath, sitemap, 'utf8');
    fs.writeFileSync(sitemapIndexOutputPath, sitemapIndex, 'utf8');
    console.log(`[Sitemap] Sitemap successfully generated at ${sitemapOutputPath}`);
  } catch (error) {
    console.error(`[Sitemap] Error generating sitemap: ${error instanceof Error ? error.message : String(error)}`);
  }
};

generateSitemaps();
