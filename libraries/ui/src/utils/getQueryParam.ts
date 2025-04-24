export const getQueryParam = (url: string, key: string) => {
  if (!url) {
    throw new Error('URL is required');
  }
  const urlObj = new URL(url, window.location.origin);
  return urlObj.searchParams.get(key);
};
