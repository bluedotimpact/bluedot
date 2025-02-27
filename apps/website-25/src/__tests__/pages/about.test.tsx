import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import AboutPage from '../../pages/about';

describe('AboutPage', () => {
  test('should render correctly', () => {
    const { container } = render(<AboutPage />);
    expect(container).toMatchSnapshot();
  });
});
