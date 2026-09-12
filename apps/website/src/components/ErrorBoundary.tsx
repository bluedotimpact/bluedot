import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { ErrorSection, Section } from '@bluedot/ui';
import { reportClientError } from '../lib/reportClientError';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

// class component is required. react has no hook-based error boundary api.
// componentDidCatch only exists on class components.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Slack first, so a Sentry failure can never swallow the report.
    reportClientError(
      {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack ?? undefined,
      },
      'errorboundary',
    );
    // Without this, Sentry never sees these crashes. They don't reach window.onerror.
    // Guarded: a Sentry failure must never break the boundary or swallow the Slack report.
    try {
      Sentry.captureException(error, {
        contexts: {
          react: { componentStack: errorInfo.componentStack ?? undefined },
        },
      });
    } catch {
      // Slack already went out above, so there is nothing left to do.
    }
  }

  render() {
    if (this.state.error) {
      return (
        <Section>
          <ErrorSection error={this.state.error} />
        </Section>
      );
    }

    return this.props.children;
  }
}
