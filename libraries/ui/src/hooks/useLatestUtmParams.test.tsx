import type React from 'react';
import { renderHook } from '@testing-library/react';
import { useRouter } from 'next/router';
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { LatestUtmParamsProvider, useLatestUtmParams } from './useLatestUtmParams';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;

const createWrapper = (query: Record<string, string | string[]> = {}) => {
  mockUseRouter.mockReturnValue({
    isReady: true,
    query,
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <LatestUtmParamsProvider>{children}</LatestUtmParamsProvider>
  );

  return TestWrapper;
};

describe('useLatestUtmParams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract UTM parameters from router query', () => {
    const query = {
      utm_source: 'probably-good',
      utm_medium: 'email',
      utm_campaign: 'agi-strategy-launch',
      utm_term: 'ai-safety',
      utm_content: 'apply-now-button',
      other_param: 'should-be-ignored',
    };

    const { result } = renderHook(() => useLatestUtmParams(), {
      wrapper: createWrapper(query),
    });

    expect(result.current.latestUtmParams).toEqual({
      utm_source: 'probably-good',
      utm_medium: 'email',
      utm_campaign: 'agi-strategy-launch',
      utm_term: 'ai-safety',
      utm_content: 'apply-now-button',
    });
  });

  it('should persist most recent UTM params when navigating without new params', () => {
    // Create initial hook with UTM params
    let currentQuery: Record<string, string> = {
      utm_source: 'probably-good',
      utm_campaign: 'agi-strategy-launch',
    };

    mockUseRouter.mockReturnValue({
      isReady: true,
      query: currentQuery,
    });

    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <LatestUtmParamsProvider>{children}</LatestUtmParamsProvider>
    );

    const { result, rerender } = renderHook(() => useLatestUtmParams(), {
      wrapper: TestWrapper,
    });

    expect(result.current.latestUtmParams).toEqual({
      utm_source: 'probably-good',
      utm_campaign: 'agi-strategy-launch',
    });

    // Navigate to page without UTM params
    currentQuery = {};

    mockUseRouter.mockReturnValue({
      isReady: true,
      query: currentQuery,
    });

    rerender();

    // Should still have the original params
    expect(result.current.latestUtmParams).toEqual({
      utm_source: 'probably-good',
      utm_campaign: 'agi-strategy-launch',
    });
  });

  it('should replace persisted params when new UTM params appear', () => {
    // Start with first set of UTM params
    let currentQuery: Record<string, string> = {
      utm_source: 'probably-good',
      utm_campaign: 'agi-strategy-launch',
    };

    mockUseRouter.mockReturnValue({
      isReady: true,
      query: currentQuery,
    });

    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <LatestUtmParamsProvider>{children}</LatestUtmParamsProvider>
    );

    const { result, rerender } = renderHook(() => useLatestUtmParams(), {
      wrapper: TestWrapper,
    });

    expect(result.current.latestUtmParams).toEqual({
      utm_source: 'probably-good',
      utm_campaign: 'agi-strategy-launch',
    });

    // Navigate with new UTM params, should replace old ones
    currentQuery = {
      utm_medium: 'social',
      utm_campaign: 'biosecurity-fundamentals',
    };

    mockUseRouter.mockReturnValue({
      isReady: true,
      query: currentQuery,
    });

    rerender();

    expect(result.current.latestUtmParams).toEqual({
      // Note: utm_source gets overwritten
      utm_medium: 'social',
      utm_campaign: 'biosecurity-fundamentals',
    });
  });

  it('should handle empty query', () => {
    const { result } = renderHook(() => useLatestUtmParams(), {
      wrapper: createWrapper({}),
    });

    expect(result.current.latestUtmParams).toEqual({});
  });

  it('should append latest UTM params to URL', () => {
    const query = {
      utm_source: 'probably-good',
      utm_campaign: 'agi-strategy-launch',
    };

    const { result } = renderHook(() => useLatestUtmParams(), {
      wrapper: createWrapper(query),
    });

    const testUrl = 'https://web.miniextensions.com/9Kuya4AzFGWgayC3gQaX';
    const urlWithParams = result.current.appendLatestUtmParamsToUrl(testUrl);

    expect(urlWithParams).toBe('https://web.miniextensions.com/9Kuya4AzFGWgayC3gQaX?utm_source=probably-good&utm_campaign=agi-strategy-launch');
  });
});
