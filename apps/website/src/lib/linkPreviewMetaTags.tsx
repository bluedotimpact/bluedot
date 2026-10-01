import type { ReactElement } from 'react';

/** 1200×630 brand image used when a page has no bespoke link preview */
export const LINK_PREVIEW_FALLBACK_IMAGE_PATH = '/images/logo/link-preview-fallback.png';
export const LINK_PREVIEW_FALLBACK_IMAGE_URL = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org'}${LINK_PREVIEW_FALLBACK_IMAGE_PATH}`;

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

type PageMetaTagsProps = {
  /** Full page title, used for <title>, and for og:title and twitter:title unless `previewTitle` is set */
  title: string;
  /** Used for the description, og:description and twitter:description tags */
  description?: string | null;
  /** Title for link previews when it should differ from <title> (e.g. without the "| BlueDot Impact" suffix) */
  previewTitle?: string | null;
};

/**
 * Keyed title and description tags for a page: <title>, description, and their
 * og: and twitter: copies, so link previews show the page's own title and
 * description.
 *
 * Like `linkPreviewMetaTags`, call it as a function inside <Head>:
 * `{pageMetaTags({ title, description })}`
 */
export const pageMetaTags = ({ title, description, previewTitle }: PageMetaTagsProps): ReactElement => (
  <>
    <title>{title}</title>
    <meta key="og:title" property="og:title" content={previewTitle ?? title} />
    <meta key="twitter:title" name="twitter:title" content={previewTitle ?? title} />
    {description && <meta key="description" name="description" content={description} />}
    {description && <meta key="og:description" property="og:description" content={description} />}
    {description && <meta key="twitter:description" name="twitter:description" content={description} />}
  </>
);

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
    {width && <meta key="og:image:width" property="og:image:width" content={String(width)} />}
    {height && <meta key="og:image:height" property="og:image:height" content={String(height)} />}
    {imageType && <meta key="og:image:type" property="og:image:type" content={imageType} />}
    {alt && <meta key="og:image:alt" property="og:image:alt" content={alt} />}
    <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
    <meta key="twitter:image" name="twitter:image" content={imageUrl} />
  </>
);
