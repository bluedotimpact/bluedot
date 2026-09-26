import {
  describe, expect, test, vi,
} from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  test('renders a type=button with the given accessible name', () => {
    render(<IconButton aria-label="Open menu"><svg aria-hidden="true" /></IconButton>);
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
  });

  test('calls onClick and passes through aria-expanded', () => {
    const onClick = vi.fn();
    render(<IconButton aria-label="Open menu" aria-expanded onClick={onClick} />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  test('disabled sets the native attribute and does not fire onClick', () => {
    const onClick = vi.fn();
    render(<IconButton aria-label="Open menu" disabled onClick={onClick} />);
    const button = screen.getByRole('button');
    expect(button).toHaveProperty('disabled', true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
