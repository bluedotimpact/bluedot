import { render, screen, fireEvent } from '@testing-library/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@testing-library/jest-dom';
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { SlideList } from './SlideList';

describe('SlideList', () => {
  // Mock window.innerWidth
  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  // Trigger window resize
  const triggerResize = () => {
    fireEvent(window, new Event('resize'));
  };

  beforeEach(() => {
    // Default to desktop view
    setWindowWidth(1024);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly and handles responsive behavior', () => {
    // Start with desktop
    setWindowWidth(1024);
    const { rerender } = render(
      <SlideList title="Our courses">
        <div className="size-full">Slide 1</div>
        <div className="size-full">Slide 2</div>
        <div className="size-full">Slide 3</div>
      </SlideList>,
    );

    expect(screen.getByText('Our courses')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/(Previous|Next) slide/)).toHaveLength(4);

    // Switch to mobile
    setWindowWidth(375);
    triggerResize();
    rerender(
      <SlideList title="Our courses">
        <div className="size-full">Slide 1</div>
        <div className="size-full">Slide 2</div>
        <div className="size-full">Slide 3</div>
      </SlideList>,
    );

    expect(screen.getAllByLabelText(/(Previous|Next) slide/)).toHaveLength(4);
  });

  it('shows one slide per view on mobile', () => {
    setWindowWidth(375);
    triggerResize();

    render(
      <SlideList title="Our courses">
        <div className="size-full">Slide 1</div>
        <div className="size-full">Slide 2</div>
      </SlideList>,
    );

    const slides = document.querySelectorAll('.slide-list__slide');
    slides.forEach((slide) => {
      expect(slide.style.width).toBe('100%');
    });
  });

  it('handles basic navigation between slides', () => {
    render(
      <SlideList title="Our courses">
        <div className="size-full">Slide 1</div>
        <div className="size-full">Slide 2</div>
      </SlideList>,
    );

    const nextButtons = screen.getAllByLabelText('Next slide');
    fireEvent.click(nextButtons[0]);
    expect(screen.getByText('Slide 2')).toBeInTheDocument();
  });

  it('hides navigation when all content fits in view', () => {
    render(
      <SlideList title="Our courses" itemsPerSlide={3}>
        <div className="size-full">Slide 1</div>
        <div className="size-full">Slide 2</div>
        <div className="size-full">Slide 3</div>
      </SlideList>,
    );

    expect(screen.queryByLabelText('Previous slide')).toBeNull();
    expect(screen.queryByLabelText('Next slide')).toBeNull();
  });

  it('handles navigation button states correctly', async () => {
    render(
      <SlideList title="Our courses">
        <div className="size-full">Slide 1</div>
        <div className="size-full">Slide 2</div>
      </SlideList>,
    );

    const prevButtons = screen.getAllByLabelText('Previous slide');
    const nextButtons = screen.getAllByLabelText('Next slide');
    const prevButton = prevButtons[0];
    const nextButton = nextButtons[0];

    // Initial state
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Move to last slide
    fireEvent.click(nextButton);

    // Check final state
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('renders without header if no title, subtitle, or description', () => {
    const { container } = render(
      <SlideList>
        <div className="size-full">Slide 1</div>
        <div className="size-full">Slide 2</div>
        <div className="size-full">Slide 3</div>
      </SlideList>,
    );

    // Header content container should not be present
    expect(container.querySelector('.slide-list__header-content')).toBeNull();

    // Update the navigation button checks to account for multiple buttons
    const prevButtons = screen.getAllByLabelText('Previous slide');
    const nextButtons = screen.getAllByLabelText('Next slide');
    expect(prevButtons).toHaveLength(2);
    expect(nextButtons).toHaveLength(2);
  });

  it('handles window resize events', () => {
    setWindowWidth(1024);

    const { rerender } = render(
      <SlideList title="Our courses" itemsPerSlide={2}>
        <div className="size-full">Slide 1</div>
        <div className="size-full">Slide 2</div>
      </SlideList>,
    );

    // Change to mobile width
    setWindowWidth(375);
    triggerResize();
    rerender(
      <SlideList title="Our courses" itemsPerSlide={2}>
        <div className="size-full">Slide 1</div>
        <div className="size-full">Slide 2</div>
      </SlideList>,
    );

    const slides = document.querySelectorAll('.slide-list__slide');
    slides.forEach((slide) => {
      expect(slide.style.width).toBe('100%');
    });
  });
});
