import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { Tooltip } from './Tooltip';

const LABEL = 'Show more information';
const CONTENT = 'This is a helpful tooltip';

describe('Tooltip', () => {
  test('opens on click with an accessible name on trigger and bubble', async () => {
    const user = userEvent.setup();
    render(<Tooltip content={CONTENT} aria-label={LABEL} />);

    const trigger = screen.getByRole('button', { name: LABEL });
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument();

    await user.click(trigger);

    expect(screen.getByRole('dialog', { name: LABEL })).toHaveTextContent(CONTENT);
  });

  test('opens on Enter and Space from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Tooltip content={CONTENT} aria-label={LABEL} />);

    await user.tab();
    expect(screen.getByRole('button', { name: LABEL })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.keyboard(' ');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Tooltip content={CONTENT} aria-label={LABEL} />);

    await user.click(screen.getByRole('button', { name: LABEL }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('closes on outside click', async () => {
    const user = userEvent.setup();
    render(<>
      <p>Outside</p>
      <Tooltip content={CONTENT} aria-label={LABEL} />
    </>);

    await user.click(screen.getByRole('button', { name: LABEL }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('applies the requested placement', async () => {
    const user = userEvent.setup();
    render(<Tooltip content={CONTENT} aria-label={LABEL} placement="bottom" />);

    await user.click(screen.getByRole('button', { name: LABEL }));

    const popover = screen.getByRole('dialog').closest('[data-placement]');
    expect(popover).toHaveAttribute('data-placement', 'bottom');
    expect(popover?.querySelector('svg')).toBeInTheDocument();
  });

  test('renders custom trigger content instead of the default icon', () => {
    render(<Tooltip content={CONTENT} aria-label={LABEL}>
      <span>Custom trigger</span>
    </Tooltip>);

    const trigger = screen.getByRole('button', { name: LABEL });
    expect(trigger).toHaveTextContent('Custom trigger');
    expect(trigger.querySelector('svg')).toBeNull();
  });
});
