// eslint-disable-next-line import/no-extraneous-dependencies
import { setInteractionModality } from '@react-aria/interactions';
import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { HoverTooltip, Tooltip } from './Tooltip';

describe('Tooltip', () => {
  test('opens on click and matches snapshot', () => {
    const { container } = render(<Tooltip content="This is a helpful tooltip">
      <span>Tooltip trigger</span>
    </Tooltip>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('This is a helpful tooltip')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});

describe('HoverTooltip', () => {
  test('opens on hover and matches snapshot', async () => {
    const user = userEvent.setup();

    const { container } = render(<HoverTooltip content="This is a hover tooltip" delayInMs={0}>
      <span>Hover trigger</span>
    </HoverTooltip>);

    setInteractionModality('pointer');
    await user.hover(screen.getByRole('button'));

    expect(await screen.findByText('This is a hover tooltip')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('closes on unhover', async () => {
    const user = userEvent.setup();

    render(<HoverTooltip content="This is a hover tooltip" delayInMs={0}>
      <span>Hover trigger</span>
    </HoverTooltip>);

    setInteractionModality('pointer');
    await user.hover(screen.getByRole('button'));
    expect(await screen.findByText('This is a hover tooltip')).toBeInTheDocument();

    await user.unhover(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.queryByText('This is a hover tooltip')).not.toBeInTheDocument();
    });
  });
});
