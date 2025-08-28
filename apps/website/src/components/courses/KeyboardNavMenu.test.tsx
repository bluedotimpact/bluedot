import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import KeyboardNavMenu from './KeyboardNavMenu';

describe('KeyboardNavMenu', () => {
  test('renders shortcuts button', () => {
    const { getByRole } = render(<KeyboardNavMenu />);

    const button = getByRole('button', { name: 'Keyboard shortcuts' });
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Shortcuts');
  });

  test('shows KeyboardNavMenu and opens popover on click', async () => {
    const { getByText, getByRole, queryByText } = render(<KeyboardNavMenu />);

    const button = getByRole('button', { name: 'Keyboard shortcuts' });

    // Initially, the popover content should not be visible
    expect(queryByText('Inside courses')).toBeNull();

    // Click the button to open the popover
    await button.click();

    // Now the popover content should be visible
    expect(getByText('Inside courses')).toBeTruthy();
    expect(getByText('Go to chunk or unit 1-9')).toBeTruthy();
    expect(getByText('Next chunk or unit')).toBeTruthy();
    expect(getByText('Previous chunk or unit')).toBeTruthy();

    // Check that keyboard shortcuts are displayed
    expect(getByText('1-9')).toBeTruthy();
    expect(getByText('→')).toBeTruthy();
    expect(getByText('←')).toBeTruthy();
  });
});
