import { render, screen } from '@testing-library/react';
import {
  describe, it, expect,
} from 'vitest';
import { SlideList, SlideItem } from './SlideList';

describe('SlideList', () => {
  it('renders correctly', () => {
    render(
      <SlideList title="Our courses">
        <SlideItem>Slide 1</SlideItem>
        <SlideItem>Slide 2</SlideItem>
        <SlideItem>Slide 3</SlideItem>
      </SlideList>,
    );

    // Check title renders
    expect(screen.getByText('Our courses')).toBeDefined();

    // Check navigation buttons render
    expect(screen.getByLabelText('Previous slide')).toBeDefined();
    expect(screen.getByLabelText('Next slide')).toBeDefined();

    // Check slides render
    expect(screen.getByText('Slide 1')).toBeDefined();
    expect(screen.getByText('Slide 2')).toBeDefined();
    expect(screen.getByText('Slide 3')).toBeDefined();
  });

  it('navigates between slides', () => {
    render(
      <SlideList title="Our courses" itemsPerSlide={1}>
        <SlideItem>Slide 1</SlideItem>
        <SlideItem>Slide 2</SlideItem>
      </SlideList>,
    );

    const nextButton = screen.getByLabelText('Next slide');
    const prevButton = screen.getByLabelText('Previous slide');

    // Move to second slide
    nextButton.click();
    expect(screen.getByText('Slide 2')).toBeDefined();

    // Move back to first slide
    prevButton.click();
    expect(screen.getByText('Slide 1')).toBeDefined();
  });

  it('hides navigation when only one slide', () => {
    render(
      <SlideList title="Our courses">
        <SlideItem>Single Slide</SlideItem>
      </SlideList>,
    );

    // Navigation buttons should not be present in the DOM
    expect(screen.queryByLabelText('Previous slide')).toBeNull();
    expect(screen.queryByLabelText('Next slide')).toBeNull();
  });

  it('disables previous button on first slide', () => {
    render(
      <SlideList title="Our courses" itemsPerSlide={1}>
        <SlideItem>Slide 1</SlideItem>
        <SlideItem>Slide 2</SlideItem>
      </SlideList>,
    );

    expect(screen.getByLabelText('Previous slide')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('Next slide')).toHaveProperty('disabled', false);
  });

  it('disables next button on last slide', async () => {
    render(
      <SlideList title="Our courses" itemsPerSlide={1}>
        <SlideItem>Slide 1</SlideItem>
        <SlideItem>Slide 2</SlideItem>
      </SlideList>,
    );

    const prevButton = screen.getByLabelText('Previous slide');
    const nextButton = screen.getByLabelText('Next slide');

    // First verify initial state
    expect(prevButton).toHaveProperty('disabled', true);
    expect(nextButton).toHaveProperty('disabled', false);

    // Move to last slide
    nextButton.click();

    // Wait for state update
    await screen.findByText('Slide 2');

    // On last slide, previous should be enabled and next disabled
    expect(prevButton).toHaveProperty('disabled', false);
    expect(nextButton).toHaveProperty('disabled', true);
  });
});
