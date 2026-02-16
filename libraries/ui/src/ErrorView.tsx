import { isAxiosError } from 'axios';
import { asError } from './utils/asError';
import { Collapsible } from './Collapsible';
import { contactUsUrl } from './constants';
import { A } from './Text';

export type ErrorViewProps = {
  error: unknown;
};

const truncate = (str: string, n: number) => (str.length > n ? `${str.slice(0, n)}...` : str);

export const ErrorView: React.FC<ErrorViewProps> = ({ error: input }) => {
  const error = asError(input);
  const isRichAxiosError = isAxiosError(error) && typeof error.response?.data?.error === 'string';
  const primaryErrorText = isRichAxiosError ? error.response!.data.error : truncate(error.message, 200);

  return (
    <div className="border-l-4 border-red-500 bg-red-100 text-black p-8 flex flex-col gap-4 not-prose">
      <h3 className="bluedot-h3 whitespace-pre-line">Error: {primaryErrorText}
      </h3>
      <p>If the above message doesn't help, try again later or <A href={contactUsUrl}>contact us</A> for support.</p>
      <Collapsible title="Show full error details" className="-my-6 max-w-full">
        <div className="flex flex-col gap-4 overflow-x-auto [&_pre]:max-w-0">
          <ErrorDetails error={error} />
          {typeof window !== 'undefined' && (
            <div>
              <p className="font-bold">Page URL</p>
              <pre>{window.location.href}</pre>
            </div>
          )}
          <div>
            <p className="font-bold">Timestamp</p>
            <pre>{new Date().toISOString()}</pre>
          </div>
        </div>
      </Collapsible>
    </div>
  );
};

type ErrorDetailsProps = {
  error: Error;
  prefix?: string;
};

const ErrorDetails: React.FC<ErrorDetailsProps> = ({ error, prefix = '' }) => {
  const prefixSpace = `${prefix} `;

  return (
    <>
      <div>
        <p className="font-bold">{prefixSpace}Message</p>
        <pre>{error.message}</pre>
      </div>
      <div>
        <p className="font-bold">{prefixSpace}Stack</p>
        <pre>{error.stack}</pre>
      </div>
      {isAxiosError(error) && error.response && (
        <>
          <div>
            <p className="font-bold">{prefixSpace}Status</p>
            <pre>{error.response.status} {error.response.statusText}</pre>
          </div>
          <div>
            <p className="font-bold">{prefixSpace}Request URL</p>
            <pre>{error.response.config.method} {error.response.config.url}</pre>
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
