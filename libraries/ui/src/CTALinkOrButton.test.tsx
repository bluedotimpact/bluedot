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
    expect(button.className).includes('bg-bluedot-normal');
    expect(button.className).includes('text-white');
  });

  test('renders chevron when withChevron is true', () => {
    render(<CTALinkOrButton withChevron>Click me</CTALinkOrButton>);
    const chevron = screen.getByAltText('→');
    expect(chevron).toBeTruthy();
    expect(chevron.getAttribute('src')).toBe('/icons/chevron_white.svg');
  });

  test('renders as a link when href is provided', () => {
    render(<CTALinkOrButton url="https://example.com" variant="primary">Click me</CTALinkOrButton>);
    const link = screen.getByTestId('cta-link');
    expect(link).toBeTruthy();
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.className).includes('bg-bluedot-normal');
    expect(link.className).includes('text-white');
  });
});
