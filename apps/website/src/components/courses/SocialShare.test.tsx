import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import SocialShare from './SocialShare';

describe('SocialShare', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <SocialShare
        coursePath="/courses/future-of-ai"
        referralCode="5SR7C4"
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
    const referralCode = 'ABCDEF';
    const coursePath = '/courses/testing-referrals';
    const { container } = render(
      <SocialShare
        coursePath={coursePath}
        referralCode={referralCode}
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
            expect(targetUrl.searchParams.get('r')).toBe(referralCode);
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
            expect(targetUrl.searchParams.get('r')).toBe(referralCode);
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
