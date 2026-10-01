import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import { Modal, type ModalProps } from './Modal';
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

describe.each([
  ['desktop dialog', true],
  ['mobile bottom drawer', false],
])('Modal (%s)', (_name, isDesktop) => {
  beforeEach(() => {
    mockUseAboveBreakpoint.mockReturnValue(isDesktop);
  });

  const renderModal = (props: Partial<ModalProps> = {}) => {
    const setIsOpen = vi.fn();
    const result = render(<Modal isOpen setIsOpen={setIsOpen} title="Title" bottomDrawerOnMobile {...props}>Content</Modal>);
    return { ...result, setIsOpen };
  };

  test('names the dialog from a string title', () => {
    renderModal({ title: 'Leave course' });

    expect(screen.getByRole('dialog', { name: 'Leave course' })).toBeInTheDocument();
  });

  test('escape closes it by default', async () => {
    const { setIsOpen } = renderModal();

    pressEscape();

    await waitFor(() => expect(setIsOpen).toHaveBeenCalledWith(false));
  });

  test('close button closes it by default', async () => {
    const { setIsOpen } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(setIsOpen).toHaveBeenCalledWith(false));
  });

  test('isDismissable={false} blocks escape and hides the close button', () => {
    const { setIsOpen } = renderModal({ isDismissable: false });

    pressEscape();

    expect(setIsOpen).not.toHaveBeenCalled();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  test('isDismissable={false} still closes programmatically', async () => {
    const { rerender } = renderModal({ isDismissable: false });

    rerender(<Modal isOpen={false} setIsOpen={vi.fn()} title="Title" bottomDrawerOnMobile isDismissable={false}>Content</Modal>);

    await waitFor(() => expect(screen.queryByText('Content')).not.toBeInTheDocument());
    // No orphaned overlay left behind blocking the page
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('moves focus to the title when it changes while open', () => {
    const { rerender } = renderModal({ title: 'Rejoin a group' });
    expect(screen.getByRole('heading', { name: 'Rejoin a group' })).not.toHaveFocus();

    rerender(<Modal isOpen setIsOpen={vi.fn()} title="Success" bottomDrawerOnMobile>Content</Modal>);

    expect(screen.getByRole('heading', { name: 'Success' })).toHaveFocus();
  });
});
