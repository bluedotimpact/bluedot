import {
  describe, expect, test,
  vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import { CTALinkOrButton } from './CTALinkOrButton';

describe('CTALinkOrButton', () => {
  test('renders with primary variant by default as a button', () => {
    render(<CTALinkOrButton>Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button.className).includes('cta-button--primary');
    expect(button).toMatchSnapshot();
  });

  test('renders chevron when withChevron is true', () => {
    render(<CTALinkOrButton withChevron>Click me</CTALinkOrButton>);
    const chevron = document.querySelector('.cta-button__chevron');
    expect(chevron).toMatchSnapshot();
  });

  test('renders back chevron when withBackChevron is true', () => {
    render(<CTALinkOrButton withBackChevron>Click me</CTALinkOrButton>);
    const chevron = document.querySelector('.cta-button__chevron');
    expect(chevron).toMatchSnapshot();
  });

  test('renders as a link when url is provided', () => {
    render(<CTALinkOrButton url="https://example.com" variant="secondary">Click me</CTALinkOrButton>);
    const link = screen.getByRole('link');
    expect(link).toBeTruthy();
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.className).includes('cta-button--secondary');
  });

  test('renders as a link when url and onClick is provided', () => {
    render(<CTALinkOrButton url="https://example.com" onClick={() => vi.fn()} variant="secondary">Click me</CTALinkOrButton>);
    const link = screen.getByRole('link');
    expect(link).toBeTruthy();
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.className).includes('cta-button--secondary');
  });

  test('renders as a button when no url is provided', () => {
    render(<CTALinkOrButton onClick={() => vi.fn()} variant="secondary">Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(button.tagName).toBe('BUTTON');
    expect(button.className).includes('cta-button--secondary');
  });
});
