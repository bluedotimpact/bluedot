import { isAxiosError } from 'axios';
import { asError } from './utils/asError';
import { Collapsible } from './Collapsible';

export interface ErrorSectionProps {
  error: unknown,
}

const truncate = (str: string, n: number) => (str.length > n ? `${str.slice(0, n)}...` : str);

export const ErrorSection: React.FC<ErrorSectionProps> = ({ error: input }) => {
  const error = asError(input);
  const isRichAxiosError = isAxiosError(error) && typeof error.response?.data?.error === 'string';
  const primaryErrorText = isRichAxiosError ? error.response!.data.error : truncate(error.message, 200);

  return (
    <div className="section-base">
      <div className="border-l-4 border-red-500 bg-red-100 text-black p-8 my-8 flex flex-col gap-4">
        <h2 className="text-3xl">Error: {primaryErrorText}</h2>
        <p>If the above message doesn't help, try again later or <a href="https://bluedot.org/contact">contact us</a> for support.</p>
        <Collapsible title="Show full error details" className="-my-6">
          <div className="flex flex-col gap-4 overflow-x-auto">
            <ErrorDetails error={error} />
          </div>
        </Collapsible>
      </div>
    </div>
  );
};

interface ErrorDetailsProps {
  error: Error,
  prefix?: string,
}

const ErrorDetails: React.FC<ErrorDetailsProps> = ({ error, prefix = '' }) => {
  const prefixSpace = `${prefix} `;

  return (
    <>
      <div>
        <p className="font-bold">{prefixSpace}Message</p>
        <p>{error.message}</p>
      </div>
      <div>
        <p className="font-bold">{prefixSpace}Stack</p>
        <pre>{error.stack}</pre>
      </div>
      {isAxiosError(error) && error.response && (
      <>
        <div>
          <p className="font-bold">{prefixSpace}Status</p>
          <p>{error.response.status} {error.response.statusText}</p>
        </div>
        <div>
          <p className="font-bold">{prefixSpace}Request URL</p>
          <p>{error.response.config.method} {error.response.config.url}</p>
        </div>
        <div>
          <p className="font-bold">{prefixSpace}Response data</p>
          <pre>{JSON.stringify(error.response.data, null, 2)}</pre>
        </div>
      </>
      )}
      {error.cause !== undefined && <ErrorDetails error={asError(error.cause)} prefix={`${prefixSpace}Cause`} />}
    </>
  );
};
