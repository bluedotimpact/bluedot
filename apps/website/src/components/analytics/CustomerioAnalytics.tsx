'use client';

import { useEffect } from 'react';
import type { AnalyticsBrowser } from '@customerio/cdp-analytics-browser';

// Customer.io write key - publicly available client-side key (safe to commit)
const CUSTOMERIO_WRITE_KEY = '065cded067e2286f361d';

// SDK instance - exported directly so consumers get full SDK typing
let cioInstance: AnalyticsBrowser | undefined;
let cioPromise: Promise<AnalyticsBrowser> | undefined;

// Get the Customer.io SDK instance - returns a promise that resolves when ready
export const getCioAnalytics = async () => {
  // If already loaded, return it
  if (cioInstance) {
    return cioInstance;
  }

  // If loading, wait for existing promise
  if (cioPromise) {
    return cioPromise;
  }

  // Otherwise, create a promise that resolves when SDK loads
  cioPromise = new Promise((resolve) => {
    const checkInstance = () => {
      if (cioInstance) {
        resolve(cioInstance);
      } else {
        setTimeout(checkInstance, 50);
      }
    };

    checkInstance();
  });

  return cioPromise;
};

const CustomerioAnalytics = () => {
  useEffect(() => {
    if (!CUSTOMERIO_WRITE_KEY || cioInstance) {
      return;
    }

    // IMPORTANT: Both dynamic imports are required
    // 1. _app.tsx uses dynamic() to prevent SSR execution
    // 2. This import() prevents build-time bundling which causes "Cannot access 'Ue' before initialization"
    //    The Customer.io package has internal circular dependencies that break Next.js builds
    import('@customerio/cdp-analytics-browser')
      .then(({ AnalyticsBrowser }) => {
        cioInstance = AnalyticsBrowser.load(
          {
            cdnURL: 'https://cdp-eu.customer.io',
            writeKey: CUSTOMERIO_WRITE_KEY,
          },
          {
            integrations: {
              'Customer.io Data Pipelines': {
                auto_track: false,
              },
            },
          },
        );
      })
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load Customer.io SDK:', error);
      });
  }, []);

  return null;
};

export default CustomerioAnalytics;
