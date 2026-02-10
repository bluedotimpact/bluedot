import type React from 'react';
import { useState } from 'react';

type FaviconImageProps = {
  url: string;
  displaySize?: number; // Size in pixels for displaying the favicon (default: 16px)
  className?: string;
  alt?: string;
};

// Google's Favicon API can't resolve favicons for some domains (e.g., Substack custom domains)
const FAVICON_OVERRIDES: Record<string, string> = {
  'blog.bluedot.org': 'https://bluedot.org/favicon.ico',
};

/**
 * Component that displays a favicon for a given URL using Google's favicon API
 * Falls back gracefully if the favicon fails to load
 */
export const FaviconImage: React.FC<FaviconImageProps> = ({
  url,
  displaySize = 16, // How large the favicon appears on screen
  className = '',
  alt,
}) => {
  const [hasError, setHasError] = useState(false);

  // Extract domain from URL
  let domain: string;
  try {
    const urlObject = new URL(url);
    domain = urlObject.hostname;
  } catch {
    return null;
  }

  // Don't render if there was an error loading the favicon
  if (hasError) {
    return null;
  }

  // API Configuration
  const API_FAVICON_SIZE = 256; // Size requested from Google's API (higher res for quality)

  const faviconUrl = FAVICON_OVERRIDES[domain]
    ?? `https://www.google.com/s2/favicons?domain=${domain}&sz=${API_FAVICON_SIZE}`;

  return (
    <img
      src={faviconUrl}
      alt={alt || `${domain} favicon`}
      aria-hidden={alt === undefined || alt === ''}
      width={displaySize} // Display dimensions (e.g., 16x16)
      height={displaySize} // Browser scales down the high-res image
      className={`inline-block flex-shrink-0 ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

export default FaviconImage;
