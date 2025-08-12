import { render } from '@testing-library/react';
import {
  describe,
  expect,
  test,
} from 'vitest';
import SocialShare from './SocialShare';

describe('SocialShare', () => {
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

  test('includes UTM parameters in share URLs without referral tracking', () => {
    const coursePath = '/courses/testing-sharing';
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
            expect(targetUrl.searchParams.get('utm_source')).toBe('referral');
            expect(targetUrl.searchParams.get('utm_campaign')).toBe('linkedin');
            expect(targetUrl.searchParams.get('r')).toBeNull(); // No referral ID
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
            expect(targetUrl.searchParams.get('utm_source')).toBe('referral');
            expect(targetUrl.searchParams.get('utm_campaign')).toBe('twitter');
            expect(targetUrl.searchParams.get('r')).toBeNull(); // No referral ID
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
