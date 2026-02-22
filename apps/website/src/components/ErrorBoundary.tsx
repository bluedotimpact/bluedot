import React from 'react';
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
    reportClientError(
      {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack ?? undefined,
      },
      'errorboundary',
    );
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
