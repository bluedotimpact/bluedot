import '@testing-library/jest-dom';
import {
  act, render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { CourseCaption, CourseFigure, CourseImageRow } from './CourseFigure';

let resize: () => void;
let viewportWidth = 600;
let viewportHeight = 300;

beforeEach(() => {
  viewportWidth = 600;
  viewportHeight = 300;
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => viewportWidth);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => viewportHeight);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    width: viewportWidth,
    height: viewportHeight,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: viewportWidth,
    bottom: viewportHeight,
    toJSON: () => ({}),
  }));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) {
      resize = callback;
    }

    observe() {}

    disconnect() {}
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const setNaturalSize = (image: HTMLElement, width: number, height: number) => {
  Object.defineProperties(image, {
    naturalWidth: { value: width, configurable: true },
    naturalHeight: { value: height, configurable: true },
  });
};

describe('CourseFigure', () => {
  test('preserves authored width, caption alignment, and relative image widths', () => {
    render(<CourseFigure width="510.52" align="center">
      <CourseImageRow widths="306.5,204.02" gap="8">
        <img src="/first.webp" alt="First example" />
        <img src="/second.webp" alt="Second example" />
      </CourseImageRow>
      <CourseCaption align="center"><p>Image comparison</p></CourseCaption>
    </CourseFigure>);

    expect(screen.getByRole('figure')).toHaveStyle({ width: '510.52px' });
    expect(screen.getByText('Image comparison').parentElement).toHaveClass('text-center');
    expect(screen.getByAltText('First example').parentElement).toHaveStyle({ flexGrow: '306.5' });
    expect(screen.getByAltText('Second example').parentElement).toHaveStyle({ flexGrow: '204.02' });
  });

  test('fits a tall image within both axes, zooms, and refits after resizing', async () => {
    const user = userEvent.setup();
    render(<CourseFigure><img src="/tall.webp" alt="Tall diagram" /></CourseFigure>);
    setNaturalSize(screen.getByAltText('Tall diagram'), 1000, 2000);
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Enlarge image' }));
    });

    const dialog = screen.getByRole('dialog');
    const image = within(dialog).getByAltText('Tall diagram');
    expect(image).toHaveStyle({ width: '150px' });
    await act(async () => {
      await user.click(within(dialog).getByRole('button', { name: 'Zoom in' }));
    });
    expect(image).toHaveStyle({ width: '225px' });
    await act(async () => {
      await user.click(within(dialog).getByRole('button', { name: 'Fit image' }));
    });
    expect(image).toHaveStyle({ width: '150px' });

    act(() => {
      viewportWidth = 300;
      viewportHeight = 800;
      resize();
    });
    expect(image).toHaveStyle({ width: '300px' });

    act(() => {
      viewportHeight = 599.5;
      resize();
    });
    // A fractional viewport must not round the fitted image past its lower edge.
    expect(image).toHaveStyle({ width: '299px' });
  });

  test('navigates a gallery by keyboard, resets zoom, and returns focus on Escape', async () => {
    const user = userEvent.setup();
    render(<CourseFigure><CourseImageRow>
      <img src="/first.webp" alt="First example" />
      <img src="/second.webp" alt="Second example" />
    </CourseImageRow></CourseFigure>);
    setNaturalSize(screen.getByAltText('First example'), 1000, 500);
    setNaturalSize(screen.getByAltText('Second example'), 1000, 1000);
    const trigger = screen.getByRole('button', { name: 'Enlarge image' });
    await act(async () => {
      await user.click(trigger);
    });
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Previous image' })).toBeDisabled();
    await act(async () => {
      await user.click(within(dialog).getByRole('button', { name: 'Zoom in' }));
    });
    await act(async () => {
      await user.keyboard('{ArrowRight}');
    });
    expect(within(dialog).getByAltText('Second example')).toHaveStyle({ width: '300px' });
    expect(within(dialog).getByRole('status')).toHaveTextContent('Image 2 of 2');
    expect(within(dialog).getByRole('button', { name: 'Next image' })).toBeDisabled();
    await act(async () => {
      await user.keyboard('{ArrowRight}');
    });
    expect(within(dialog).getByAltText('Second example')).toBeVisible();
    await act(async () => {
      await user.keyboard('{ArrowLeft}');
    });
    expect(within(dialog).getByAltText('First example')).toHaveStyle({ width: '600px' });
    await act(async () => {
      await user.keyboard('{Escape}');
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
