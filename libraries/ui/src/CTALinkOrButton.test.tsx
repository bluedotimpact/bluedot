import {
  describe, expect, test,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import { CTALinkOrButton } from './CTALinkOrButton';

describe('CTALinkOrButton', () => {
  test('renders with primary variant by default as a button', () => {
    render(<CTALinkOrButton>Click me</CTALinkOrButton>);
    const button = screen.getByTestId('cta-button');
    expect(button.className).includes('cta-button--primary');
  });

  test('renders chevron when withChevron is true', () => {
    render(<CTALinkOrButton withChevron>Click me</CTALinkOrButton>);
    const chevron = screen.getByAltText('→');
    expect(chevron).toBeTruthy();
    expect(chevron.getAttribute('src')).toBe('/icons/chevron_white.svg');
  });
});
