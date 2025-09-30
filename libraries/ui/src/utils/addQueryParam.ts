export const addQueryParam = (url: string, key: string, value: string) => {
  // Try to parse as absolute URL first
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set(key, value);
    return urlObj.toString();
  } catch {
    // Handle as relative URL (including empty strings)
    const [pathAndSearch = '', hash = ''] = url.split('#');
    const [path = '', existingSearch = ''] = pathAndSearch.split('?');

    const params = new URLSearchParams(existingSearch);
    params.set(key, value);

    return `${path}?${params.toString()}${hash ? `#${hash}` : ''}`;
  }
};
