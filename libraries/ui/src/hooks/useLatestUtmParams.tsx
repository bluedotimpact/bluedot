import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { addQueryParam } from '../utils/addQueryParam';

type LatestUtmParamsContextType = {
  latestUtmParams: Record<string, string>;
  appendLatestUtmParamsToUrl: (url: string) => string;
};

const latestUtmParamsContext = createContext<LatestUtmParamsContextType | null>(null);

const PASSTHROUGH_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
];

export const LatestUtmParamsProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [latestUtmParams, setLatestUtmParams] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const currentParams: Record<string, string> = {};
    let hasCurrentUtmParams = false;

    for (const param of PASSTHROUGH_PARAMS) {
      const value = router.query[param];
      if (value) {
        // Normalize to string: for array values, use the first value
        const normalizedValue = Array.isArray(value) ? value[0] : value;
        if (normalizedValue) {
          currentParams[param] = normalizedValue;
          hasCurrentUtmParams = true;
        }
      }
    }

    // If any new UTM param is found in the current URL,
    // replace the entire stored set (not merge) to avoid mismatched attribution
    if (hasCurrentUtmParams) {
      setLatestUtmParams(currentParams);

      posthog.capture('$set', { $set: currentParams });
    }
  }, [router.isReady, router.query]);

  const appendLatestUtmParamsToUrl = useCallback(
    (url: string) => {
      let result = url;

      Object.entries(latestUtmParams).forEach(([key, value]) => {
        if (value) {
          result = addQueryParam(result, key, value);
        }
      });

      return result;
    },
    [latestUtmParams],
  );

  const contextValue = useMemo(
    () => ({ latestUtmParams, appendLatestUtmParamsToUrl }),
    [latestUtmParams, appendLatestUtmParamsToUrl],
  );

  return (
    <latestUtmParamsContext.Provider value={contextValue}>
      {children}
    </latestUtmParamsContext.Provider>
  );
};

export const useLatestUtmParams = () => {
  const latestUtmParams = useContext(latestUtmParamsContext);

  if (!latestUtmParams) {
    // eslint-disable-next-line no-console
    console.warn('Latest UTM params context not found. Make sure LatestUtmParamsProvider is wrapping your component tree.');
    return {
      latestUtmParams: {},
      appendLatestUtmParamsToUrl: (url: string) => url,
    };
  }

  return latestUtmParams;
};
