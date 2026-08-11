import type { ReactElement } from 'react';

/** 1200×630 brand image used when a page has no bespoke link preview */
export const LINK_PREVIEW_FALLBACK_IMAGE_URL = 'https://bluedot.org/images/logo/link-preview-fallback.png';

type LinkPreviewMetaTagsProps = {
  /** Absolute URL — social scrapers don't resolve relative paths */
  imageUrl: string;
  alt?: string;
  /**
   * Only pass dimensions/type verified against the actual asset (e.g. via
   * `sips -g pixelWidth -g pixelHeight <file>`). When omitted, no claim is
   * made and scrapers measure the image themselves.
   */
  width?: number;
  height?: number;
  /** MIME type of the image */
  imageType?: string;
};

/**
 * Keyed link-preview meta tags: the og:image family plus twitter:card and
 * twitter:image (kept in sync with og:image by construction).
 *
 * The keys match the site-wide defaults in `DefaultHeadTags` (also emitted
 * via this function), so next/head replaces the defaults with the page's
 * tags instead of rendering both.
 *
 * next/head ignores tags rendered by nested components, so this must be
 * inlined as a function call inside <Head>, not used as a JSX component:
 * `{linkPreviewMetaTags({ imageUrl: ... })}`
 */
export const linkPreviewMetaTags = ({
  imageUrl,
  alt,
  width,
  height,
  imageType,
}: LinkPreviewMetaTagsProps): ReactElement => (
  <>
    <meta key="og:image" property="og:image" content={imageUrl} />
    {width !== undefined && <meta key="og:image:width" property="og:image:width" content={String(width)} />}
    {height !== undefined && <meta key="og:image:height" property="og:image:height" content={String(height)} />}
    {imageType && <meta key="og:image:type" property="og:image:type" content={imageType} />}
    {alt && <meta key="og:image:alt" property="og:image:alt" content={alt} />}
    <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
    <meta key="twitter:image" name="twitter:image" content={imageUrl} />
  </>
);
