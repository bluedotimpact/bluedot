export type LumaEvent = {
  id: string;
  platform?: 'luma' | 'external';
  name: string;
  description?: string;
  description_md?: string;
  cover_url?: string | null;
  start_at: string;
  end_at: string;
  visibility?: string;
  location_type?: string | null;
  geo_address_json?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
  } | null;
  timezone: string;
  url: string;
};

export function isPublicLumaEvent(event: LumaEvent) {
  // External calendar listings have no visibility field in Luma's API.
  return event.platform === 'external' && event.visibility === undefined
    ? true
    : event.visibility?.toLowerCase() === 'public';
}

export function getLumaLocation(event: LumaEvent) {
  if (['discord', 'meet', 'twitch', 'twitter', 'youtube', 'zoom', 'unknown'].includes(event.location_type ?? '')) {
    return 'ONLINE';
  }

  const address = event.geo_address_json;
  const location = [address?.city, address?.region, address?.country].find((value) => value?.trim());
  if (location) {
    return location.toUpperCase();
  }

  return event.location_type === 'offline' ? 'IN PERSON' : 'LOCATION TBC';
}

export function buildListEventsUrl({ after, cursor }: { after?: string; cursor?: string }) {
  const url = new URL('https://public-api.luma.com/v1/calendars/events/list');
  url.searchParams.set('pagination_limit', '100');
  url.searchParams.set('sort_direction', 'asc');
  // Include approved listings managed by other calendars, and off-platform events.
  url.searchParams.append('access', 'manage');
  url.searchParams.append('access', 'view');
  url.searchParams.append('platforms', 'luma');
  url.searchParams.append('platforms', 'external');
  if (after) url.searchParams.set('after', after);
  if (cursor) url.searchParams.set('pagination_cursor', cursor);
  return url;
}
