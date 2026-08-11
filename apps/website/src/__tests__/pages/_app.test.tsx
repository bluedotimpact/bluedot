import '@testing-library/jest-dom';
import {
  describe, expect, test, vi,
} from 'vitest';
import { DefaultHeadTags } from '../../pages/_app';
import { renderWithHead } from '../testUtils';

// next/font/local can't run outside the Next.js build pipeline
vi.mock('../../lib/fonts', () => ({
  inter: { className: 'inter' },
  interDisplay: { variable: '--font-inter-display' },
}));

vi.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <head-proxy data-testid="head-proxy">{children}</head-proxy>
  ),
}));

describe('DefaultHeadTags', () => {
  // Injected scripts (in-app browsers, share sheets) read these tags on every page and throw if they're missing
  test('sets default Open Graph tags', () => {
    renderWithHead(<DefaultHeadTags />);

    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
    expect(document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')).toBe('BlueDot Impact');
  });

  test('sets default og:image and twitter:card tags', () => {
    renderWithHead(<DefaultHeadTags />);

    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://bluedot.org/images/logo/link-preview-fallback.png');
    expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image');
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe('https://bluedot.org/images/logo/link-preview-fallback.png');
    // No dimension/type claims: pages overriding og:image without dimensions
    // would inherit them, and they can't be verified for every override
    expect(document.querySelector('meta[property="og:image:width"]')).toBeNull();
    expect(document.querySelector('meta[property="og:image:height"]')).toBeNull();
    expect(document.querySelector('meta[property="og:image:type"]')).toBeNull();
  });
});
