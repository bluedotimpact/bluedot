import { describe, test, expect } from 'vitest';
import { addQueryParam } from './addQueryParam';

describe('addQueryParam', () => {
  test('adds query parameter to URL without existing parameters', () => {
    const url = 'https://example.com';
    const result = addQueryParam(url, 'key', 'value');
    expect(result).toBe('https://example.com/?key=value');
  });

  test('adds query parameter to URL with existing parameters', () => {
    const url = 'https://example.com?existing=param';
    const result = addQueryParam(url, 'key', 'value');
    expect(result).toBe('https://example.com/?existing=param&key=value');
  });

  test('overwrites existing query parameter when setting it again', () => {
    const url = 'https://example.com?existing=old';
    const result = addQueryParam(url, 'existing', 'new');
    expect(result).toBe('https://example.com/?existing=new');
  });

  test('adds query parameter to relative path URL', () => {
    const url = '/login';
    const result = addQueryParam(url, 'key', 'value');
    expect(result).toBe('/login?key=value');
  });

  test('can set param with empty string key', () => {
    const url = 'https://example.com/';
    const result = addQueryParam(url, '', 'value');
    expect(result).toBe('https://example.com/?=value');
  });

  test('handles empty value', () => {
    const url = 'https://example.com';
    const result = addQueryParam(url, 'key', '');
    expect(result).toBe('https://example.com/?key=');
  });

  test('handles empty URL', () => {
    const result = addQueryParam('', 'key', 'value');
    expect(result).toBe('?key=value');
  });
});
