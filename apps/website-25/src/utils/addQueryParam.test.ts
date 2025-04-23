import { describe, test, expect } from 'vitest';
import addQueryParam from './addQueryParam';

describe('addQueryParam', () => {
  test('adds query parameter to URL without existing parameters', () => {
    const url = 'https://example.com';
    const result = addQueryParam(url, 'key', 'value');
    expect(result).toBe('https://example.com?key=value');
  });

  test('adds query parameter to URL with existing parameters', () => {
    const url = 'https://example.com?existing=param';
    const result = addQueryParam(url, 'key', 'value');
    expect(result).toBe('https://example.com?existing=param&key=value');
  });

  test('handles empty key by returning original URL', () => {
    const url = 'https://example.com';
    const result = addQueryParam(url, '', 'value');
    expect(result).toBe(url);
  });

  test('handles empty value', () => {
    const url = 'https://example.com';
    const result = addQueryParam(url, 'key', '');
    expect(result).toBe('https://example.com?key=');
  });

  test('throws error when URL is empty', () => {
    expect(() => addQueryParam('', 'key', 'value')).toThrow('URL is required');
  });
});
