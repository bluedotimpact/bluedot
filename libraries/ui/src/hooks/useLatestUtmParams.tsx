import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { useRouter } from 'next/router';
import { addQueryParam } from '../utils/addQueryParam';

type LatestUtmParamsContext = {
  latestUtmParams: Record<string, string | string[]>;
  appendLatestUtmParamsToUrl: (url: string) => string;
};

const latestUtmParamsContext = createContext<LatestUtmParamsContext | null>(null);

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
  const latestUtmParamsRef = useRef<Record<string, string | string[]>>({});

  const latestUtmParams = useMemo(() => {
    if (!router.isReady) {
      return {};
    }

    const currentParams: LatestUtmParamsContext['latestUtmParams'] = {};
    let hasCurrentUtmParams = false;

    for (const param of PASSTHROUGH_PARAMS) {
      const value = router.query[param];
      if (value) {
        currentParams[param] = value;
        hasCurrentUtmParams = true;
      }
    }

    // If any new UTM param is found in the current URL,
    // replace the entire stored set (not merge) to avoid mismatched attribution
    if (hasCurrentUtmParams) {
      latestUtmParamsRef.current = currentParams;
    }

    return latestUtmParamsRef.current;
  }, [router.isReady, router.query]);

  const appendLatestUtmParamsToUrl = useCallback(
    (url: string) => {
      let result = url;

      Object.entries(latestUtmParams).forEach(([key, value]) => {
        // For array values, only use the first value (arrays are unlikely in practice for UTM params)
        const valueToAdd = Array.isArray(value) ? value[0] : value;

        if (valueToAdd) {
          result = addQueryParam(result, key, valueToAdd);
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
