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
  // Injected scripts (in-app browsers, share sheets) read these tags on every
  // page and throw if they're missing — see issue #2881.
  test('sets default Open Graph tags', () => {
    renderWithHead(<DefaultHeadTags />);

    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
    expect(document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')).toBe('BlueDot Impact');
  });
});
