import React, { useState } from 'react';

type FaviconImageProps = {
  url: string;
  displaySize?: number;  // Size in pixels for displaying the favicon (default: 16px)
  className?: string;
  alt?: string;
};

/**
 * Component that displays a favicon for a given URL using Google's favicon API
 * Falls back gracefully if the favicon fails to load
 */
export const FaviconImage: React.FC<FaviconImageProps> = ({
  url,
  displaySize = 16,  // How large the favicon appears on screen
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
  const API_FAVICON_SIZE = 256;  // Size requested from Google's API (higher res for quality)
  
  // Request high-resolution favicon from Google's API
  // We fetch at 256px for quality, then scale down to displaySize for crisp rendering
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${API_FAVICON_SIZE}`;

  return (
    <img
      src={faviconUrl}
      alt={alt || `${domain} favicon`}
      width={displaySize}    // Display dimensions (e.g., 16x16)
      height={displaySize}   // Browser scales down the high-res image
      className={`inline-block flex-shrink-0 ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

export default FaviconImage;
