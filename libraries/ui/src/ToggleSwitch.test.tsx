import {
  describe, test, expect, vi,
} from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleSwitch } from './ToggleSwitch';

describe('ToggleSwitch', () => {
  test('renders unchecked', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} aria-label="Test toggle" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  test('renders checked', () => {
    render(<ToggleSwitch checked onChange={() => {}} aria-label="Test toggle" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  test('calls onChange with toggled value on click', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} aria-label="Test toggle" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
