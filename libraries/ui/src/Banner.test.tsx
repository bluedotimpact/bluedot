import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Banner } from './Banner';

describe('Banner', () => {
  test('renders', () => {
    const { container } = render(<Banner title="Test Banner" />);
    expect(container).toMatchSnapshot();
  });

  test('renders with input and button', () => {
    const { container } = render(<Banner title="Test Banner" showInput showButton />);
    expect(container).toMatchSnapshot();
  });
});
