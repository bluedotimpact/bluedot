import type React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  describe, test, expect, vi,
} from 'vitest';
import { Select } from './Select';
import { BottomDrawerModal } from './BottomDrawerModal';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

describe('Select', () => {
  test('renders with selected value', () => {
    const { container } = render(<Select
      options={mockOptions}
      value="option1"
      onChange={() => {}}
      aria-label="Test select"
    />);

    expect(screen.getByRole('button')).toHaveTextContent('Option 1');

    expect(container).toMatchSnapshot();
  });

  test('calls onChange when an option is selected', () => {
    const handleChange = vi.fn();
    render(<Select
      options={mockOptions}
      value="option1"
      onChange={handleChange}
      aria-label="Test select"
    />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('option', { name: 'Option 2' }));

    expect(handleChange).toHaveBeenCalledWith('option2');
  });

  test('selects with the keyboard', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Select
      options={mockOptions}
      onChange={handleChange}
      aria-label="Test select"
    />);

    await user.tab();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(handleChange).toHaveBeenCalledWith('option2');
  });

  test('marks disabled options', () => {
    const optionsWithDisabled = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
    ];
    const { container } = render(<Select
      options={optionsWithDisabled}
      onChange={() => {}}
      aria-label="Test select"
    />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('option', { name: 'Option 2' })).toHaveAttribute('aria-disabled', 'true');

    expect(container).toMatchSnapshot();
  });

  test('forwards form attributes to the hidden native select', () => {
    const { container } = render(<Select
      options={mockOptions}
      value="option1"
      onChange={() => {}}
      name="course"
      required
      aria-label="Test select"
    />);

    const native = container.querySelector('select');
    expect(native).toHaveAttribute('name', 'course');
    expect(native).toBeRequired();
  });

  test('marks the root invalid from aria-invalid', () => {
    const { container } = render(<Select
      options={mockOptions}
      onChange={() => {}}
      aria-invalid
      aria-label="Test select"
    />);

    expect(container.querySelector('[data-rac]')).toHaveAttribute('data-invalid', 'true');
  });

  test('selects an option from inside a BottomDrawerModal without dismissing it', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const setIsOpen = vi.fn();
    render(<BottomDrawerModal isOpen setIsOpen={setIsOpen} title="Switch group" initialSize="fit-content">
      <Select options={mockOptions} onChange={handleChange} aria-label="Test select" />
    </BottomDrawerModal>);

    await user.click(screen.getByRole('button', { name: 'Test select' }));
    const option = screen.getByRole('option', { name: 'Option 2' });
    expect(option).toBeVisible();
    expect(option.closest('[aria-hidden="true"]')).toBeNull();

    await user.click(option);

    expect(handleChange).toHaveBeenCalledWith('option2');
    expect(setIsOpen).not.toHaveBeenCalledWith(false);
  });

  test('shows native required validation on submit when aria-invalid is omitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const { container } = render(<form onSubmit={onSubmit}>
      <Select options={mockOptions} onChange={() => {}} name="course" required aria-label="Test select" />
      <button type="submit">Submit</button>
    </form>);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.querySelector('[data-rac]')).toHaveAttribute('data-invalid', 'true');
  });
});
