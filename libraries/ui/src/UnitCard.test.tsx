import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { UnitCard } from './UnitCard';

describe('UnitCard', () => {
  const defaultProps = {
    title: 'Title',
    description: 'Description',
    url: 'https://bluedot.org/courses/what-the-fish/1',
    unitNumber: '1',
  };

  test('renders default as expected', () => {
    const { container } = render(<UnitCard {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { container } = render(<UnitCard
      {...defaultProps}
      duration={10}
      isCurrentUnit
    />);
    expect(container).toMatchSnapshot();
  });
});
