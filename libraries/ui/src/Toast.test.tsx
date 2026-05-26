import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import {
  describe, test, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { Toaster } from './Toast';
import {
  toast, useToastStore, TOAST_DEFAULT_DURATION, TOAST_EXIT_DURATION_MS, TOAST_VISIBLE_CAP,
} from './toastStore';

const resetStore = () => {
  useToastStore.setState({ toasts: [], queue: [], paused: false });
};

describe('toast store', () => {
  beforeEach(() => {
    resetStore();
  });

  test('add() appends visible toast', () => {
    toast('Hello');
    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]!.message).toBe('Hello');
    expect(state.toasts[0]!.variant).toBe('default');
  });

  test('toast.success() sets success variant', () => {
    toast.success('Saved');
    expect(useToastStore.getState().toasts[0]!.variant).toBe('success');
  });

  test('caps visible at 3 and queues the rest', () => {
    toast('1');
    toast('2');
    toast('3');
    toast('4');
    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(TOAST_VISIBLE_CAP);
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0]!.message).toBe('4');
  });

  test('remove() promotes from queue', () => {
    toast('1');
    toast('2');
    toast('3');
    toast('4');
    useToastStore.getState().remove(useToastStore.getState().toasts[0]!.id);
    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(TOAST_VISIBLE_CAP);
    expect(state.queue).toHaveLength(0);
    expect(state.toasts[2]!.message).toBe('4');
  });

  test('id option dedupes and updates in place', () => {
    toast('First', { id: 'same' });
    toast('Second', { id: 'same' });
    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]!.message).toBe('Second');
  });

  test('toast() returns id', () => {
    const id = toast('Hi', { id: 'custom' });
    expect(id).toBe('custom');
  });
});

describe('Toaster', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    resetStore();
  });

  test('renders message and description', () => {
    render(<Toaster />);
    act(() => {
      toast('Title', { description: 'Body' });
    });
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  test('auto-dismisses after duration', () => {
    render(<Toaster />);
    act(() => {
      toast('Bye');
    });
    expect(screen.queryByText('Bye')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(TOAST_DEFAULT_DURATION + 10);
    });
    act(() => {
      vi.advanceTimersByTime(TOAST_EXIT_DURATION_MS + 10);
    });
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  test('hover pauses auto-dismiss', () => {
    render(<Toaster />);
    act(() => {
      toast('Hover');
    });
    const region = screen.getByRole('region');
    fireEvent.mouseEnter(region);
    act(() => {
      vi.advanceTimersByTime(TOAST_DEFAULT_DURATION + 500);
    });
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  test('close button dismisses', () => {
    render(<Toaster />);
    act(() => {
      toast('Close me', { closeButton: true });
    });
    const button = screen.getByLabelText('Dismiss notification');
    fireEvent.click(button);
    act(() => {
      vi.advanceTimersByTime(TOAST_EXIT_DURATION_MS + 50);
    });
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  test('success variant renders check icon', () => {
    render(<Toaster />);
    act(() => {
      toast.success('Saved');
    });
    const region = screen.getByRole('region');
    expect(region.querySelector('svg')).toBeTruthy();
  });
});
