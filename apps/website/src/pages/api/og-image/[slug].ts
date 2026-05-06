import type { NextApiRequest, NextApiResponse } from 'next';
import { jobPostingTable } from '@bluedot/db';
import db from '../../../lib/api/db';

const FALLBACK_PATH = '/images/logo/link-preview-fallback.png';

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

  // Proxy the image bytes through our origin so social scrapers (LinkedIn,
  // Facebook, Twitter) that miniextensions blocks by User-Agent can fetch it.
  try {
    const upstream = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
    if (!upstream.ok || !upstream.body) {
      res.redirect(302, FALLBACK_PATH);
      return;
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/png';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400');
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.status(200).send(buffer);
  } catch {
    res.redirect(302, FALLBACK_PATH);
  }
}
