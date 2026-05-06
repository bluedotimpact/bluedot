import type { NextApiRequest, NextApiResponse } from 'next';
import { jobPostingTable } from '@bluedot/db';
import db from '../../../lib/api/db';

const FALLBACK_PATH = '/images/logo/link-preview-fallback.png';
const ALLOWED_UPSTREAM_HOSTNAMES = new Set(['web.miniextensions.com']);
const MAX_BYTES = 10 * 1024 * 1024;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (!slug) {
    res.redirect(302, FALLBACK_PATH);
    return;
  }

  let imageUrl: string | null = null;
  try {
    const job = await db.get(jobPostingTable, { slug, publicationStatus: { '!=': 'Unpublished' } });
    imageUrl = job.linkPreviewImage;
  } catch {
    // Job not found or db error — fall through to fallback
  }

  if (!imageUrl) {
    res.redirect(302, FALLBACK_PATH);
    return;
  }

  // Constrain the upstream URL to a known image host. Without this, anyone
  // with Airtable write access could redirect this server to fetch arbitrary
  // (e.g. internal) URLs.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    res.redirect(302, FALLBACK_PATH);
    return;
  }

  if (!ALLOWED_UPSTREAM_HOSTNAMES.has(parsedUrl.hostname)) {
    res.redirect(302, FALLBACK_PATH);
    return;
  }

  // Proxy the image bytes through our origin so social scrapers (LinkedIn,
  // Facebook, Twitter) that miniextensions blocks by User-Agent can fetch it.
  try {
    const upstream = await fetch(parsedUrl, { signal: AbortSignal.timeout(10_000) });
    if (!upstream.ok || !upstream.body) {
      res.redirect(302, FALLBACK_PATH);
      return;
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/png';
    if (!contentType.startsWith('image/')) {
      res.redirect(302, FALLBACK_PATH);
      return;
    }

    const contentLength = Number(upstream.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_BYTES) {
      res.redirect(302, FALLBACK_PATH);
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      res.redirect(302, FALLBACK_PATH);
      return;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400');
    res.status(200).send(buffer);
  } catch {
    res.redirect(302, FALLBACK_PATH);
  }
}
