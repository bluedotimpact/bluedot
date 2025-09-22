import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { AxiosError, AxiosResponse } from 'axios';
import {
  parseZodValidationError,
  formatTime12HourClock,
  formatDateMonthAndDay,
  formatDateDayOfWeek,
  formatDateTimeRelative,
} from './utils';

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

describe('formatDateTimeRelative', () => {
  let mockNow: Date;

  beforeEach(() => {
    // Mock the current time to June 15, 2024, 3:00 PM UTC
    mockNow = new Date('2024-06-15T15:00:00.000Z');
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display "starting now" for times within 60 seconds', () => {
    const timestamp = Math.floor(mockNow.getTime() / 1000) + 30;
    const result = formatDateTimeRelative(timestamp);

    expect(result).toBe('starting now');
  });

  it('should display singular vs plural minutes', () => {
    // 1 minute
    const timestamp1 = Math.floor(mockNow.getTime() / 1000) + 60;
    const result1 = formatDateTimeRelative(timestamp1);
    expect(result1).toBe('in 1 minute');

    // 5 minutes
    const timestamp5 = Math.floor(mockNow.getTime() / 1000) + 300;
    const result5 = formatDateTimeRelative(timestamp5);
    expect(result5).toBe('in 5 minutes');
  });

  it('should display singular vs plural hours', () => {
    // 1 hour
    const timestamp1 = Math.floor(mockNow.getTime() / 1000) + 3600;
    const result1 = formatDateTimeRelative(timestamp1);
    expect(result1).toBe('in 1 hour');

    // 2 hours
    const timestamp2 = Math.floor(mockNow.getTime() / 1000) + 7200;
    const result2 = formatDateTimeRelative(timestamp2);
    expect(result2).toBe('in 2 hours');
  });

  it('should display mixed hours and minutes correctly', () => {
    // 1 hour 1 minute
    const timestamp1 = Math.floor(mockNow.getTime() / 1000) + 3660;
    const result1 = formatDateTimeRelative(timestamp1);
    expect(result1).toBe('in 1 hour 1 minute');

    // 1 hour 30 minutes
    const timestamp30 = Math.floor(mockNow.getTime() / 1000) + 5400;
    const result30 = formatDateTimeRelative(timestamp30);
    expect(result30).toBe('in 1 hour 30 minutes');
  });

  it('should display days correctly', () => {
    // 1 day
    const timestamp1 = Math.floor(mockNow.getTime() / 1000) + 86400;
    const result1 = formatDateTimeRelative(timestamp1);
    expect(result1).toBe('in 1 day');

    // 2 days
    const timestamp2 = Math.floor(mockNow.getTime() / 1000) + 172800;
    const result2 = formatDateTimeRelative(timestamp2);
    expect(result2).toBe('in 2 days');
  });

  it('should display past times with "ago" suffix', () => {
    // 5 minutes ago
    const timestamp5 = Math.floor(mockNow.getTime() / 1000) - 300;
    const result5 = formatDateTimeRelative(timestamp5);
    expect(result5).toBe('5 minutes ago');

    // 2 hours ago
    const timestamp2h = Math.floor(mockNow.getTime() / 1000) - 7200;
    const result2h = formatDateTimeRelative(timestamp2h);
    expect(result2h).toBe('2 hours ago');

    // 1 day ago
    const timestamp1d = Math.floor(mockNow.getTime() / 1000) - 86400;
    const result1d = formatDateTimeRelative(timestamp1d);
    expect(result1d).toBe('1 day ago');
  });
});

describe('formatDateMonthAndDay', () => {
  it('should format date correctly', () => {
    const testDate = new Date('2024-06-20T15:00:00.000Z');
    const timestamp = Math.floor(testDate.getTime() / 1000);
    const result = formatDateMonthAndDay(timestamp);

    expect(result).toBe('Jun 20');
  });
});

describe('formatTime12HourClock', () => {
  it('should format time correctly accounting for timezone', () => {
    const testDate = new Date('2024-06-15T15:30:00.000Z');
    const timestamp = Math.floor(testDate.getTime() / 1000);
    const result = formatTime12HourClock(timestamp);
    const expectedTime = testDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    expect(result).toBe(expectedTime);
  });
});

describe('formatDateDayOfWeek', () => {
  it('should display day of week correctly', () => {
    // Tuesday, June 18, 2024, 3:30 PM UTC
    const testDate = new Date('2024-06-18T15:30:00.000Z');
    const timestamp = Math.floor(testDate.getTime() / 1000);
    const result = formatDateDayOfWeek(timestamp);

    expect(result).toBe('Tue');
  });

  it('should display different days of week correctly', () => {
    const testCases = [
      { date: '2024-06-16T15:30:00.000Z', expected: 'Sun' }, // Sunday
      { date: '2024-06-17T15:30:00.000Z', expected: 'Mon' }, // Monday
      { date: '2024-06-18T15:30:00.000Z', expected: 'Tue' }, // Tuesday
      { date: '2024-06-19T15:30:00.000Z', expected: 'Wed' }, // Wednesday
      { date: '2024-06-20T15:30:00.000Z', expected: 'Thu' }, // Thursday
      { date: '2024-06-21T15:30:00.000Z', expected: 'Fri' }, // Friday
      { date: '2024-06-22T15:30:00.000Z', expected: 'Sat' }, // Saturday
    ];

    testCases.forEach(({ date, expected }) => {
      const testDate = new Date(date);
      const timestamp = Math.floor(testDate.getTime() / 1000);
      const result = formatDateDayOfWeek(timestamp);
      expect(result).toBe(expected);
    });
  });

  it('should handle different times correctly', () => {
    // Test morning time
    const morningDate = new Date('2024-06-18T09:00:00.000Z');
    const morningTimestamp = Math.floor(morningDate.getTime() / 1000);
    const morningResult = formatDateDayOfWeek(morningTimestamp);

    expect(morningResult).toBe('Tue');

    // Test evening time
    const eveningDate = new Date('2024-06-18T20:45:00.000Z');
    const eveningTimestamp = Math.floor(eveningDate.getTime() / 1000);
    const eveningResult = formatDateDayOfWeek(eveningTimestamp);

    expect(eveningResult).toBe('Tue');
  });
});
