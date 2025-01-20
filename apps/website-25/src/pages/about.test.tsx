import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import AboutPage from './about';

describe('AboutPage', () => {
  test('should render the error message correctly', () => {
    const { container } = render(<AboutPage />);
    expect(container).toMatchSnapshot();
  });
});
