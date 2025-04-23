const addQueryParam = (url: string, key: string, value: string) => {
  if (!url) {
    throw new Error('URL is required');
  }
  if (!key) {
    return url;
  }
  const searchParams = new URLSearchParams();
  searchParams.set(key, value);
  if (url.includes('?')) {
    return `${url}&${searchParams.toString()}`;
  } else {
    return `${url}?${searchParams.toString()}`;
  }
};

export default addQueryParam;
