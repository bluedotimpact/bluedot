import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Callout from './CareersCallout';

describe('Callout', () => {
  test('renders default as expected', () => {
    const { container } = render(<Callout />);
    expect(container).toMatchSnapshot();
  });
});
