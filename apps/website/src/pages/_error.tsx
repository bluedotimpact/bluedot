import { useEffect } from 'react';
import { type NextPageContext } from 'next';
import Head from 'next/head';
import { ErrorSection, Section } from '@bluedot/ui';
import { reportClientError } from '../lib/reportClientError';

type ErrorProps = {
  statusCode: number;
  message?: string;
};

const ErrorPage = ({ statusCode, message }: ErrorProps) => {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const errorMessage = message || `A ${statusCode} error occurred`;

  useEffect(() => {
    // data-fetching errors during client-side navigation bypass ErrorBoundary and window listeners.
    // only report 5xx. 404s are user errors, not bugs.
    if (statusCode >= 500) {
      reportClientError({ message: errorMessage }, 'error-page');
    }
  }, [statusCode, errorMessage]);

  return (
    <>
      <Head>
        <title>An Error Occurred | BlueDot Impact</title>
      </Head>
      <Section>
        <ErrorSection error={new Error(errorMessage)} />
      </Section>
    </>
  );
};

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const statusCode = res?.statusCode || err?.statusCode || 500;
  const message = err?.message;

  if (res) {
    res.statusCode = statusCode;
  }

  return { statusCode, message };
};

export default ErrorPage;
