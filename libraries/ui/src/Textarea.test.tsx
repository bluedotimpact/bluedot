import { createRef } from 'react';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  test('accepts typed input', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Answer" />);

    const textarea = screen.getByRole('textbox', { name: 'Answer' });
    await user.type(textarea, 'hello');

    expect(textarea).toHaveValue('hello');
  });

  test('disabled blocks input and focus', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Answer" disabled defaultValue="fixed" />);

    const textarea = screen.getByRole('textbox', { name: 'Answer' });
    await user.click(textarea);
    await user.keyboard('x');

    expect(textarea).toBeDisabled();
    expect(textarea).not.toHaveFocus();
    expect(textarea).toHaveValue('fixed');
  });

  test('forwards ref to the native element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
