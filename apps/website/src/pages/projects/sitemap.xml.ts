import type { GetServerSideProps } from 'next';
import { getAllPublishedProjects } from '../../server/routers/projects';

// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const BASE_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bluedot.org'}/projects`;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // TODO: only fetch slugs and publishedAt timestamps
  const projects = await getAllPublishedProjects();
  const urls = projects.map((project) => {
    return `  <url>
    <loc>${BASE_URL}/${encodeURIComponent(project.slug)}</loc>
    <lastmod>${new Date(project.publishedAt * 1000).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600'); // Users get fresh version, CDN caches for 1 hour
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default function Sitemap() {}
