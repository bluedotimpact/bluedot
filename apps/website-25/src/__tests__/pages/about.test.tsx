import { render } from '@testing-library/react';
import {
  afterAll, beforeAll, describe, expect, test,
} from 'vitest';
import AboutPage from '../../pages/about';
import { cleanupGlobalMocks, mockIntersectionObserver } from '../utils';

describe('AboutPage', () => {
  beforeAll(() => {
    mockIntersectionObserver();
  });

  afterAll(() => {
    cleanupGlobalMocks();
  });

  test('should render correctly', () => {
    const { container } = render(<AboutPage />);
    expect(container).toMatchSnapshot();
  });
});
