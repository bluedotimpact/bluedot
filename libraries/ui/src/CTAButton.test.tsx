import {
  describe, expect, test,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import { CTAButton } from './CTAButton';

describe('CTAButton', () => {
  test('renders with primary variant by default', () => {
    render(<CTAButton>Click me</CTAButton>);
    const button = screen.getByTestId('cta-button');
    expect(button.className).includes('cta-button--primary');
  });

  test('renders chevron when withChevron is true', () => {
    render(<CTAButton withChevron>Click me</CTAButton>);
    const chevron = screen.getByAltText('→');
    expect(chevron).toBeTruthy();
    expect(chevron.getAttribute('src')).toBe('/icons/chevron_white.svg');
  });
});
