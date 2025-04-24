import { describe, test, expect } from 'vitest';
import { getQueryParam } from './getQueryParam';

describe('getQueryParam', () => {
  test('gets query parameter from URL with existing parameters', () => {
    const url = 'https://example.com?myQueryParam=data';
    const result = getQueryParam(url, 'myQueryParam');
    expect(result).toBe('data');
  });

  test('handles URL without existing parameters', () => {
    const url = 'https://example.com/';
    const result = getQueryParam(url, 'key');
    expect(result).toBe(null);
  });

  test('handles URL with duplicated parameters by returning first value', () => {
    const url = 'https://example.com/?myQueryParam=first&myQueryParam=middle&myQueryParam=last';
    const result = getQueryParam(url, 'myQueryParam');
    expect(result).toBe('first');
  });

  test('gets query parameter from URL with empty string key', () => {
    const url = 'https://example.com?=data';
    const result = getQueryParam(url, '');
    expect(result).toBe('data');
  });

  test('handles URL without target parameter', () => {
    const url = 'https://example.com?myQueryParam=data';
    const result = getQueryParam(url, 'key');
    expect(result).toBe(null);
  });

  test('throws error when URL is empty', () => {
    expect(() => getQueryParam('', 'key')).toThrow('URL is required');
  });
});
