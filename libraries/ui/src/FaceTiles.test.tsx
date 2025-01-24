import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { FaceTiles } from './FaceTiles';

describe('FaceTiles', () => {
  const mockFaces = [
    { src: '/avatar1.jpg', alt: 'User 1' },
    { src: '/avatar2.jpg', alt: 'User 2' },
    { src: '/avatar3.jpg', alt: 'User 3' },
    { src: '/avatar4.jpg', alt: 'User 4' },
    { src: '/avatar5.jpg', alt: 'User 5' },
  ];

  test('renders default as expected', () => {
    const { container } = render(<FaceTiles faces={mockFaces} />);
    expect(container).toMatchSnapshot();
  });

  test('renders with custom maxDisplay', () => {
    const { container } = render(<FaceTiles faces={mockFaces} maxDisplay={3} />);
    expect(container).toMatchSnapshot();
  });

  test('renders with custom size', () => {
    const { container } = render(<FaceTiles faces={mockFaces} size={48} />);
    expect(container).toMatchSnapshot();
  });

  test('renders with custom className', () => {
    const { container } = render(<FaceTiles faces={mockFaces} className="custom-class" />);
    expect(container).toMatchSnapshot();
  });

  test('renders empty state', () => {
    const { container } = render(<FaceTiles faces={[]} />);
    expect(container).toMatchSnapshot();
  });
});
