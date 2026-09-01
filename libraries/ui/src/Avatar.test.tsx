import { describe, test, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Avatar, getInitials } from './Avatar';

describe('Avatar', () => {
  test('renders to snapshot', () => {
    const { container } = render(<Avatar name="Clara Ndubuisi" size="small" />);
    expect(container).toMatchSnapshot();
  });

  test('defaults to small', () => {
    const { container } = render(<Avatar name="Clara Ndubuisi" />);
    expect(container.firstChild).toHaveClass('size-11');
  });

  test('renders a decorative image when imageSrc is provided', () => {
    const { container } = render(<Avatar name="Clara Ndubuisi" imageSrc="/photo.jpg" size="medium" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('alt', '');
  });

  test('renders initials hidden from assistive tech when imageSrc is missing', () => {
    const { container } = render(<Avatar name="Clara Ndubuisi" size="small" />);
    const initials = container.querySelector('[aria-hidden="true"]');
    expect(initials).toHaveTextContent('CN');
  });

  test('falls back to initials when the image fails to load', () => {
    const { container } = render(<Avatar name="Clara Ndubuisi" imageSrc="/broken.jpg" size="small" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('CN');
  });
});

describe('getInitials', () => {
  it.each([
    ['Clara Ndubuisi', 'CN'],
    ['clara ndubuisi', 'CN'],
    ['Cher', 'C'],
    ['Jean-Luc Picard', 'JP'],
    ['Mary-Jane', 'M'],
    ['Foo Bar Baz', 'FB'],
    ['Mary Jane Watson Smith Jones', 'MJ'],
    ['  Foo   Bar  ', 'FB'],
    ['', ''],
    ['   ', ''],
    ['李明', '李'],
    ['Léa Dupont', 'LD'],
    ['😀 Bob', '😀B'],
  ])('getInitials(%j) returns %j', (input, expected) => {
    expect(getInitials(input)).toBe(expected);
  });
});
