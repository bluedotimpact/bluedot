import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { parseZodValidationError } from './utils';

// Test constants
const DEFAULT_ERROR = 'An error occurred';

// Helper to create mock AxiosError
const createAxiosError = <T = any>(data?: T): AxiosError<T> => {
    const error = new Error() as AxiosError<T>;
    error.isAxiosError = true;
    error.response = data ? {
        data,
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
    } : undefined;
    return error;
};

describe('parseZodValidationError', () => {
    it('should extract message from Zod validation error', () => {
        const errorData = {
            error: 'Invalid request body: [{"code":"invalid_type","message":"Expected string, received number","path":["username"]}]'
        };
        const axiosError = createAxiosError(errorData);

        const result = parseZodValidationError(axiosError, DEFAULT_ERROR);

        expect(result).toBe('Expected string, received number');
    });

    it('should extract first message when multiple errors exist', () => {
        const errorData = {
            error: 'Invalid request body: [{"message":"First error","path":["field1"]},{"message":"Second error","path":["field2"]}]'
        };
        const axiosError = createAxiosError(errorData);

        const result = parseZodValidationError(axiosError, DEFAULT_ERROR);

        expect(result).toBe('First error');
    });

    it('should return default message for invalid formats', () => {
        const invalidCases = [
            { error: 'Invalid request body: []' }, // empty array
            { error: 'Invalid request body: [{"code":"custom","path":["field"]}]' }, // no message
            { error: 'Invalid request body: {invalid json' }, // invalid JSON
            { error: 'Internal server error' }, // non-Zod error
            undefined, // no response data
        ];

        invalidCases.forEach(errorData => {
            const axiosError = createAxiosError(errorData);

            const result = parseZodValidationError(axiosError, DEFAULT_ERROR);

            expect(result).toBe(DEFAULT_ERROR);
        });
    });
});