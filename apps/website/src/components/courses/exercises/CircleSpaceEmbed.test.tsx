import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import CircleSpaceEmbed from './CircleSpaceEmbed';

describe('CircleSpaceEmbed', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <CircleSpaceEmbed
        spaceSlug="events"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with custom args', () => {
    const { container } = render(
      <CircleSpaceEmbed
        spaceSlug="events"
        style={{ width: '100%', height: '100%', minHeight: '510px' }}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
