import { blogTable } from '@bluedot/db';
import Parser from 'rss-parser';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export const getAllPublishedBlogs = async () => {
  const publishedBlogs = await db.scan(blogTable, { publicationStatus: 'Published' });

  // Sort by publishedAt descending and remove the body field from each blog to make the response lighter
  return publishedBlogs
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return b.isFeatured ? 1 : -1;
      }
      return (b.publishedAt || 0) - (a.publishedAt || 0);
    })
    .map(({ body, ...rest }) => rest);
};

// Cache for RSS feed data
let rssCache: {
  data: Array<{
    title: string;
    link: string;
    pubDate: string;
    author?: string;
    contentSnippet?: string;
  }>;
  timestamp: number;
} | null = null;

const RSS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getSubstackBlogPosts = async () => {
  // Check if cache is valid
  if (rssCache && Date.now() - rssCache.timestamp < RSS_CACHE_DURATION) {
    return rssCache.data;
  }

  const parser = new Parser();
  const feed = await parser.parseURL('https://blog.bluedot.org/feed');

  const posts = feed.items.map((item) => ({
    title: item.title || '',
    link: item.link || '',
    pubDate: item.pubDate || item.isoDate || '',
    author: item.creator || item.author || '',
    contentSnippet: item.contentSnippet || '',
  }));

  // Update cache
  rssCache = {
    data: posts,
    timestamp: Date.now(),
  };

  return posts;
};

export const blogsRouter = router({
  getAll: publicProcedure.query(async () => {
    return getAllPublishedBlogs();
  }),
  getSubstack: publicProcedure.query(async () => {
    return getSubstackBlogPosts();
  }),
});
