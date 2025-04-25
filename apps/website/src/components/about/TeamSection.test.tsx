import { render } from '@testing-library/react';
import {
  describe,
  expect,
  test,
} from 'vitest';
import TeamSection from './TeamSection';

describe('TeamSection', () => {
  test('renders as expected', () => {
    const { container } = render(<TeamSection />);
    expect(container).toMatchSnapshot();
  });
});
