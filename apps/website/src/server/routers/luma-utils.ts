export type LumaEvent = {
  name: string;
  start_at: string; // ISO 8601 Datetime, already in UTC
  end_at: string; // ISO 8601 Datetime, already in UTC
  visibility?: string;
  geo_address_json?: {
    city?: string;
  };
  timezone: string; // IANA timezone, e.g. "America/New_York"
  url: string;
};

export function isPublicLumaEvent(event: LumaEvent) {
  return event.visibility?.toLowerCase() === 'public';
}
