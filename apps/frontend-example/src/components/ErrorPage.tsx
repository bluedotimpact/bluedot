import { H1, P } from '@bluedot/ui';

export interface ErrorPageProps {
  error: unknown,
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error }) => {
  return (
    <div className="m-8">
      <H1>Error</H1>
      <P>Sorry, an unexpected error has occurred.</P>
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
