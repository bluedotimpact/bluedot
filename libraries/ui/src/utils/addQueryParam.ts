/**
 * Adds or updates (upserts) a query parameter in the given URL.
 * If the key already exists, its value is replaced.
 */
export const addQueryParam = (url: string | null | undefined, key: string, value: string) => {
  const safeUrl = url ?? '';

  // Try to parse as absolute URL first
  try {
    const urlObj = new URL(safeUrl);
    urlObj.searchParams.set(key, value);
    return urlObj.toString();
  } catch {
    // Handle as relative URL (including empty strings)
    const [pathAndSearch = '', hash = ''] = safeUrl.split('#');
    const [path = '', existingSearch = ''] = pathAndSearch.split('?');

    const params = new URLSearchParams(existingSearch);
    params.set(key, value);

    return `${path}?${params.toString()}${hash ? `#${hash}` : ''}`;
  }
};
