import { render } from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import SocialShare from './SocialShare';

const mockReferralId = 'test-referral-123';

// Mock implementations
const mockAxiosHooks = vi.fn();
const mockUseAuthStore = vi.fn();

// Mock modules
vi.mock('axios-hooks', () => ({
  default: () => mockAxiosHooks(),
}));

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useAuthStore: () => mockUseAuthStore(),
  };
});

describe('SocialShare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user is logged in', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({ token: 'mockToken', expiresAt: Date.now() + 10000 });
      mockAxiosHooks.mockReturnValue([{
        data: {
          referralId: mockReferralId,
        },
      }]);
    });

    test('renders default as expected', () => {
      const { container } = render(
        <SocialShare
          coursePath="/courses/future-of-ai"
          text="I've just completed a free, 2-hour course on the future of AI and its impacts on society. Here are my takeaways:"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    test('renders without optional args', () => {
      const { container } = render(
        <SocialShare
          coursePath="/future-of-ai"
        />,
      );
      const socialShareLinks = container.querySelectorAll('.social-share__link');
      socialShareLinks.forEach((link) => {
        expect(link.getAttribute('href')).toMatchSnapshot();
      });
    });

    test('includes referralCode in share URLs', () => {
      const coursePath = '/courses/testing-referrals';
      const { container } = render(
        <SocialShare
          coursePath={coursePath}
        />,
      );

      const expectedLinks = [
        {
          baseUrl: 'linkedin.com',
          assert: (link: Element | null) => {
            const href = link?.getAttribute('href');
            expect(href).not.toBeNull();

            const urlParams = new URLSearchParams(href!.split('?')[1]);
            const encodedTargetUrl = urlParams.get('url');
            expect(encodedTargetUrl).not.toBeNull();
            if (encodedTargetUrl) {
              const targetUrl = new URL(decodeURIComponent(encodedTargetUrl));
              expect(targetUrl.searchParams.get('r')).toBe(mockReferralId);
              expect(targetUrl.searchParams.get('utm_source')).toBe('referral');
              expect(targetUrl.searchParams.get('utm_campaign')).toBe('linkedin');
            }
          },
        },
        {
          baseUrl: 'twitter.com',
          assert: (link: Element | null) => {
            const href = link?.getAttribute('href');
            expect(href).not.toBeNull();

            const urlParams = new URLSearchParams(href!.split('?')[1]);
            const encodedTargetUrl = urlParams.get('url');
            expect(encodedTargetUrl).not.toBeNull();
            if (encodedTargetUrl) {
              const targetUrl = new URL(decodeURIComponent(encodedTargetUrl));
              expect(targetUrl.searchParams.get('r')).toBe(mockReferralId);
              expect(targetUrl.searchParams.get('utm_source')).toBe('referral');
              expect(targetUrl.searchParams.get('utm_campaign')).toBe('twitter');
            }
          },
        },
        {
          baseUrl: 'facebook.com',
          assert: (link: Element | null) => {
            const href = link?.getAttribute('href');
            expect(href).not.toBeNull();
          },
        },
      ];

      expectedLinks.forEach(({ baseUrl, assert }) => {
        const link = container.querySelector(`a[href*="${baseUrl}"]`);
        assert(link);
      });
    });
  });

  describe('when user is logged out', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({ token: null, expiresAt: null });
      mockAxiosHooks.mockReturnValue([{
        data: {
          referralId: null,
        },
      }]);
    });

    test('renders but does not include referralCode in share URLs', () => {
      const coursePath = '/courses/testing-referrals';
      const { container } = render(
        <SocialShare
          coursePath={coursePath}
        />,
      );

      expect(container).toMatchSnapshot();

      const expectedLinks = [
        {
          baseUrl: 'linkedin.com',
          assert: (link: Element | null) => {
            const href = link?.getAttribute('href');
            expect(href).not.toBeNull();

            const urlParams = new URLSearchParams(href!.split('?')[1]);
            const encodedTargetUrl = urlParams.get('url');
            expect(encodedTargetUrl).not.toBeNull();
            if (encodedTargetUrl) {
              const targetUrl = new URL(decodeURIComponent(encodedTargetUrl));
              expect(targetUrl.searchParams.get('r')).toBeNull();
              expect(targetUrl.searchParams.get('utm_source')).toBe('referral');
              expect(targetUrl.searchParams.get('utm_campaign')).toBe('linkedin');
            }
          },
        },
        {
          baseUrl: 'twitter.com',
          assert: (link: Element | null) => {
            const href = link?.getAttribute('href');
            expect(href).not.toBeNull();

            const urlParams = new URLSearchParams(href!.split('?')[1]);
            const encodedTargetUrl = urlParams.get('url');
            expect(encodedTargetUrl).not.toBeNull();
            if (encodedTargetUrl) {
              const targetUrl = new URL(decodeURIComponent(encodedTargetUrl));
              expect(targetUrl.searchParams.get('r')).toBeNull();
              expect(targetUrl.searchParams.get('utm_source')).toBe('referral');
              expect(targetUrl.searchParams.get('utm_campaign')).toBe('twitter');
            }
          },
        },
        {
          baseUrl: 'facebook.com',
          assert: (link: Element | null) => {
            const href = link?.getAttribute('href');
            expect(href).not.toBeNull();
          },
        },
      ];

      expectedLinks.forEach(({ baseUrl, assert }) => {
        const link = container.querySelector(`a[href*="${baseUrl}"]`);
        assert(link);
      });
    });
  });
});
