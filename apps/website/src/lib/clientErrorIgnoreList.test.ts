import { describe, expect, it } from 'vitest';
import { shouldIgnoreClientError } from './clientErrorIgnoreList';

describe('shouldIgnoreClientError', () => {
  it.each([
    'Failed to connect to MetaMask',
    'Talisman extension has not been configured yet. Please continue with onboarding.',
    'Object Not Found Matching Id:4, MethodName:update, ParamCount:4',
    'Failed to fetch (login.bluedot.org)',
    'Failed to fetch (cdp-eu.customer.io)',
    'Failed to fetch (ad.doubleclick.net)',
  ])('ignores noise mirrored from Sentry ignoreErrors: %s', (message) => {
    expect(shouldIgnoreClientError(message)).toBe(true);
  });

  it.each([
    'Script error.',
    'Script error',
    'ResizeObserver loop completed with undelivered notifications.',
    'TypeError: undefined is not an object (evaluating \'window.ethereum.selectedAddress = undefined\')',
    'TypeError: undefined is not an object (evaluating \'window.__firefox__.reader\')',
    'ReferenceError: Can\'t find variable: __firefox__',
    'Uncaught TypeError: Cannot read properties of undefined (reading \'onMessage\')',
    'Cannot read properties of undefined (reading \'M_ID\')',
    'Load failed (login.bluedot.org)',
    'NetworkError when attempting to fetch resource. (login.bluedot.org)',
    'Error: Zotero Connector: Failed to send message i18n.getStrings to background page. It may be dead.',
    'Uncaught TypeError: Cannot redefine property: ethereum',
    'TypeError: undefined is not an object (evaluating \'n.standardSelectors\')',
    'ReferenceError: Can\'t find variable: DarkReader',
    'ReferenceError: jQuery is not defined',
    'Uncaught Error: Error invoking postMessage: Java object is gone',
    'Error: WKWebView API client did not respond to this postMessage',
    'TypeError: undefined is not an object (evaluating \'window.__firefox__.refresh_youtube_quality_E271671A9AFE46918663CBBADA360527\')',
    'TypeError: undefined is not an object (evaluating \'window.webkit.messageHandlers.scrollEventHandler.postMessage\')',
    'TypeError: undefined is not an object (evaluating \'top.webkit.messageHandlers.foregroundToBackground.postMessage\')',
    'Window message "chrome: call method" timed out.',
    'Uncaught (in promise) TypeError: Cannot read properties of undefined (reading \'runtime.sendMessage\')',
    'No Listener: tabs:outgoing.message.ready',
    'detectLanguage is not a function. (In \'r().i18n.detectLanguage(o)\', \'r().i18n.detectLanguage\' is undefined)',
    'func sseError not found',
    'can\'t access property "includes", args.site.enabledFeatures is undefined',
    'Invariant: attempted to hard navigate to the same URL /',
    'Invariant: attempted to hard navigate to the same URL /some/random/page-123',
    'Invariant: attempted to hard navigate to the same URL /courses/anything/1/1',
    'SyntaxError: Invalid regular expression: invalid group specifier name',
  ])('ignores noise beyond Sentry (verified third-party/benign): %s', (message) => {
    expect(shouldIgnoreClientError(message)).toBe(true);
  });

  it.each([
    'Cannot read properties of undefined (reading \'title\')',
    'Cannot read properties of undefined (reading \'courseId\')',
    'can\'t access property "title", b is undefined',
    'A network error occurred.',
    'TypeError: Cannot call a class as a function',
    'TimeoutError: operation timed out',
    'The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.',
    'Invariant: attempted to hard navigate to /other-page',
    'Failed to fetch',
    'NetworkError when attempting to fetch resource.',
    'TypeError: undefined is not an object (evaluating \'args.site.enabledFeatures\')',
    'args.site is undefined',
    'Invalid regular expression: missing /',
    'Failed to get base schema: Status: 429. Data: {}',
    'The service is temporarily unavailable. Please retry shortly.',
  ])('keeps real errors: %s', (message) => {
    expect(shouldIgnoreClientError(message)).toBe(false);
  });
});
