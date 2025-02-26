import { asError, H1, P } from '@bluedot/ui';

export interface ErrorPageProps {
  error: unknown,
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error }) => {
  return (
    <div className="m-8">
      <H1>Error</H1>
      <P>Sorry, an unexpected error has occurred.</P>
      <P>
        Error message: <span className="italic">{asError(error).message}</span>
      </P>
    </div>
  );
};
