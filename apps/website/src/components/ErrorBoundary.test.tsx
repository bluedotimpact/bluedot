import type React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { ErrorBoundary } from './ErrorBoundary';
import { reportClientError } from '../lib/reportClientError';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

vi.mock('../lib/reportClientError', () => ({
  reportClientError: vi.fn(),
}));

const Boom = (): React.ReactNode => {
  throw new Error('Cannot read properties of undefined (reading \'title\')');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('forwards caught render errors to both Sentry and the Slack pipeline', () => {
    render(<ErrorBoundary>
      <Boom />
    </ErrorBoundary>);

    expect(screen.getAllByText(/Cannot read properties of undefined/).length).toBeGreaterThan(0);
    expect(vi.mocked(reportClientError)).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Cannot read properties of undefined (reading \'title\')' }),
      'errorboundary',
    );
    expect(vi.mocked(Sentry.captureException)).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Cannot read properties of undefined (reading \'title\')' }),
      expect.objectContaining({ contexts: expect.objectContaining({ react: expect.anything() }) }),
    );
  });

  test('still sends the Slack report when Sentry throws', () => {
    vi.mocked(Sentry.captureException).mockImplementationOnce(() => {
      throw new Error('Sentry down');
    });
    render(<ErrorBoundary>
      <Boom />
    </ErrorBoundary>);

    expect(vi.mocked(reportClientError)).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Cannot read properties of undefined (reading \'title\')' }),
      'errorboundary',
    );
  });

  test('forwards the error identity and component stack', () => {
    render(<ErrorBoundary>
      <Boom />
    </ErrorBoundary>);

    const sentryCall = vi.mocked(Sentry.captureException).mock.calls[0]!;
    expect(sentryCall[0]).toBeInstanceOf(Error);
    expect((sentryCall[0] as Error).message).toBe('Cannot read properties of undefined (reading \'title\')');
    const contexts = (sentryCall[1] as { contexts?: { react?: { componentStack?: unknown } } } | undefined)?.contexts;
    expect(typeof contexts?.react?.componentStack).toBe('string');
    expect(contexts?.react?.componentStack as string).toContain('Boom');
  });
});
