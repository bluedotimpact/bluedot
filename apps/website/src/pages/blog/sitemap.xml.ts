import { blogTable } from '@bluedot/db';
import type { GetServerSideProps } from 'next';
import db from '../../lib/api/db';

const BASE_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bluedot.org'}/blog`;

const getAllPublishedBlogs = async () => {
  const allBlogs = await db.scan(blogTable, { publicationStatus: 'Published' });

  // Sort by publishedAt descending and remove the body field from each blog to make the response lighter
  const blogSummaries = allBlogs
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return b.isFeatured ? 1 : -1;
      }
      return (b.publishedAt || 0) - (a.publishedAt || 0);
    })
    .map(({ body, ...rest }) => rest);

  return blogSummaries;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // TODO: only fetch slugs and publishedAt timestamps
  const blogs = await getAllPublishedBlogs();
  const urls = blogs.map((blog) => {
    return `  <url>
    <loc>${BASE_URL}/${encodeURIComponent(blog.slug)}</loc>
    <lastmod>${new Date(blog.publishedAt * 1000).toISOString()}</lastmod>
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
