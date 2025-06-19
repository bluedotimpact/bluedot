import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosResponse } from 'axios';
import { parseZodValidationError } from './utils';

// Test constants
const DEFAULT_ERROR = 'An error occurred';

// Define the expected error response type
type ErrorResponse = {
  error: string;
};

// Helper to create mock AxiosError with proper typing
const createAxiosError = <T = ErrorResponse>(data?: T): AxiosError<T> => {
  const error = new Error() as AxiosError<T>;
  error.isAxiosError = true;
  error.response = data ? {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: {
      url: '',
      method: 'GET',
      headers: {},
    },
  } as AxiosResponse<T> : undefined;
  return error;
};

describe('parseZodValidationError', () => {
  it('should extract message from Zod validation error', () => {
    const errorData: ErrorResponse = {
      error: 'Invalid request body: [{"code":"invalid_type","message":"Expected string, received number","path":["username"]}]',
    };
    const axiosError = createAxiosError(errorData);

    const result = parseZodValidationError(axiosError, DEFAULT_ERROR);

    expect(result).toBe('Expected string, received number');
  });

  it('should extract first message when multiple errors exist', () => {
    const errorData: ErrorResponse = {
      error: 'Invalid request body: [{"message":"First error","path":["field1"]},{"message":"Second error","path":["field2"]}]',
    };
    const axiosError = createAxiosError(errorData);

    const result = parseZodValidationError(axiosError, DEFAULT_ERROR);

    expect(result).toBe('First error');
  });

  it('should return default message for invalid formats', () => {
    const invalidCases: (ErrorResponse | undefined)[] = [
      { error: 'Invalid request body: []' }, // empty array
      { error: 'Invalid request body: [{"code":"custom","path":["field"]}]' }, // no message
      { error: 'Invalid request body: {invalid json' }, // invalid JSON
      { error: 'Internal server error' }, // non-Zod error
      undefined, // no response data
    ];

    invalidCases.forEach((errorData) => {
      const axiosError = createAxiosError(errorData);

      const result = parseZodValidationError(axiosError, DEFAULT_ERROR);

      expect(result).toBe(DEFAULT_ERROR);
    });
  });
});
