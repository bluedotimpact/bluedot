import {
  describe, test, expect, vi,
} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';

describe('Select', () => {
  const mockOptions = [
    { value: 'cat', label: 'Cat' },
    { value: 'dog', label: 'Dog' },
    { value: 'bird', label: 'Bird' },
  ];

  test('renders with label', () => {
    const { container } = render(
      <Select
        label="Pet"
        options={mockOptions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('shows placeholder when no value selected', () => {
    const { container } = render(
      <Select
        placeholder="Choose a pet"
        options={mockOptions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with icon', () => {
    const { container } = render(
      <Select
        label="User"
        icon={<span>👤</span>}
        options={mockOptions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders disabled state', () => {
    const { container } = render(
      <Select
        label="Disabled Select"
        disabled
        value="cat"
        options={mockOptions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('calls onChange when option selected', async () => {
    const onChange = vi.fn();
    render(
      <Select
        label="Pet"
        options={mockOptions}
        onChange={onChange}
      />,
    );

    // Open dropdown
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Select an option by role and accessible name
    const option = screen.getByRole('option', { name: 'Dog' });
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith('dog');
  });
});
