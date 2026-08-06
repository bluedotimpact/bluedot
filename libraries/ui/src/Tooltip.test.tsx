import '@testing-library/jest-dom';
import {
  fireEvent, render, screen,
} from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Tooltip } from './Tooltip';

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
