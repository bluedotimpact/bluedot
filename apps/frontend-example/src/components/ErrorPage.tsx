import { asError, LegacyText } from '@bluedot/ui';

export interface ErrorPageProps {
  error: unknown,
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error }) => {
  return (
    <div className="m-8">
      <LegacyText.H1>Error</LegacyText.H1>
      <LegacyText.P>Sorry, an unexpected error has occurred.</LegacyText.P>
      <LegacyText.P>
        Error message: <span className="italic">{asError(error).message}</span>
      </LegacyText.P>
    </div>
  );
};
