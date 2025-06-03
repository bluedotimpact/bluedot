import { describe, test, expect } from 'vitest';
import { validateEnv } from './validateEnv';

describe('validateEnv', () => {
  test('should return typed object when all required variables are present', () => {
    const mockEnv = {
      APP_NAME: 'test-app',
      DATABASE_URL: 'postgres://localhost',
      DEBUG: 'true',
    };

    const result = validateEnv({
      required: ['APP_NAME', 'DATABASE_URL'] as const,
      optional: ['DEBUG'] as const,
      envSource: mockEnv,
    });

    expect(result).toEqual({
      APP_NAME: 'test-app',
      DATABASE_URL: 'postgres://localhost',
      DEBUG: 'true',
    });
  });

  test('should throw error when required variables are missing', () => {
    const mockEnv = {
      APP_NAME: 'test-app',
      // DATABASE_URL is missing
    };

    expect(() => {
      validateEnv({
        required: ['APP_NAME', 'DATABASE_URL'] as const,
        envSource: mockEnv,
      });
    }).toThrow('Unset environment variables: DATABASE_URL');
  });

  test('should exclude optional variables when missing or empty', () => {
    const mockEnv = {
      APP_NAME: 'test-app',
      DEBUG: '', // empty string should be excluded
      // LOG_LEVEL is missing
    };

    const result = validateEnv({
      required: ['APP_NAME'] as const,
      optional: ['DEBUG', 'LOG_LEVEL'] as const,
      envSource: mockEnv,
    });

    expect(result).toEqual({
      APP_NAME: 'test-app',
    });
    expect(result.DEBUG).toBeUndefined();
    expect(result.LOG_LEVEL).toBeUndefined();
  });
});
