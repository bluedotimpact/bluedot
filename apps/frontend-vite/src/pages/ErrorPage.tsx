import { H1, P } from '@bluedot/ui';
import { useRouteError } from 'react-router-dom';

export const RouteErrorPage: React.FC = () => {
  const error = useRouteError();
  return <ErrorPage error={error} />;
};

export interface ErrorPageProps {
  error: unknown,
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error }) => {
  return (
    <div className="m-8">
      <H1>Error</H1>
      <P>Sorry, an unexpected error has occured.</P>
      <P>
        Error message: <span className="italic">{getNormalisedError(error).message}</span>
      </P>
    </div>
  );
};

const getNormalisedError = (input: unknown): Error => {
  if (input instanceof Error) {
    return input;
  }

  if (typeof input === 'object' && input !== null && 'error' in input && input.error instanceof Error) {
    return input.error;
  }

  try {
    return new Error(JSON.stringify(input));
  } catch {
    return new Error(String(input));
  }
};
