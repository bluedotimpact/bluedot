import { render } from '@testing-library/react';
import {
  describe,
  expect,
  test,
} from 'vitest';
import ValuesSection from './ValuesSection';

describe('ValuesSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<ValuesSection />);
    expect(container).toMatchSnapshot();
  });
});
