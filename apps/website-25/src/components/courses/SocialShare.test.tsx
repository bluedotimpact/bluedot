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
});
