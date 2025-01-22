import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import CareersPage from '../../pages/careers';

describe('CareersPage', () => {
  test('should render the error message correctly', () => {
    const { container } = render(<CareersPage />);
    expect(container).toMatchSnapshot();
  });
});
