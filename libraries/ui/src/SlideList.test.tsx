import { render, screen } from '@testing-library/react';
import {
  describe, it, expect, vi,
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
    nextButton.click();

    // Check second slide is visible
    expect(screen.getByText('Slide 2')).toBeDefined();
  });

  it('disables navigation when only one slide', () => {
    render(
      <SlideList title="Our courses">
        <SlideItem>Single Slide</SlideItem>
      </SlideList>,
    );

    expect(screen.getByLabelText('Previous slide')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('Next slide')).toHaveProperty('disabled', true);
  });
});
