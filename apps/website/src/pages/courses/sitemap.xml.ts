import type { GetServerSideProps } from 'next';
import { getAllActiveCourses } from '../../server/routers/courses';

// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const BASE_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bluedot.org'}/courses`;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const courses = await getAllActiveCourses();

  const urls = courses
    .map((course) => {
      return `  <url>
    <loc>${BASE_URL}/${encodeURIComponent(course.slug)}</loc>
    <changefreq>yearly</changefreq>
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
