import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ErrorSection } from './ErrorSection';

describe('ErrorSection', () => {
  test('should render a simple error message correctly', () => {
    const errorMessage = 'This is an error message';
    render(<ErrorSection error={new Error(errorMessage)} />);

    const heading = screen.getByRole('heading');
    expect(heading.textContent).toContain('Error');
    expect(heading.textContent).toContain(errorMessage);
  });

  test('should render string errors correctly', () => {
    const errorString = 'This is a string error';
    render(<ErrorSection error={errorString} />);

    const heading = screen.getByRole('heading');
    expect(heading.textContent).toContain(errorString);
  });

  test('should render nested errors with causes', () => {
    const rootCause = 'Root cause';
    const middleCause = 'Middle cause';
    const outerError = 'Outer error';

    const error = new Error(outerError, {
      cause: new Error(middleCause, {
        cause: new Error(rootCause),
      }),
    });

    render(<ErrorSection error={error} />);

    // The heading should contain the outer error
    const heading = screen.getByRole('heading');
    expect(heading.textContent).toContain(outerError);

    // The details section should contain all error messages
    const details = screen.getByRole('group');
    expect(details.textContent).toContain(outerError);
    expect(details.textContent).toContain(middleCause);
    expect(details.textContent).toContain(rootCause);
  });

  test('should render network errors with details', () => {
    const networkError = new AxiosError(
      'Request failed with status code 404',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {
          url: '/api/some/route',
          method: 'get',
        } as InternalAxiosRequestConfig,
        data: { error: 'Exercise not found' },
      },
    );

    render(<ErrorSection error={networkError} />);

    // Check the main error message in the heading
    const heading = screen.getByRole('heading');
    expect(heading.textContent).toContain('Exercise not found');

    // Check the details section contains all the error information
    const details = screen.getByRole('group');
    expect(details.textContent).toContain('Request failed with status code 404');
    expect(details.textContent).toContain('404');
    expect(details.textContent).toContain('Not Found');
    expect(details.textContent).toContain('get /api/some/route');
    expect(details.textContent).toContain('Exercise not found');
  });

  test('should render arbitrary objects as JSON', () => {
    const arbitraryError = {
      message: 'Custom error',
      details: { code: 123, type: 'test' },
      array: [1, 2, 3],
    };

    render(<ErrorSection error={arbitraryError} />);

    // The heading should contain the stringified object
    const heading = screen.getByRole('heading');
    expect(heading.textContent).toContain('Error');

    // The details section should contain the full object representation
    const details = screen.getByRole('group');
    expect(details.textContent).toContain('Custom error');
    expect(details.textContent).toContain('123');
    expect(details.textContent).toContain('test');
    expect(details.textContent).toContain('[1,2,3]');
  });

  test('should truncate very long error messages', () => {
    const longMessage = `${'NA '.repeat(1000)}BATMAN!`;
    render(<ErrorSection error={new Error(longMessage)} />);

    // The heading should contain a truncated version
    const heading = screen.getByRole('heading');
    expect(heading.textContent!.length).toBeLessThan(longMessage.length);

    // The full message should be in the details section
    const details = screen.getByRole('group');
    expect(details.textContent).toContain('BATMAN!');
    expect(details.textContent).toContain(longMessage);
  });
});
