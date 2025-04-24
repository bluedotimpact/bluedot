export const addQueryParam = (url: string, key: string, value: string) => {
  if (!url) {
    throw new Error('URL is required');
  }
  const urlObj = new URL(url, window.location.origin);
  if (!key) {
    return urlObj.toString();
  }
  urlObj.searchParams.set(key, value);
  return urlObj.toString();
};
