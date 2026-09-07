/**
 * Messages too noisy for the #update_client-errors Slack channel.
 * Checked before reporting. Mirrored patterns are dropped by Sentry too.
 * The rest stay in Sentry, just out of Slack.
 */

export const SENTRY_MIRRORED_PATTERNS: RegExp[] = [
  // Same as Sentry `ignoreErrors` in `src/instrumentation-client.ts`.
  /failed to connect to metamask/i,
  /talisman extension has not been configured/i,
  /object not found matching id:\d+, methodname:/i, // Outlook SafeLinks scanner
  // Extension-wrapped fetch appends "(hostname)". Native fetch never does,
  // so this can't match our code. Covers ad, analytics, and auth hosts:
  // a real outage shows server-side, and these reports can't tell an
  // outage from an adblocker or dropped connection.
  /^failed to fetch \(.+\)$/i,
];

const BEYOND_SENTRY_PATTERNS: RegExp[] = [
  // Not in Sentry's list. Each names its source.
  /^script error\.?$/i, // Other sites' errors arrive blank
  /resizeobserver loop/i, // Harmless browser warning
  /cannot redefine property: ethereum/i, // Wallet extensions fighting
  /__firefox__/i, // Firefox internals
  /reading 'onmessage'/i, // Extension messaging
  /runtime\.sendmessage/i, // Extension messaging
  /no listener: tabs:/i, // Extension tabs API
  /reading 'm_id'/i, // Email scanner artifact
  /load failed \(.+\)$/i, // Safari's phrasing of the fetch rule
  /networkerror when attempting to fetch resource\. \(.+\)$/i, // Firefox's phrasing of the fetch rule, wrapped form only
  /zotero connector/i, // Zotero extension
  /wkwebview api client/i, // In-app browsers
  /java object is gone/i, // Old Android webview
  /can't find variable: darkreader/i, // DarkReader extension
  /jquery is not defined/i, // We don't use jQuery
  /chrome: call method/i, // Timed-out extension call
  /detectlanguage is not a function/i, // Translation extension
  /func sseerror not found/i, // Missing marketing-tag callback
  /enabledfeatures.*undefined/i, // Extension config object
  /^window message ".+" timed out\.?$/i, // Timed-out extension call
  /evaluating 'window\.ethereum/i, // Wallet selectedAddress fight
  /evaluating 'n\.standardselectors/i, // Minified extension code
  /webkit\.messagehandlers/i, // iOS webview bridge
  /can't access property "includes", args\.site\.enabledfeatures is undefined/i, // Privacy-extension read
  // Next.js guard for same-page clicks. The user is already there.
  /attempted to hard navigate to the same url/i,
];

const IGNORED_MESSAGE_PATTERNS: RegExp[] = [...SENTRY_MIRRORED_PATTERNS, ...BEYOND_SENTRY_PATTERNS];

export function shouldIgnoreClientError(message: string): boolean {
  return IGNORED_MESSAGE_PATTERNS.some((pattern) => pattern.test(message.trim()));
}
