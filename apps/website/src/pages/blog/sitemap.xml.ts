import { GetServerSideProps } from 'next';
import { GetBlogsResponse } from '../api/cms/blogs';

const BASE_URL = 'https://bluedot.org/blog';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const data = await fetch('https://bluedot.org/api/cms/blogs', { method: 'GET' });
  if (!data.ok) {
    res.statusCode = data.status;
    res.end();
    return { props: {} };
  }

  const { blogs } = await data.json() as GetBlogsResponse;
  const urls = blogs.map((blog) => {
    return `  <url>
    <loc>${BASE_URL}/${encodeURIComponent(blog.slug)}</loc>
    <lastmod>${new Date(blog.publishedAt * 1000).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default function Sitemap() {}
