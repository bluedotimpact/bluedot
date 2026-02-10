import { type NextPageContext } from 'next';
import Head from 'next/head';
import { ErrorSection, Section } from '@bluedot/ui';

type ErrorProps = {
  statusCode: number;
  message?: string;
};

const ErrorPage = ({ statusCode, message }: ErrorProps) => {
  const errorMessage = message || `A ${statusCode} error occurred`;

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
  const statusCode = res?.statusCode || err?.statusCode || 500;
  const message = err?.message;

  if (res) {
    res.statusCode = statusCode;
  }

  return { statusCode, message };
};

export default ErrorPage;
