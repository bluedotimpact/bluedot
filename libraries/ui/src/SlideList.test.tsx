import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  afterEach, beforeAll, describe, expect, it, vi,
} from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { act } from 'react';

import { SlideList } from './SlideList';

/**
 * Mocks the ResizeObserver API for testing purposes.
 * Based on this article: https://greenonsoftware.com/articles/testing/testing-and-mocking-resize-observer-in-java-script/
 *
 * @returns {Object} An object containing:
 *  - resizeCallback: A function to manually trigger resize events.
 *  - observerInitialized: A promise that resolves when the mock observer is set up.
 */
function mockResizeObserver() {
  const observeMock = vi.fn();
  const unobserveMock = vi.fn();
  const disconnectMock = vi.fn();

  const resizeCallbackRef = { current: null as ((entries: ResizeObserverEntry[]) => void) | null };

  let resolveFn: (() => void) | null = null;
  const observerInitialized = new Promise<void>((resolve) => {
    resolveFn = resolve;
  });

  const mockRO = vi.fn(function mockRO(callback: ResizeObserverCallback) {
    // @ts-ignore
    const self = this as ResizeObserver;
    self.observe = observeMock;
    self.unobserve = unobserveMock;
    self.disconnect = disconnectMock;

    resizeCallbackRef.current = (entries: ResizeObserverEntry[]) => callback(entries, self);

    if (resolveFn) {
      resolveFn();
      resolveFn = null;
    }
  });

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: mockRO,
  });

  return { resizeCallbackRef, observerInitialized };
}

describe('SlideList', () => {
  let originalResizeObserver: typeof ResizeObserver;

  beforeAll(() => {
    originalResizeObserver = window.ResizeObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.ResizeObserver = originalResizeObserver;
  });

  it('renders correctly', () => {
    const { container } = render(<SlideList>
      <div>Slide 1</div>
      <div>Slide 2</div>
      <div>Slide 3</div>
    </SlideList>);

    expect(container).toMatchSnapshot();
    expect(screen.queryAllByLabelText(/(Previous|Next) slide/)).toHaveLength(2);
  });

  it('hides next/previous buttons if container is wide enough to fit all items on one row', async () => {
    const { resizeCallbackRef, observerInitialized } = mockResizeObserver();

    const minWidth = 200;
    const maxRows = 1;

    render(<SlideList maxItemsPerSlide={3} maxRows={maxRows} minItemWidth={minWidth}>
      <div>Slide 1</div>
      <div>Slide 2</div>
      <div>Slide 3</div>
    </SlideList>);

    await observerInitialized;
    expect(resizeCallbackRef.current).not.toBeNull();

    await act(async () => {
      await act(async () => {
        resizeCallbackRef.current!([
          {
            contentRect: {
              width: 3 * minWidth + 1,
            } as DOMRectReadOnly,
          } as ResizeObserverEntry,
        ]);
      });
    });

    await waitFor(() => {
      expect(screen.queryAllByLabelText(/(Previous|Next) slide/)).toHaveLength(0);
    });
  });

  it('hides next/previous buttons if container is wide enough to fit all items on multiple rows', async () => {
    const { resizeCallbackRef, observerInitialized } = mockResizeObserver();

    const minWidth = 200;
    const maxRows = 2;

    render(<SlideList maxItemsPerSlide={3} maxRows={maxRows} minItemWidth={minWidth}>
      <div>Slide 1</div>
      <div>Slide 2</div>
      <div>Slide 3</div>
    </SlideList>);

    await observerInitialized;
    expect(resizeCallbackRef.current).not.toBeNull();

    await act(async () => {
      resizeCallbackRef.current!([
        {
          contentRect: {
            // Not quite wide enough to fit all on one row
            width: 3 * minWidth - 1,
          } as DOMRectReadOnly,
        } as ResizeObserverEntry,
      ]);
    });

    await waitFor(() => {
      expect(screen.queryAllByLabelText(/(Previous|Next) slide/)).toHaveLength(0);
    });
  });

  it('show next/previous buttons if container can\'t fit all items, and fits 2 items per slide when there is room', async () => {
    const { resizeCallbackRef, observerInitialized } = mockResizeObserver();

    const minWidth = 200;
    const maxRows = 1;

    const { container } = render(<SlideList maxItemsPerSlide={3} maxRows={maxRows} minItemWidth={minWidth}>
      <div>Slide 1</div>
      <div>Slide 2</div>
      <div>Slide 3</div>
    </SlideList>);

    await observerInitialized;
    expect(resizeCallbackRef.current).not.toBeNull();

    await act(async () => {
      resizeCallbackRef.current!([
        {
          contentRect: {
            // Not quite wide enough to fit all on one row
            width: 3 * minWidth - 1,
          } as DOMRectReadOnly,
        } as ResizeObserverEntry,
      ]);
    });

    await waitFor(() => {
      expect(screen.queryAllByLabelText(/(Previous|Next) slide/)).toHaveLength(2);
    });

    const firstSlide = container.querySelector('.slide-list__slide');
    expect(firstSlide).toHaveAttribute('data-width', expect.stringContaining('50%'));
  });
});
