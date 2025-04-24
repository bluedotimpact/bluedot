export const addQueryParam = (url: string, key: string, value: string) => {
  if (!url) {
    throw new Error('addQueryParam: URL is required');
  }
  const urlObj = new URL(url, window.location.origin);
  urlObj.searchParams.set(key, value);
  return urlObj.toString();
};
