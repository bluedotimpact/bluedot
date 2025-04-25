import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import CommunityValuesSection from './CommunityValuesSection';

describe('CommunityValuesSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<CommunityValuesSection />);
    expect(container).toMatchSnapshot();
  });
});
