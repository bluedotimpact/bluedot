// TODO: Possibly move to future @bluedot/analytics package
export type SOURCE = 'website';

export type CONTENT = 'course_section';

export type CAMPAIGN = 'relaunch';

export interface UTMParams {
  source: SOURCE;
  content: CONTENT;
  campaign: CAMPAIGN;
}

export const addUtmParams = (url: string, params: UTMParams): string => {
  const urlObj = new URL(url);
  urlObj.searchParams.set('utm_source', params.source);
  urlObj.searchParams.set('utm_content', params.content);
  urlObj.searchParams.set('utm_campaign', params.campaign);
  return urlObj.toString();
};
