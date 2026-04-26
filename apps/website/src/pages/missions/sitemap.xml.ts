import type { GetServerSideProps } from 'next';
import { getAllLiveMissions } from '../../server/routers/missions';

// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const BASE_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bluedot.org'}/missions`;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const missions = await getAllLiveMissions();
  // <lastmod> is intentionally omitted: the mission table has no
  // `updatedAt` field, and a `lastmod` that's always "now" trains
  // crawlers to ignore the signal.
  const urls = missions.map((mission) => {
    return `  <url>
    <loc>${BASE_URL}/${encodeURIComponent(mission.slug ?? '')}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default function Sitemap() {}
