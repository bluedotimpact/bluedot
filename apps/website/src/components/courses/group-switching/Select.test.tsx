import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe, test, expect, vi,
} from 'vitest';
import Select from './Select';

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useAboveBreakpoint: vi.fn().mockReturnValue(true),
  };
});

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

describe('Select', () => {
  test('renders with selected value', () => {
    render(
      <Select
        options={mockOptions}
        value="option1"
        onChange={() => {}}
        ariaLabel="Test select"
      />,
    );

    expect(screen.getByRole('button')).toHaveTextContent('Option 1');
  });

  test('calls onChange when an option is selected', () => {
    const handleChange = vi.fn();
    render(
      <Select
        options={mockOptions}
        value="option1"
        onChange={handleChange}
        ariaLabel="Test select"
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('option', { name: 'Option 2' }));

    expect(handleChange).toHaveBeenCalledWith('option2');
  });

  test('applies disabled styling to disabled options', () => {
    const optionsWithDisabled = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
    ];
    render(
      <Select
        options={optionsWithDisabled}
        onChange={() => {}}
        ariaLabel="Test select"
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    const disabledOption = screen.getByRole('option', { name: 'Option 2' });
    expect(disabledOption).toHaveClass('opacity-50', 'cursor-not-allowed');
  });
});
