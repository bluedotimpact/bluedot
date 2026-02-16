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

  test('renders with black variant', () => {
    render(<CTALinkOrButton variant="black">Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(button.className).includes('cta-button--black');
    expect(button.className).includes('bg-bluedot-darker');
  });

  test('renders with outline-black variant', () => {
    render(<CTALinkOrButton variant="outline-black">Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(button.className).includes('cta-button--outline-black');
    expect(button.className).includes('border-bluedot-navy/30');
    expect(button.className).includes('text-black');
  });

  test('renders with ghost variant', () => {
    render(<CTALinkOrButton variant="ghost">Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(button.className).includes('text-bluedot-navy/60');
    expect(button.className).includes('hover:text-bluedot-navy');
    expect(button.className).includes('hover:bg-bluedot-navy/10');
  });

  test('renders with medium size by default', () => {
    render(<CTALinkOrButton>Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button.className).includes('text-sm');
    expect(button.className).includes('px-4');
    expect(button.className).includes('py-3');
  });

  test('renders with small size', () => {
    render(<CTALinkOrButton size="small">Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button.className).includes('text-[13px]');
    expect(button.className).includes('px-3');
    expect(button.className).includes('py-2.5');
    expect(button.className).includes('h-9');
  });

  test('renders small black variant with chevron', () => {
    render(<CTALinkOrButton size="small" variant="black" withChevron>Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button.className).includes('cta-button--black');
    expect(button.className).includes('h-9');
    const chevron = document.querySelector('.cta-button__chevron');
    expect(chevron).toBeTruthy();
  });

  test('renders small ghost variant', () => {
    render(<CTALinkOrButton size="small" variant="ghost">Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button.className).includes('text-bluedot-navy/60');
    expect(button.className).includes('h-9');
  });
});
