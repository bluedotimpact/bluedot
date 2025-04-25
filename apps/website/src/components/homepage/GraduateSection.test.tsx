import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import GraduateSection from './GraduateSection';

describe('GraduateSection', () => {
  test('renders default as expected', () => {
    const { container } = render(<GraduateSection />);
    expect(container).toMatchSnapshot();
  });
});
