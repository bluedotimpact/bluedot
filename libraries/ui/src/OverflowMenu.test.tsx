import {
  describe, test, expect, vi,
} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OverflowMenu } from './OverflowMenu';

describe('OverflowMenu', () => {
  test('closes menu when option is selected', () => {
    const onAction = vi.fn();
    const mockItems = [
      { id: 'edit', label: 'Edit', onAction },
      { id: 'delete', label: 'Delete', onAction: vi.fn() },
    ];

    render(<OverflowMenu items={mockItems} />);

    // Open the menu
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Click on an option
    const editOption = screen.getByText('Edit');
    fireEvent.click(editOption);

    // The options should no longer be visible
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(onAction).toHaveBeenCalled();
  });

  test('closes menu when href-only option is selected and navigates to link', () => {
    const mockItems = [
      { id: 'view', label: 'View Details', href: '/details' },
      { id: 'edit', label: 'Edit', onAction: vi.fn() },
    ];

    render(<OverflowMenu items={mockItems} />);

    // Open the menu
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Verify the link is rendered with correct href
    const viewOption = screen.getByText('View Details');
    expect(viewOption).toBeInTheDocument();
    expect(viewOption.closest('a')).toHaveAttribute('href', '/details');

    // Click on the href option
    fireEvent.click(viewOption);

    // The menu should close - options should no longer be visible
    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });
});
