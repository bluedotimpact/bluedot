import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import { Modal } from './Modal';
import { useAboveBreakpoint } from './hooks/useBreakpoint';

vi.mock('./hooks/useBreakpoint', async () => {
  const actual = await vi.importActual('./hooks/useBreakpoint');
  return {
    ...actual,
    useAboveBreakpoint: vi.fn(),
  };
});

const mockUseAboveBreakpoint = vi.mocked(useAboveBreakpoint);

const pressEscape = () => {
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
};

describe('Modal', () => {
  describe('desktop', () => {
    beforeEach(() => {
      mockUseAboveBreakpoint.mockReturnValue(true);
    });

    test('is dismissable by default', () => {
      const setIsOpen = vi.fn();
      render(<Modal isOpen setIsOpen={setIsOpen} title="Title">Content</Modal>);

      pressEscape();
      expect(setIsOpen).toHaveBeenCalledWith(false);
    });

    test('cannot be dismissed with escape when isDismissable is false', () => {
      const setIsOpen = vi.fn();
      render(<Modal isOpen setIsOpen={setIsOpen} title="Title" isDismissable={false}>Content</Modal>);

      pressEscape();

      expect(setIsOpen).not.toHaveBeenCalled();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    test('close button still works when isDismissable is false', () => {
      const setIsOpen = vi.fn();
      render(<Modal isOpen setIsOpen={setIsOpen} title="Title" isDismissable={false}>Content</Modal>);

      fireEvent.click(screen.getByLabelText('Close'));

      expect(setIsOpen).toHaveBeenCalledWith(false);
    });

    test('can still be closed programmatically when isDismissable is false', () => {
      const { rerender } = render(<Modal isOpen setIsOpen={vi.fn()} title="Title" isDismissable={false}>Content</Modal>);
      rerender(<Modal isOpen={false} setIsOpen={vi.fn()} title="Title" isDismissable={false}>Content</Modal>);

      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
  });

  describe('mobile bottom drawer', () => {
    beforeEach(() => {
      mockUseAboveBreakpoint.mockReturnValue(false);
    });

    test('is dismissable by default', async () => {
      render(<Modal isOpen setIsOpen={vi.fn()} title="Title" bottomDrawerOnMobile>Content</Modal>);

      pressEscape();

      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    test('cannot be dismissed with escape when isDismissable is false', () => {
      const setIsOpen = vi.fn();
      render(<Modal isOpen setIsOpen={setIsOpen} title="Title" bottomDrawerOnMobile isDismissable={false}>Content</Modal>);

      pressEscape();

      expect(setIsOpen).not.toHaveBeenCalled();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    test('can still be closed programmatically when isDismissable is false', async () => {
      const { rerender } = render(<Modal isOpen setIsOpen={vi.fn()} title="Title" bottomDrawerOnMobile isDismissable={false}>Content</Modal>);
      rerender(<Modal isOpen={false} setIsOpen={vi.fn()} title="Title" bottomDrawerOnMobile isDismissable={false}>Content</Modal>);

      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
      // No orphaned overlay left behind blocking the page
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
