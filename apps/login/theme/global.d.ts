import type { Alpine } from 'alpinejs';

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- augmenting Window requires interface merging
  interface Window {
    Alpine: Alpine;
    result?: PublicKeyCredential;
  }
}
