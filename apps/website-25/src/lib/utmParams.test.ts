import { addUtmParams, type UTMParams } from './utmParams';
import { describe, expect, it } from 'vitest';

describe('UTM Parameters', () => {
  it('should add UTM parameters to a URL without existing parameters', () => {
    const baseUrl = 'https://example.com';
    const utmParams: UTMParams = {
      source: 'website',
      content: 'course_section',
      campaign: 'relaunch'
    };

    const result = addUtmParams(baseUrl, utmParams);
    
    expect(result).toBe(
      'https://example.com/?utm_source=website&utm_content=course_section&utm_campaign=relaunch'
    );
  });

  it('should add UTM parameters to a URL with existing parameters', () => {
    const baseUrl = 'https://example.com?existing=param';
    const utmParams: UTMParams = {
      source: 'website',
      content: 'course_section',
      campaign: 'relaunch'
    };

    const result = addUtmParams(baseUrl, utmParams);
    
    expect(result).toBe(
      'https://example.com/?existing=param&utm_source=website&utm_content=course_section&utm_campaign=relaunch'
    );
  });

  it('should override existing UTM parameters', () => {
    const baseUrl = 'https://example.com?utm_source=old&utm_campaign=old';
    const utmParams: UTMParams = {
      source: 'website',
      content: 'course_section',
      campaign: 'relaunch'
    };

    const result = addUtmParams(baseUrl, utmParams);
    
    expect(result).toBe(
      'https://example.com/?utm_source=website&utm_campaign=relaunch&utm_content=course_section'
    );
  });
});