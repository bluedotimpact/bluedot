import {
  describe, expect, test, vi,
} from 'vitest';
import { createRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SearchInput } from './SearchInput';

const Controlled = ({ onChange = () => {}, disabled = false }: { onChange?: (value: string) => void; disabled?: boolean }) => {
  const [value, setValue] = useState('');
  return (
    <SearchInput
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      aria-label="Search"
      disabled={disabled}
    />
  );
};

describe('SearchInput', () => {
  test('reports the typed value and hides the clear button until there is one', () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    expect(screen.getByLabelText('Clear search')).not.toBeVisible();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'ada' } });

    expect(onChange).toHaveBeenLastCalledWith('ada');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeVisible();
  });

  test('typing and clearing keep focus on the same input', () => {
    render(<Controlled />);
    const box = screen.getByRole('searchbox', { name: 'Search' });
    box.focus();

    fireEvent.change(box, { target: { value: 'a' } });
    expect(document.activeElement).toBe(box);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBe(box);

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(box).toHaveValue('');
    expect(document.activeElement).toBe(box);
    expect(screen.getByLabelText('Clear search')).not.toBeVisible();
  });

  test('disabled disables the clear button too', () => {
    render(<SearchInput value="ada" onChange={() => {}} aria-label="Search" disabled />);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeDisabled();
  });

  test('forwards ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchInput ref={ref} value="" onChange={() => {}} aria-label="Search" />);
    expect(ref.current).toBe(screen.getByRole('searchbox', { name: 'Search' }));
  });
});
