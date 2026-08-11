import type { ReactElement } from 'react';

type LinkPreviewImageTagsProps = {
  /** Absolute URL — social scrapers don't resolve relative paths */
  imageUrl: string;
  alt?: string;
  width?: number;
  height?: number;
  /** MIME type of the image */
  imageType?: string;
};

/**
 * Keyed og:image / twitter:card meta tags for link previews.
 *
 * The keys match the site-wide defaults in `DefaultHeadTags` (also emitted
 * via this function), so next/head replaces the defaults with the page's
 * tags instead of rendering both.
 *
 * next/head ignores tags rendered by nested components, so this must be
 * inlined as a function call inside <Head>, not used as a JSX component:
 * `{linkPreviewImageTags({ imageUrl: ... })}`
 */
export const linkPreviewImageTags = ({
  imageUrl,
  alt,
  width = 1200,
  height = 630,
  imageType = 'image/png',
}: LinkPreviewImageTagsProps): ReactElement => (
  <>
    <meta key="og:image" property="og:image" content={imageUrl} />
    <meta key="og:image:width" property="og:image:width" content={String(width)} />
    <meta key="og:image:height" property="og:image:height" content={String(height)} />
    <meta key="og:image:type" property="og:image:type" content={imageType} />
    {alt && <meta key="og:image:alt" property="og:image:alt" content={alt} />}
    <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
  </>
);
