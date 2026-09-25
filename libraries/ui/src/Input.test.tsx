import { createRef } from 'react';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  test('renders a bare input that accepts typed text', async () => {
    const user = userEvent.setup();
    const { container } = render(<Input aria-label="Email" placeholder="you@example.com" />);

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(container.firstChild).toBe(input);
    await user.type(input, 'ada');

    expect(input).toHaveValue('ada');
  });

  test('applies className to the input element', () => {
    render(<Input aria-label="Groups" className="w-16" />);

    expect(screen.getByRole('textbox', { name: 'Groups' })).toHaveClass('w-16', 'h-11');
  });

  test('disabled blocks input and focus', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Email" disabled defaultValue="fixed" />);

    const input = screen.getByRole('textbox', { name: 'Email' });
    await user.click(input);
    await user.keyboard('x');

    expect(input).toBeDisabled();
    expect(input).not.toHaveFocus();
    expect(input).toHaveValue('fixed');
  });

  test('forwards ref to the native element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  test('renders leading and trailing content beside the input', async () => {
    const user = userEvent.setup();
    let cleared = false;
    render(<Input
      aria-label="Search"
      defaultValue="ada"
      leading={<span data-testid="leading">🔍</span>}
      trailing={(
        <button
          type="button"
          onClick={() => {
            cleared = true;
          }}
        >
          Clear
        </button>
      )}
    />);

    const input = screen.getByRole('textbox', { name: 'Search' });
    expect(screen.getByTestId('leading')).toBeInTheDocument();
    expect(input).toHaveClass('pl-10', 'pr-11');

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(cleared).toBe(true);
  });
});
