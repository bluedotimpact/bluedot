export const addQueryParam = (url: string, key: string, value: string) => {
  if (!url) {
    throw new Error('addQueryParam: URL is required');
  }

  // Handle SSR: use a base URL when window is not available
  const base = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://bluedot.org'; // Default base for SSR

  const urlObj = new URL(url, base);
  urlObj.searchParams.set(key, value);
  return urlObj.toString();
};
