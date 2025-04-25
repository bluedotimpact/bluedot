import { ErrorView } from './ErrorView';

export interface ErrorSectionProps {
  error: unknown,
}

export const ErrorSection: React.FC<ErrorSectionProps> = ({ error }) => {
  return (
    <div className="section-base my-8">
      <ErrorView error={error} />
    </div>
  );
};
