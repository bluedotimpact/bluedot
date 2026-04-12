import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import GrantsSection from './GrantsSection';

describe('GrantsSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<GrantsSection />);
    expect(container).toMatchSnapshot();
  });
});
